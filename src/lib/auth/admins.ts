import { getEnvironmentAdmin, secretMatches } from "@/lib/auth/config";
import { verifyPassword } from "@/lib/auth/password";
import type { Session } from "@/lib/auth/session";
import { adminsCollection } from "@/lib/mongodb";

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
