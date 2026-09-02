import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB?.trim() || "chitpavan";
if (!uri) throw new Error("Missing MONGODB_URI in .env.local or .env");

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
try {
  await client.connect();
  const db = client.db(dbName);
  const members = db.collection("directory_members");
  const admins = db.collection("directory_admins");
  const users = db.collection("directory_users");
  const uploads = db.collection("member_uploads");
  const editTokens = db.collection("directory_edit_tokens");
  const changeRequests = db.collection("directory_change_requests");
  const settings = db.collection("directory_settings");
  const required = ["created_at", "full_name", "business_name", "contact_number", "email", "city", "business_category", "products_services"];
  const missingRequiredFilter = {
    $or: required.flatMap((field) => [
      { [field]: { $exists: false } },
      { [field]: null },
      { [field]: "" },
    ]),
  };
  const [total, pending, approved, rejected, legacy, invalidStatus, missingRequired, missingNormalizedIdentity, missingCategories, possibleDuplicates, verificationDue, uploadCount, activeAdmins, adminsWithoutSessionVersion, activeUsers, usersWithoutSessionVersion, pendingCorrections, activeCorrectionLinks, categorySettings, indexes] = await Promise.all([
    members.countDocuments(),
    members.countDocuments({ status: "pending" }),
    members.countDocuments({ status: "approved" }),
    members.countDocuments({ status: "rejected" }),
    members.countDocuments({ status: { $exists: false } }),
    members.countDocuments({ status: { $exists: true, $nin: ["pending", "approved", "rejected"] } }),
    members.countDocuments(missingRequiredFilter),
    members.countDocuments({
      $or: [
        { email_normalized: { $exists: false } },
        { contact_number_normalized: { $exists: false } },
        { business_name_normalized: { $exists: false } },
      ],
    }),
    members.countDocuments({ $or: [{ business_categories: { $exists: false } }, { business_categories: { $size: 0 } }] }),
    members.countDocuments({ duplicate_risk: true }),
    members.countDocuments({ status: "approved", $or: [{ verification_due_at: { $lte: new Date() } }, { verification_due_at: null }, { verification_due_at: { $exists: false } }] }),
    uploads.countDocuments(),
    admins.countDocuments({ active: true }),
    admins.countDocuments({ session_version: { $exists: false } }),
    users.countDocuments({ active: true }),
    users.countDocuments({ session_version: { $exists: false } }),
    changeRequests.countDocuments({ status: "pending" }),
    editTokens.countDocuments({ used_at: null, revoked_at: null, expires_at: { $gt: new Date() } }),
    settings.findOne({ key: "business_categories" }),
    members.indexes(),
  ]);

  console.log(JSON.stringify({
    database: dbName,
    listings: { total, pending, approved, rejected, legacyWithoutStatus: legacy },
    integrity: { invalidStatus, missingRequiredFields: missingRequired, missingNormalizedIdentity, missingBusinessCategories: missingCategories },
    reviewSignals: { possibleDuplicates, verificationDue },
    corrections: { pending: pendingCorrections, activeLinks: activeCorrectionLinks },
    settings: { configuredBusinessCategories: Array.isArray(categorySettings?.values) ? categorySettings.values.length : 0, usingBuiltInDefaults: !categorySettings },
    uploads: uploadCount,
    administrators: { active: activeAdmins, missingSessionVersion: adminsWithoutSessionVersion },
    memberAccounts: { active: activeUsers, missingSessionVersion: usersWithoutSessionVersion },
    indexes: indexes.map((index) => index.name),
  }, null, 2));
  if (invalidStatus || missingRequired || missingNormalizedIdentity || missingCategories || adminsWithoutSessionVersion || usersWithoutSessionVersion) process.exitCode = 1;
} catch {
  console.error("MongoDB audit could not connect. Check that the Atlas cluster is active and this machine is in the project's IP access list.");
  process.exitCode = 1;
} finally {
  await client.close();
}
