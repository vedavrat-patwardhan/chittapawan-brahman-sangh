import { createHash, randomBytes } from "node:crypto";

import type { Filter, ObjectId } from "mongodb";

import { getBusinessCategories } from "@/lib/categories";
import {
  findPotentialDuplicates,
  refreshDuplicateRisk,
} from "@/lib/directory-queries";
import { normalizedMemberIdentity } from "@/lib/member-normalization";
import {
  changeRequestsCollection,
  editTokensCollection,
  membersCollection,
  parseObjectId,
} from "@/lib/mongodb";
import type { DirectoryCorrectionInput } from "@/lib/validation/member.schema";
import {
  type ChangeRequestStatus,
  type DirectoryChangeValue,
  type DirectoryMemberDocument,
  type MemberReviewer,
} from "@/types/member";

const TOKEN_LIFETIME_MS = 14 * 24 * 60 * 60 * 1_000;
const CORRECTION_FIELDS = [
  "full_name",
  "business_name",
  "contact_number",
  "whatsapp_number",
  "email",
  "city",
  "area_locality",
  "business_category",
  "sub_category",
  "products_services",
  "business_address",
  "service_area",
  "website",
  "instagram",
  "facebook",
  "linkedin",
] as const;

type CorrectionField = (typeof CORRECTION_FIELDS)[number];

const approvedMemberFilter: Filter<DirectoryMemberDocument> = {
  $or: [{ status: "approved" }, { status: { $exists: false } }],
};

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function comparable(value: unknown): string | string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .sort();
  }
  return typeof value === "string" ? value.trim() : "";
}

function sameValue(left: unknown, right: unknown): boolean {
  const a = comparable(left);
  const b = comparable(right);
  return Array.isArray(a) || Array.isArray(b)
    ? JSON.stringify(a) === JSON.stringify(b)
    : a === b;
}

function storedValue(value: string | string[]): DirectoryChangeValue {
  if (Array.isArray(value)) return value;
  return value.length ? value : null;
}

export type CorrectionContext = {
  memberId: string;
  expiresAt: string;
  businessCategories: string[];
  listing: Record<CorrectionField, string | string[]>;
};

export async function issueCorrectionToken(
  memberId: string,
  reviewer: MemberReviewer,
): Promise<{ path: string; expiresAt: string } | null> {
  const oid = parseObjectId(memberId);
  if (!oid) return null;
  const members = await membersCollection();
  const member = await members.findOne({ $and: [{ _id: oid }, approvedMemberFilter] });
  if (!member) return null;

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_MS);
  const tokens = await editTokensCollection();
  const result = await tokens.insertOne({
    member_id: oid,
    token_hash: tokenHash(token),
    created_at: now,
    expires_at: expiresAt,
    created_by: reviewer,
    used_at: null,
    revoked_at: null,
  });
  await tokens.updateMany(
    {
      _id: { $ne: result.insertedId },
      member_id: oid,
      used_at: null,
      revoked_at: null,
    },
    { $set: { revoked_at: now } },
  );
  return {
    path: `/update/${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

async function validToken(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const tokens = await editTokensCollection();
  const tokenDocument = await tokens.findOne({
    token_hash: tokenHash(token),
    expires_at: { $gt: new Date() },
    used_at: null,
    revoked_at: null,
  });
  if (!tokenDocument) return null;
  const requests = await changeRequestsCollection();
  const existing = await requests.findOne(
    { token_id: tokenDocument._id },
    { projection: { _id: 1 } },
  );
  return existing ? null : tokenDocument;
}

export async function getCorrectionContext(
  token: string,
): Promise<CorrectionContext | null> {
  const tokenDocument = await validToken(token);
  if (!tokenDocument) return null;
  const members = await membersCollection();
  const member = await members.findOne({
    $and: [{ _id: tokenDocument.member_id }, approvedMemberFilter],
  });
  if (!member) return null;

  const listing = {} as Record<CorrectionField, string | string[]>;
  for (const field of CORRECTION_FIELDS) {
    const value = member[field];
    listing[field] = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : typeof value === "string"
        ? value
        : "";
  }
  return {
    memberId: member._id.toString(),
    expiresAt: tokenDocument.expires_at.toISOString(),
    businessCategories: Array.from(
      new Set([
        ...(await getBusinessCategories()),
        member.business_category,
      ]),
    ),
    listing,
  };
}

export async function createChangeRequest(
  token: string,
  input: DirectoryCorrectionInput,
): Promise<string | null> {
  const tokenDocument = await validToken(token);
  if (!tokenDocument) return null;
  const members = await membersCollection();
  const member = await members.findOne({
    $and: [{ _id: tokenDocument.member_id }, approvedMemberFilter],
  });
  if (!member) return null;

  const changes: Record<string, DirectoryChangeValue> = {};
  for (const field of CORRECTION_FIELDS) {
    const nextValue = input[field];
    if (!sameValue(member[field], nextValue)) {
      changes[field] = storedValue(nextValue);
    }
  }
  if (!Object.keys(changes).length && !input.owner_note) return "unchanged";

  const now = new Date();
  const requests = await changeRequestsCollection();
  const result = await requests.insertOne({
    member_id: member._id,
    token_id: tokenDocument._id,
    submitted_at: now,
    status: "pending",
    changes,
    owner_note: input.owner_note || null,
    reviewed_at: null,
    reviewed_by: null,
    admin_note: null,
  });
  await (await editTokensCollection()).updateOne(
    { _id: tokenDocument._id, used_at: null },
    { $set: { used_at: now } },
  );
  return result.insertedId.toString();
}

export type ChangeRequestListItem = {
  id: string;
  member_id: string;
  submitted_at: string;
  status: ChangeRequestStatus;
  change_count: number;
  owner_note: string | null;
  full_name: string;
  business_name: string;
};

export async function listChangeRequests(
  status: ChangeRequestStatus | "all" = "pending",
): Promise<ChangeRequestListItem[]> {
  const requests = await changeRequestsCollection();
  const query = status === "all" ? {} : { status };
  const docs = await requests.find(query).sort({ submitted_at: -1 }).limit(200).toArray();
  const memberIds = Array.from(new Set(docs.map((doc) => doc.member_id.toString())))
    .map(parseObjectId)
    .filter((id): id is ObjectId => Boolean(id));
  const members = await membersCollection();
  const memberDocs = memberIds.length
    ? await members
        .find(
          { _id: { $in: memberIds } },
          { projection: { full_name: 1, business_name: 1 } },
        )
        .toArray()
    : [];
  const byId = new Map(memberDocs.map((member) => [member._id.toString(), member]));
  return docs.map((doc) => {
    const member = byId.get(doc.member_id.toString());
    return {
      id: doc._id.toString(),
      member_id: doc.member_id.toString(),
      submitted_at: doc.submitted_at.toISOString(),
      status: doc.status,
      change_count: Object.keys(doc.changes).length,
      owner_note: doc.owner_note,
      full_name: member?.full_name ?? "Unknown owner",
      business_name: member?.business_name ?? "Listing unavailable",
    };
  });
}

export async function countPendingChangeRequests(): Promise<number> {
  return (await changeRequestsCollection()).countDocuments({ status: "pending" });
}

export type ChangeRequestDetail = ChangeRequestListItem & {
  changes: Record<string, DirectoryChangeValue>;
  current: Record<string, unknown>;
  reviewed_at: string | null;
  reviewed_by: MemberReviewer | null;
  admin_note: string | null;
};

export async function getChangeRequest(id: string): Promise<ChangeRequestDetail | null> {
  const oid = parseObjectId(id);
  if (!oid) return null;
  const requests = await changeRequestsCollection();
  const request = await requests.findOne({ _id: oid });
  if (!request) return null;
  const members = await membersCollection();
  const member = await members.findOne({ _id: request.member_id });
  if (!member) return null;
  return {
    id: request._id.toString(),
    member_id: member._id.toString(),
    submitted_at: request.submitted_at.toISOString(),
    status: request.status,
    change_count: Object.keys(request.changes).length,
    owner_note: request.owner_note,
    full_name: member.full_name,
    business_name: member.business_name,
    changes: request.changes,
    current: Object.fromEntries(
      CORRECTION_FIELDS.map((field) => [field, member[field] ?? null]),
    ),
    reviewed_at: request.reviewed_at?.toISOString() ?? null,
    reviewed_by: request.reviewed_by,
    admin_note: request.admin_note,
  };
}

export async function reviewChangeRequest(input: {
  id: string;
  decision: "approved" | "rejected";
  reviewer: MemberReviewer;
  adminNote?: string;
}): Promise<boolean> {
  const oid = parseObjectId(input.id);
  if (!oid) return false;
  const requests = await changeRequestsCollection();
  const now = new Date();
  const request = await requests.findOneAndUpdate(
    { _id: oid, status: "pending" },
    { $set: { status: "processing" } },
    { returnDocument: "after" },
  );
  if (!request) return false;

  if (input.decision === "rejected") {
    await requests.updateOne(
      { _id: oid, status: "processing" },
      {
        $set: {
          status: "rejected",
          reviewed_at: now,
          reviewed_by: input.reviewer,
          admin_note: input.adminNote?.trim() || null,
        },
      },
    );
    return true;
  }

  const members = await membersCollection();
  const current = await members.findOne({ _id: request.member_id });
  if (!current) {
    await requests.updateOne(
      { _id: oid, status: "processing" },
      { $set: { status: "pending" } },
    );
    return false;
  }
  const oldDuplicates = await findPotentialDuplicates(current, current._id.toString());
  const setValues: Record<string, unknown> = {
    ...request.changes,
    updated_at: now,
    last_verified_at: now,
    verification_due_at: new Date(
      Date.UTC(
        now.getUTCFullYear() + 1,
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds(),
      ),
    ),
    last_verified_by: input.reviewer,
    schema_version: 4,
  };
  const nextIdentity = {
    email:
      typeof request.changes.email === "string"
        ? request.changes.email
        : current.email,
    contact_number:
      typeof request.changes.contact_number === "string"
        ? request.changes.contact_number
        : current.contact_number,
    business_name:
      typeof request.changes.business_name === "string"
        ? request.changes.business_name
        : current.business_name,
  };
  Object.assign(setValues, normalizedMemberIdentity(nextIdentity));
  const updated = await members.updateOne(
    { _id: request.member_id },
    { $set: setValues },
  );
  if (updated.matchedCount !== 1) {
    await requests.updateOne(
      { _id: oid, status: "processing" },
      { $set: { status: "pending" } },
    );
    return false;
  }
  await requests.updateOne(
    { _id: oid, status: "processing" },
    {
      $set: {
        status: "approved",
        reviewed_at: now,
        reviewed_by: input.reviewer,
        admin_note: input.adminNote?.trim() || null,
      },
    },
  );

  const affected = new Set([
    current._id.toString(),
    ...oldDuplicates.map((candidate) => candidate.id),
  ]);
  const newDuplicates = await refreshDuplicateRisk(current._id.toString());
  newDuplicates.forEach((id) => affected.add(id));
  await Promise.all(
    Array.from(affected)
      .filter((id) => id !== current._id.toString())
      .map((id) => refreshDuplicateRisk(id)),
  );
  return true;
}
