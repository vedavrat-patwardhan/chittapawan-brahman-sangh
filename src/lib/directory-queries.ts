import type { Filter } from "mongodb";
import { cache } from "react";

import {
  normalizeBusinessName,
  normalizeEmail,
  normalizePhone,
  normalizedMemberIdentity,
} from "@/lib/member-normalization";
import { membersCollection, parseObjectId } from "@/lib/mongodb";
import type { DirectoryMemberInsertInput } from "@/lib/validation/member.schema";
import {
  effectiveListingStatus,
  mapMemberRow,
  type AdminApplicationListItem,
  type DirectoryMemberDocument,
  type DuplicateCandidate,
  type DuplicateMatchField,
  type ListingStatus,
  type MemberListItem,
  type MemberReviewer,
} from "@/types/member";

export const PAGE_SIZE = 20;

export type MemberListFilters = {
  search?: string;
  category?: string;
  city?: string;
  business_type?: string;
  page: number;
};

export type ApplicationListFilters = {
  search?: string;
  status?: ListingStatus | "all";
  page: number;
};

export type ApplicationCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
};

const APPROVED_MEMBER_FILTER: Filter<DirectoryMemberDocument> = {
  $or: [{ status: "approved" }, { status: { $exists: false } }],
};

function escapeRegex(q: string) {
  return q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim();
}

function serializeMember(
  doc: DirectoryMemberDocument & { _id: { toString(): string } },
): Record<string, unknown> {
  const { _id, created_at, updated_at, reviewed_at, ...rest } = doc;
  return {
    ...rest,
    id: String(_id),
    created_at:
      created_at instanceof Date ? created_at.toISOString() : String(created_at),
    updated_at:
      updated_at instanceof Date
        ? updated_at.toISOString()
        : updated_at
          ? String(updated_at)
          : created_at instanceof Date
            ? created_at.toISOString()
            : String(created_at),
    reviewed_at:
      reviewed_at instanceof Date
        ? reviewed_at.toISOString()
        : reviewed_at
          ? String(reviewed_at)
          : null,
    status: effectiveListingStatus(doc.status),
  };
}

export async function listMembers(
  filters: MemberListFilters,
): Promise<{ rows: MemberListItem[]; total: number; page: number; pageCount: number }> {
  const page = Number.isFinite(filters.page) ? Math.max(1, filters.page) : 1;
  const skip = (page - 1) * PAGE_SIZE;
  const members = await membersCollection();

  const clauses: Filter<DirectoryMemberDocument>[] = [APPROVED_MEMBER_FILTER];

  const cat = filters.category?.trim();
  if (cat) clauses.push({ business_category: cat });

  const city = escapeRegex(filters.city ?? "");
  if (city.length) {
    clauses.push({ city: { $regex: city, $options: "i" } });
  }

  const btype = filters.business_type?.trim();
  if (btype) clauses.push({ business_types: btype });

  const search = escapeRegex(filters.search ?? "");
  if (search.length) {
    const field = { $regex: search, $options: "i" };
    clauses.push({
      $or: [
        { full_name: field },
        { business_name: field },
        { keywords_tags: field },
        { sub_category: field },
        { products_services: field },
      ],
    });
  }

  const query: Filter<DirectoryMemberDocument> =
    clauses.length === 1 ? clauses[0]! : { $and: clauses };

  const [docs, total] = await Promise.all([
    members
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .toArray(),
    members.countDocuments(query),
  ]);

  const rows = docs.map((doc) => mapMemberRow(serializeMember(doc)));

  return {
    rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export const getMemberById = cache(async function getMemberById(
  id: string,
): Promise<Record<string, unknown> | null> {
  const oid = parseObjectId(id);
  if (!oid) return null;
  const members = await membersCollection();
  const doc = await members.findOne({
    $and: [{ _id: oid }, APPROVED_MEMBER_FILTER],
  });
  if (!doc) return null;
  return serializeMember(doc);
});

export async function insertMember(
  payload: DirectoryMemberInsertInput,
): Promise<string> {
  const members = await membersCollection();
  const identity = normalizedMemberIdentity(payload);
  const duplicateCandidates = await findPotentialDuplicates(payload);
  const duplicateMatchFields = Array.from(
    new Set(duplicateCandidates.flatMap((candidate) => candidate.matched_on)),
  );
  const result = await members.insertOne({
    created_at: new Date(),
    updated_at: new Date(),
    status: "pending",
    reviewed_at: null,
    reviewed_by: null,
    admin_note: null,
    rejection_reason: null,
    schema_version: 3,
    ...identity,
    duplicate_risk: duplicateCandidates.length > 0,
    duplicate_match_fields: duplicateMatchFields,
    full_name: payload.full_name,
    business_name: payload.business_name,
    profile_photo_path: payload.profile_photo_path ?? null,
    contact_number: payload.contact_number,
    whatsapp_number: payload.whatsapp_number ?? null,
    email: payload.email,
    city: payload.city,
    area_locality: payload.area_locality ?? null,
    business_category: payload.business_category,
    sub_category: payload.sub_category,
    business_types: payload.business_types,
    keywords_tags: payload.keywords_tags,
    products_services: payload.products_services,
    specialization: payload.specialization ?? null,
    years_experience: payload.years_experience ?? null,
    price_ranges: payload.price_ranges ?? [],
    business_address: payload.business_address ?? null,
    service_area: payload.service_area,
    google_maps_link: payload.google_maps_link ?? null,
    website: payload.website ?? null,
    instagram: payload.instagram ?? null,
    facebook: payload.facebook ?? null,
    linkedin: payload.linkedin ?? null,
    usp: payload.usp ?? null,
    certifications: payload.certifications ?? null,
    awards: payload.awards ?? null,
    looking_for: payload.looking_for,
    preferred_categories_connect: payload.preferred_categories_connect,
    portfolio_paths: payload.portfolio_paths ?? [],
    visiting_card_path: payload.visiting_card_path ?? null,
    target_customers: payload.target_customers ?? null,
    referred_by: payload.referred_by ?? null,
    consent_share: payload.consent_share,
  });
  if (duplicateCandidates.length) {
    await members.bulkWrite(
      duplicateCandidates.map((candidate) => ({
        updateOne: {
          filter: { _id: parseObjectId(candidate.id)! },
          update: {
            $set: { duplicate_risk: true },
            $addToSet: {
              duplicate_match_fields: { $each: candidate.matched_on },
            },
          },
        },
      })),
      { ordered: false },
    );
  }
  return result.insertedId.toString();
}

function applicationStatusFilter(
  status: ListingStatus | "all" | undefined,
): Filter<DirectoryMemberDocument> {
  if (!status || status === "all") return {};
  if (status === "approved") return APPROVED_MEMBER_FILTER;
  return { status };
}

function searchFilter(searchValue: string | undefined): Filter<DirectoryMemberDocument> {
  const search = escapeRegex(searchValue ?? "");
  if (!search) return {};
  const field = { $regex: search, $options: "i" as const };
  return {
    $or: [
      { full_name: field },
      { business_name: field },
      { email: field },
      { contact_number: field },
      { business_category: field },
      { city: field },
    ],
  };
}

export async function listApplications(
  filters: ApplicationListFilters,
): Promise<{
  rows: AdminApplicationListItem[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const page = Number.isFinite(filters.page) ? Math.max(1, filters.page) : 1;
  const clauses = [
    applicationStatusFilter(filters.status),
    searchFilter(filters.search),
  ].filter((clause) => Object.keys(clause).length > 0);
  const query: Filter<DirectoryMemberDocument> =
    clauses.length === 0
      ? {}
      : clauses.length === 1
        ? clauses[0]!
        : { $and: clauses };
  const members = await membersCollection();
  const [docs, total] = await Promise.all([
    members
      .find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    members.countDocuments(query),
  ]);

  return {
    rows: docs.map((doc) => {
      const serialized = serializeMember(doc);
      return {
        ...mapMemberRow(serialized),
        status: effectiveListingStatus(serialized.status),
        updated_at: String(serialized.updated_at),
        reviewed_at:
          typeof serialized.reviewed_at === "string"
            ? serialized.reviewed_at
            : null,
        duplicate_risk: serialized.duplicate_risk === true,
        duplicate_match_fields: Array.isArray(serialized.duplicate_match_fields)
          ? (serialized.duplicate_match_fields as DuplicateMatchField[])
          : [],
      };
    }),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getApplicationCounts(): Promise<ApplicationCounts> {
  const members = await membersCollection();
  const [all, pending, approved, rejected] = await Promise.all([
    members.countDocuments(),
    members.countDocuments({ status: "pending" }),
    members.countDocuments(APPROVED_MEMBER_FILTER),
    members.countDocuments({ status: "rejected" }),
  ]);
  return { all, pending, approved, rejected };
}

export async function getAdminApplicationById(
  id: string,
): Promise<Record<string, unknown> | null> {
  const oid = parseObjectId(id);
  if (!oid) return null;
  const members = await membersCollection();
  const doc = await members.findOne({ _id: oid });
  return doc ? serializeMember(doc) : null;
}

type DuplicateIdentityInput = Pick<
  DirectoryMemberDocument,
  "email" | "contact_number" | "business_name"
>;

export async function findPotentialDuplicates(
  input: DuplicateIdentityInput,
  excludeId?: string,
): Promise<DuplicateCandidate[]> {
  const identity = normalizedMemberIdentity(input);
  const clauses: Filter<DirectoryMemberDocument>[] = [
    { email_normalized: identity.email_normalized },
    { contact_number_normalized: identity.contact_number_normalized },
    { business_name_normalized: identity.business_name_normalized },
    {
      email: {
        $regex: `^${escapeRegex(input.email)}$`,
        $options: "i",
      },
    },
    {
      business_name: {
        $regex: `^${escapeRegex(input.business_name)}$`,
        $options: "i",
      },
    },
  ];
  if (input.contact_number.trim()) {
    clauses.push({ contact_number: input.contact_number.trim() });
  }

  const oid = excludeId ? parseObjectId(excludeId) : null;
  const duplicateQuery: Filter<DirectoryMemberDocument> = { $or: clauses };
  const query: Filter<DirectoryMemberDocument> = oid
    ? { $and: [{ _id: { $ne: oid } }, duplicateQuery] }
    : duplicateQuery;
  const members = await membersCollection();
  const docs = await members
    .find(query, {
      projection: {
        full_name: 1,
        business_name: 1,
        email: 1,
        contact_number: 1,
        status: 1,
      },
    })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();

  return docs.map((doc) => {
    const matchedOn: DuplicateMatchField[] = [];
    if (normalizeEmail(doc.email) === identity.email_normalized) {
      matchedOn.push("email");
    }
    if (normalizePhone(doc.contact_number) === identity.contact_number_normalized) {
      matchedOn.push("phone");
    }
    if (normalizeBusinessName(doc.business_name) === identity.business_name_normalized) {
      matchedOn.push("business_name");
    }
    return {
      id: doc._id.toString(),
      full_name: doc.full_name,
      business_name: doc.business_name,
      status: effectiveListingStatus(doc.status),
      matched_on: matchedOn,
    };
  });
}

export async function refreshDuplicateRisk(id: string): Promise<string[]> {
  const oid = parseObjectId(id);
  if (!oid) return [];
  const members = await membersCollection();
  const member = await members.findOne(
    { _id: oid },
    {
      projection: {
        email: 1,
        contact_number: 1,
        business_name: 1,
      },
    },
  );
  if (!member) return [];
  const candidates = await findPotentialDuplicates(member, id);
  const matchFields = Array.from(
    new Set(candidates.flatMap((candidate) => candidate.matched_on)),
  );
  await members.updateOne(
    { _id: oid },
    {
      $set: {
        duplicate_risk: candidates.length > 0,
        duplicate_match_fields: matchFields,
      },
    },
  );
  return candidates.map((candidate) => candidate.id);
}

export async function exportApplications(
  filters: Pick<ApplicationListFilters, "search" | "status">,
): Promise<Array<Record<string, unknown>>> {
  const clauses = [
    applicationStatusFilter(filters.status),
    searchFilter(filters.search),
  ].filter((clause) => Object.keys(clause).length > 0);
  const query: Filter<DirectoryMemberDocument> =
    clauses.length === 0
      ? {}
      : clauses.length === 1
        ? clauses[0]!
        : { $and: clauses };
  const members = await membersCollection();
  const docs = await members.find(query).sort({ created_at: -1 }).toArray();
  return docs.map(serializeMember);
}

export async function reviewApplication(input: {
  id: string;
  status: Exclude<ListingStatus, "pending">;
  adminNote?: string;
  rejectionReason?: string;
  reviewer: MemberReviewer;
}): Promise<boolean> {
  const oid = parseObjectId(input.id);
  if (!oid) return false;
  const now = new Date();
  const members = await membersCollection();
  const result = await members.updateOne(
    { _id: oid },
    {
      $set: {
        status: input.status,
        updated_at: now,
        reviewed_at: now,
        reviewed_by: input.reviewer,
        admin_note: input.adminNote?.trim() || null,
        rejection_reason:
          input.status === "rejected"
            ? input.rejectionReason?.trim() || null
            : null,
        schema_version: 3,
      },
    },
  );
  return result.matchedCount === 1;
}

export async function isUploadPublic(uploadId: string): Promise<boolean> {
  const members = await membersCollection();
  const result = await members.findOne(
    {
      $and: [
        APPROVED_MEMBER_FILTER,
        {
          $or: [
            { profile_photo_path: uploadId },
            { portfolio_paths: uploadId },
            { visiting_card_path: uploadId },
          ],
        },
      ],
    },
    { projection: { _id: 1 } },
  );
  return Boolean(result);
}
