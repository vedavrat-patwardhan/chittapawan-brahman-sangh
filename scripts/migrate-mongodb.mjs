import { MongoClient } from "mongodb";

function normalizeEmail(value) {
  return String(value ?? "").trim().toLocaleLowerCase("en");
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeBusinessName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value ?? Number.NaN);
  return Number.isNaN(date.getTime()) ? null : date;
}

function oneYearAfter(value) {
  const date = new Date(value);
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date;
}

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB?.trim() || "chitpavan";
if (!uri) throw new Error("Missing MONGODB_URI in .env.local or .env");

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(dbName);
  const members = db.collection("directory_members");
  const admins = db.collection("directory_admins");
  const rateLimits = db.collection("rate_limits");
  const editTokens = db.collection("directory_edit_tokens");
  const changeRequests = db.collection("directory_change_requests");
  const settings = db.collection("directory_settings");
  const legacyResult = await members.updateMany(
    { status: { $exists: false } },
    [{ $set: { status: "approved", updated_at: { $ifNull: ["$updated_at", "$created_at"] }, schema_version: 3 } }],
  );

  let normalizedCount = 0;
  let operations = [];
  const cursor = members.find({}, { projection: { email: 1, contact_number: 1, business_name: 1, status: 1, created_at: 1, updated_at: 1, reviewed_at: 1, last_verified_at: 1, verification_due_at: 1, schema_version: 1 } });
  for await (const member of cursor) {
    const lastVerifiedAt =
      member.status === "approved"
        ? validDate(member.last_verified_at) ??
          validDate(member.reviewed_at) ??
          validDate(member.updated_at) ??
          validDate(member.created_at)
        : null;
    const verificationDueAt =
      member.status === "approved" && lastVerifiedAt
        ? validDate(member.verification_due_at) ?? oneYearAfter(lastVerifiedAt)
        : null;
    operations.push({
      updateOne: {
        filter: { _id: member._id },
        update: {
          $set: {
            email_normalized: normalizeEmail(member.email),
            contact_number_normalized: normalizePhone(member.contact_number),
            business_name_normalized: normalizeBusinessName(member.business_name),
            ...(lastVerifiedAt
              ? {
                  last_verified_at: lastVerifiedAt,
                  verification_due_at: verificationDueAt,
                }
              : {}),
            schema_version:
              member.status === "approved"
                ? Math.max(Number(member.schema_version) || 0, 4)
                : Math.max(Number(member.schema_version) || 0, 3),
          },
        },
      },
    });
    if (operations.length === 500) {
      const result = await members.bulkWrite(operations, { ordered: false });
      normalizedCount += result.modifiedCount;
      operations = [];
    }
  }
  if (operations.length) {
    const result = await members.bulkWrite(operations, { ordered: false });
    normalizedCount += result.modifiedCount;
  }

  await members.updateMany(
    {},
    { $set: { duplicate_risk: false, duplicate_match_fields: [] } },
  );
  const duplicateSignals = new Map();
  const duplicateFields = [
    ["email_normalized", "email"],
    ["contact_number_normalized", "phone"],
    ["business_name_normalized", "business_name"],
  ];
  for (const [databaseField, signal] of duplicateFields) {
    const groups = await members
      .aggregate([
        { $match: { [databaseField]: { $exists: true, $ne: "" } } },
        {
          $group: {
            _id: `$${databaseField}`,
            member_ids: { $addToSet: "$_id" },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();
    for (const group of groups) {
      for (const memberId of group.member_ids) {
        const key = memberId.toString();
        const entry = duplicateSignals.get(key) ?? {
          id: memberId,
          fields: new Set(),
        };
        entry.fields.add(signal);
        duplicateSignals.set(key, entry);
      }
    }
  }
  if (duplicateSignals.size) {
    await members.bulkWrite(
      Array.from(duplicateSignals.values(), ({ id, fields }) => ({
        updateOne: {
          filter: { _id: id },
          update: {
            $set: {
              duplicate_risk: true,
              duplicate_match_fields: Array.from(fields),
            },
          },
        },
      })),
      { ordered: false },
    );
  }

  await Promise.all([
    members.createIndex({ created_at: -1 }),
    members.createIndex({ status: 1, created_at: -1 }),
    members.createIndex({ status: 1, business_category: 1, created_at: -1 }),
    members.createIndex({ business_category: 1 }),
    members.createIndex({ city: 1 }),
    members.createIndex({ business_types: 1 }),
    members.createIndex({ email_normalized: 1 }),
    members.createIndex({ contact_number_normalized: 1 }),
    members.createIndex({ business_name_normalized: 1 }),
    members.createIndex({ status: 1, verification_due_at: 1 }),
    admins.createIndex({ email: 1 }, { unique: true }),
    rateLimits.createIndex({ key: 1 }, { unique: true }),
    rateLimits.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }),
    editTokens.createIndex({ token_hash: 1 }, { unique: true }),
    editTokens.createIndex({ member_id: 1, created_at: -1 }),
    editTokens.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }),
    changeRequests.createIndex({ token_id: 1 }, { unique: true }),
    changeRequests.createIndex({ status: 1, submitted_at: -1 }),
    changeRequests.createIndex({ member_id: 1, submitted_at: -1 }),
    settings.createIndex({ key: 1 }, { unique: true }),
  ]);
  console.log(`MongoDB migration complete. Backfilled ${legacyResult.modifiedCount} legacy listing(s), normalized ${normalizedCount} listing(s), and flagged ${duplicateSignals.size} possible duplicate(s).`);
} catch {
  console.error("MongoDB migration could not connect. Check that the Atlas cluster is active and this machine is in the project's IP access list.");
  process.exitCode = 1;
} finally {
  await client.close();
}
