import { getEnvironmentAdmin, secretMatches } from "@/lib/auth/config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { Session } from "@/lib/auth/session";
import { adminsCollection, parseObjectId } from "@/lib/mongodb";

export async function authenticateAdmin(
  identifier: string,
  password: string,
): Promise<Session | null> {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized || !password) return null;

  const environmentAdmin = getEnvironmentAdmin();
  if (
    environmentAdmin &&
    normalized === environmentAdmin.email &&
    secretMatches(password, environmentAdmin.password)
  ) {
    return {
      id: environmentAdmin.id,
      email: environmentAdmin.email,
      name: environmentAdmin.name,
      role: "admin",
      session_version: 1,
    };
  }

  try {
    const admins = await adminsCollection();
    const admin = await admins.findOne({ email: normalized, active: true });
    if (
      admin &&
      (await verifyPassword(password, admin.password_hash, admin.password_salt))
    ) {
      await admins.updateOne(
        { _id: admin._id },
        { $set: { last_login_at: new Date(), updated_at: new Date() } },
      );
      return {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
      role: "admin",
      session_version: admin.session_version ?? 1,
    };
    }
  } catch (error) {
    console.error(
      "[authenticateAdmin] MongoDB lookup failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  return null;
}

export type AdminProfile = {
  id: string;
  email: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
  last_login_at: string | null;
  editable: boolean;
};

function isoDate(value: Date | null | undefined): string | null {
  return value instanceof Date ? value.toISOString() : null;
}

export async function getAdminProfile(session: Session): Promise<AdminProfile> {
  if (session.id.startsWith("env:")) {
    return {
      id: session.id,
      email: session.email,
      name: session.name,
      created_at: null,
      updated_at: null,
      last_login_at: null,
      editable: false,
    };
  }
  const id = parseObjectId(session.id);
  if (!id) throw new Error("Administrator account not found");
  const admins = await adminsCollection();
  const admin = await admins.findOne({
    _id: id,
    active: true,
  });
  if (!admin) throw new Error("Administrator account not found");
  return {
    id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    created_at: isoDate(admin.created_at),
    updated_at: isoDate(admin.updated_at),
    last_login_at: isoDate(admin.last_login_at),
    editable: true,
  };
}

export type AdminAccountMutationResult =
  | { success: false; message: string }
  | { success: true; message: string; session: Session };

export async function updateAdminAccount(input: {
  session: Session;
  name: string;
  email: string;
  currentPassword: string;
}): Promise<AdminAccountMutationResult> {
  if (input.session.id.startsWith("env:")) {
    return {
      success: false,
      message: "Environment-based administrators must be changed in deployment settings.",
    };
  }
  const admins = await adminsCollection();
  const id = parseObjectId(input.session.id);
  if (!id) return { success: false, message: "Administrator account is invalid." };
  const admin = await admins.findOne({ _id: id, active: true });
  if (
    !admin ||
    !(await verifyPassword(
      input.currentPassword,
      admin.password_hash,
      admin.password_salt,
    ))
  ) {
    return { success: false, message: "Current password is incorrect." };
  }
  const existing = await admins.findOne({
    email: input.email,
    _id: { $ne: id },
  });
  if (existing) {
    return { success: false, message: "Another administrator already uses that email." };
  }
  const now = new Date();
  const result = await admins.updateOne(
    { _id: id, active: true },
    { $set: { name: input.name, email: input.email, updated_at: now } },
  );
  if (result.matchedCount !== 1) {
    return { success: false, message: "Administrator account is no longer available." };
  }
  return {
    success: true,
    message: "Profile details updated.",
    session: {
      ...input.session,
      name: input.name,
      email: input.email,
      session_version: admin.session_version ?? 1,
    },
  };
}

export async function changeAdminPassword(input: {
  session: Session;
  currentPassword: string;
  newPassword: string;
}): Promise<AdminAccountMutationResult> {
  if (input.session.id.startsWith("env:")) {
    return {
      success: false,
      message: "Environment-based passwords must be changed in deployment settings.",
    };
  }
  const admins = await adminsCollection();
  const id = parseObjectId(input.session.id);
  if (!id) return { success: false, message: "Administrator account is invalid." };
  const admin = await admins.findOne({ _id: id, active: true });
  if (
    !admin ||
    !(await verifyPassword(
      input.currentPassword,
      admin.password_hash,
      admin.password_salt,
    ))
  ) {
    return { success: false, message: "Current password is incorrect." };
  }
  if (
    await verifyPassword(
      input.newPassword,
      admin.password_hash,
      admin.password_salt,
    )
  ) {
    return { success: false, message: "Choose a password you have not just used." };
  }
  const password = await hashPassword(input.newPassword);
  const sessionVersion = (admin.session_version ?? 1) + 1;
  const result = await admins.updateOne(
    { _id: id, active: true },
    {
      $set: {
        password_hash: password.hash,
        password_salt: password.salt,
        session_version: sessionVersion,
        updated_at: new Date(),
      },
    },
  );
  if (result.matchedCount !== 1) {
    return { success: false, message: "Administrator account is no longer available." };
  }
  return {
    success: true,
    message: "Password changed. Other signed-in browsers have been logged out.",
    session: { ...input.session, session_version: sessionVersion },
  };
}
