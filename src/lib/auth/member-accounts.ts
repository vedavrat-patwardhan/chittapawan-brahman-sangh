import { ObjectId } from "mongodb";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { usersCollection } from "@/lib/mongodb";

export type MemberAccount = {
  id: string;
  name: string;
  email: string;
  sessionVersion: number;
};

function accountFromDocument(doc: {
  _id: ObjectId;
  name: string;
  email: string;
  session_version: number;
}): MemberAccount {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    sessionVersion: doc.session_version,
  };
}

export async function createMemberAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<MemberAccount | null> {
  const users = await usersCollection();
  const email = input.email.trim().toLowerCase();
  if (await users.findOne({ email }, { projection: { _id: 1 } })) return null;
  const passwordDetails = await hashPassword(input.password);
  const now = new Date();
  try {
    const result = await users.insertOne({
      name: input.name.trim(),
      email,
      password_hash: passwordDetails.hash,
      password_salt: passwordDetails.salt,
      active: true,
      created_at: now,
      updated_at: now,
      last_login_at: now,
      session_version: 1,
    });
    return {
      id: result.insertedId.toString(),
      name: input.name.trim(),
      email,
      sessionVersion: 1,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return null;
    }
    throw error;
  }
}

export async function authenticateMemberAccount(
  emailInput: string,
  password: string,
): Promise<MemberAccount | null> {
  const users = await usersCollection();
  const user = await users.findOne({ email: emailInput.trim().toLowerCase(), active: true });
  if (!user) return null;
  if (!(await verifyPassword(password, user.password_hash, user.password_salt))) {
    return null;
  }
  await users.updateOne({ _id: user._id }, { $set: { last_login_at: new Date() } });
  return accountFromDocument(user);
}

export async function getMemberAccountById(id: string): Promise<MemberAccount | null> {
  if (!ObjectId.isValid(id)) return null;
  const users = await usersCollection();
  const user = await users.findOne({ _id: new ObjectId(id), active: true });
  return user ? accountFromDocument(user) : null;
}

export async function updateMemberAccountName(id: string, name: string): Promise<MemberAccount | null> {
  if (!ObjectId.isValid(id)) return null;
  const users = await usersCollection();
  const user = await users.findOneAndUpdate(
    { _id: new ObjectId(id), active: true },
    { $set: { name: name.trim(), updated_at: new Date() } },
    { returnDocument: "after" },
  );
  return user ? accountFromDocument(user) : null;
}

export async function changeMemberAccountPassword(
  id: string,
  currentPassword: string,
  nextPassword: string,
): Promise<MemberAccount | null> {
  if (!ObjectId.isValid(id)) return null;
  const users = await usersCollection();
  const user = await users.findOne({ _id: new ObjectId(id), active: true });
  if (!user || !(await verifyPassword(currentPassword, user.password_hash, user.password_salt))) return null;
  const next = await hashPassword(nextPassword);
  const updated = await users.findOneAndUpdate(
    { _id: user._id, session_version: user.session_version },
    { $set: { password_hash: next.hash, password_salt: next.salt, updated_at: new Date() }, $inc: { session_version: 1 } },
    { returnDocument: "after" },
  );
  return updated ? accountFromDocument(updated) : null;
}
