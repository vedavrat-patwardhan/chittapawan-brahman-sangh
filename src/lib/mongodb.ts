import {
  MongoClient,
  ObjectId,
  type Binary,
  type Collection,
  type Db,
} from "mongodb";

import type { DirectoryMemberDocument } from "@/types/member";

export type MemberUploadDocument = {
  filename: string;
  contentType: string;
  folder: string;
  data: Binary;
  created_at: Date;
};

export type DirectoryAdminDocument = {
  email: string;
  name: string;
  password_hash: string;
  password_salt: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
};

export type RateLimitDocument = {
  key: string;
  count: number;
  reset_at: Date;
  expires_at: Date;
};

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoIndexes?: Promise<void>;
};

function requireMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("Missing env: MONGODB_URI");
  return uri;
}

function dbName(): string {
  return process.env.MONGODB_DB?.trim() || "chitpavan";
}

export function parseObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  const oid = new ObjectId(id);
  return oid.toString() === id ? oid : null;
}

async function getClient(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(requireMongoUri(), {
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000,
      maxPoolSize: 10,
    });
    globalForMongo._mongoClientPromise = client.connect().catch((err) => {
      globalForMongo._mongoClientPromise = undefined;
      throw err;
    });
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const db = (await getClient()).db(dbName());
  if (!globalForMongo._mongoIndexes) {
    globalForMongo._mongoIndexes = ensureIndexes(db).catch((err) => {
      globalForMongo._mongoIndexes = undefined;
      throw err;
    });
  }
  await globalForMongo._mongoIndexes;
  return db;
}

async function ensureIndexes(db: Db): Promise<void> {
  const members = db.collection<DirectoryMemberDocument>("directory_members");
  const admins = db.collection<DirectoryAdminDocument>("directory_admins");
  const rateLimits = db.collection<RateLimitDocument>("rate_limits");
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
}

export async function membersCollection(): Promise<
  Collection<DirectoryMemberDocument>
> {
  return (await getDb()).collection<DirectoryMemberDocument>("directory_members");
}

export async function uploadsCollection(): Promise<
  Collection<MemberUploadDocument>
> {
  return (await getDb()).collection<MemberUploadDocument>("member_uploads");
}

export async function adminsCollection(): Promise<
  Collection<DirectoryAdminDocument>
> {
  return (await getDb()).collection<DirectoryAdminDocument>("directory_admins");
}

export async function rateLimitsCollection(): Promise<
  Collection<RateLimitDocument>
> {
  return (await getDb()).collection<RateLimitDocument>("rate_limits");
}
