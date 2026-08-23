import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { MongoClient } from "mongodb";

const scrypt = promisify(scryptCallback);
const args = Object.fromEntries(
  process.argv.slice(2).flatMap((value, index, all) =>
    value.startsWith("--") && all[index + 1] && !all[index + 1].startsWith("--")
      ? [[value.slice(2), all[index + 1]]]
      : [],
  ),
);

const email = String(args.email ?? "").trim().toLowerCase();
const name = String(args.name ?? "").trim();
const password = process.env.ADMIN_PASSWORD ?? String(args.password ?? "");
const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB?.trim() || "chitpavan";

if (!uri) throw new Error("Missing MONGODB_URI in .env.local or .env");
if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Pass a valid --email address");
if (name.length < 2) throw new Error("Pass the administrator's --name");
if (password.length < 12) throw new Error("Set ADMIN_PASSWORD to at least 12 characters");

const salt = randomBytes(16).toString("hex");
const passwordHash = Buffer.from(await scrypt(password, salt, 64)).toString("hex");
const client = new MongoClient(uri);

try {
  await client.connect();
  const admins = client.db(dbName).collection("directory_admins");
  const now = new Date();
  const result = await admins.updateOne(
    { email },
    {
      $set: {
        name,
        password_hash: passwordHash,
        password_salt: salt,
        active: true,
        updated_at: now,
      },
      $setOnInsert: {
        email,
        created_at: now,
        last_login_at: null,
        session_version: 1,
      },
    },
    { upsert: true },
  );
  await admins.createIndex({ email: 1 }, { unique: true });
  console.log(result.upsertedCount ? `Created administrator ${email}` : `Updated administrator ${email}`);
} catch {
  console.error("Could not connect to MongoDB. Check that the Atlas cluster is active and this machine is in the project's IP access list.");
  process.exitCode = 1;
} finally {
  await client.close();
}
