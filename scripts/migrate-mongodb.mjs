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
  const legacyResult = await members.updateMany(
    { status: { $exists: false } },
    [{ $set: { status: "approved", updated_at: { $ifNull: ["$updated_at", "$created_at"] }, schema_version: 3 } }],
  );

  let normalizedCount = 0;
  let operations = [];
  const cursor = members.find({}, { projection: { email: 1, contact_number: 1, business_name: 1 } });
  for await (const member of cursor) {
    operations.push({
      updateOne: {
        filter: { _id: member._id },
        update: {
          $set: {
            email_normalized: normalizeEmail(member.email),
            contact_number_normalized: normalizePhone(member.contact_number),
            business_name_normalized: normalizeBusinessName(member.business_name),
            schema_version: 3,
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
    admins.createIndex({ email: 1 }, { unique: true }),
    rateLimits.createIndex({ key: 1 }, { unique: true }),
    rateLimits.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }),
  ]);
  console.log(`MongoDB migration complete. Backfilled ${legacyResult.modifiedCount} legacy listing(s), normalized ${normalizedCount} listing(s), and flagged ${duplicateSignals.size} possible duplicate(s).`);
} catch {
  console.error("MongoDB migration could not connect. Check that the Atlas cluster is active and this machine is in the project's IP access list.");
  process.exitCode = 1;
} finally {
  await client.close();
}
