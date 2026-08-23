import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB?.trim() || "chitpavan";
if (!uri) throw new Error("Missing MONGODB_URI in .env.local or .env");

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
try {
  await client.connect();
  const db = client.db(dbName);
  const members = db.collection("directory_members");
  const uploads = db.collection("member_uploads");
  const required = ["created_at", "full_name", "business_name", "contact_number", "email", "city", "business_category", "products_services"];
  const missingRequiredFilter = {
    $or: required.flatMap((field) => [
      { [field]: { $exists: false } },
      { [field]: null },
      { [field]: "" },
    ]),
  };
  const [total, pending, approved, rejected, legacy, invalidStatus, missingRequired, uploadCount, indexes] = await Promise.all([
    members.countDocuments(),
    members.countDocuments({ status: "pending" }),
    members.countDocuments({ status: "approved" }),
    members.countDocuments({ status: "rejected" }),
    members.countDocuments({ status: { $exists: false } }),
    members.countDocuments({ status: { $exists: true, $nin: ["pending", "approved", "rejected"] } }),
    members.countDocuments(missingRequiredFilter),
    uploads.countDocuments(),
    members.indexes(),
  ]);

  console.log(JSON.stringify({
    database: dbName,
    listings: { total, pending, approved, rejected, legacyWithoutStatus: legacy },
    integrity: { invalidStatus, missingRequiredFields: missingRequired },
    uploads: uploadCount,
    indexes: indexes.map((index) => index.name),
  }, null, 2));
  if (invalidStatus || missingRequired) process.exitCode = 1;
} catch {
  console.error("MongoDB audit could not connect. Check that the Atlas cluster is active and this machine is in the project's IP access list.");
  process.exitCode = 1;
} finally {
  await client.close();
}
