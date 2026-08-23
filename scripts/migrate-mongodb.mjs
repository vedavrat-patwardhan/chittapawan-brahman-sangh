import { MongoClient } from "mongodb";

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
    [{ $set: { status: "approved", updated_at: { $ifNull: ["$updated_at", "$created_at"] }, schema_version: 2 } }],
  );

  await Promise.all([
    members.createIndex({ created_at: -1 }),
    members.createIndex({ status: 1, created_at: -1 }),
    members.createIndex({ status: 1, business_category: 1, created_at: -1 }),
    members.createIndex({ business_category: 1 }),
    members.createIndex({ city: 1 }),
    members.createIndex({ business_types: 1 }),
    admins.createIndex({ email: 1 }, { unique: true }),
    rateLimits.createIndex({ key: 1 }, { unique: true }),
    rateLimits.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }),
  ]);
  console.log(`MongoDB migration complete. Backfilled ${legacyResult.modifiedCount} legacy listing(s).`);
} catch {
  console.error("MongoDB migration could not connect. Check that the Atlas cluster is active and this machine is in the project's IP access list.");
  process.exitCode = 1;
} finally {
  await client.close();
}
