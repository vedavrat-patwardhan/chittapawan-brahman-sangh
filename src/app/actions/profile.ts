"use server";

import { revalidatePath } from "next/cache";

import {
  changeAdminPassword,
  updateAdminAccount,
} from "@/lib/auth/admins";
import { createSession, requireAdmin } from "@/lib/auth/session";
import {
  clearRateLimit,
  consumeRateLimit,
  requestFingerprint,
} from "@/lib/rate-limit";
import {
  adminPasswordSchema,
  adminProfileSchema,
} from "@/lib/validation/admin.schema";

export type ProfileActionState =
  | { success: boolean; message: string }
  | undefined;

function validationMessage(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues
    .map((issue) => `${String(issue.path[0] ?? "field")}: ${issue.message}`)
    .join(" · ");
}

async function sensitiveActionLimit(adminId: string, purpose: string) {
  const fingerprint = await requestFingerprint(purpose);
  const key = `${purpose}:${adminId}:${fingerprint}`;
  const result = await consumeRateLimit({
    key,
    limit: 6,
    windowMs: 15 * 60 * 1_000,
  });
  return { ...result, key };
}

export async function updateOwnProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireAdmin();
  const parsed = adminProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    current_password: formData.get("current_password"),
  });
  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error.issues) };
  }

  let rateLimit: Awaited<ReturnType<typeof sensitiveActionLimit>> | null = null;
  try {
    rateLimit = await sensitiveActionLimit(session.id, "admin-profile-update");
    if (!rateLimit.allowed) {
      return {
        success: false,
        message: `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`,
      };
    }
    const result = await updateAdminAccount({
      session,
      name: parsed.data.name,
      email: parsed.data.email,
      currentPassword: parsed.data.current_password,
    });
    if (!result.success) return result;
    await createSession(result.session);
    await clearRateLimit(rateLimit.key).catch(() => undefined);
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");
    return result;
  } catch (error) {
    console.error("[updateOwnProfile]", error);
    return { success: false, message: "Could not update the profile right now." };
  }
}

export async function resetOwnPassword(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireAdmin();
  const parsed = adminPasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error.issues) };
  }

  let rateLimit: Awaited<ReturnType<typeof sensitiveActionLimit>> | null = null;
  try {
    rateLimit = await sensitiveActionLimit(session.id, "admin-password-reset");
    if (!rateLimit.allowed) {
      return {
        success: false,
        message: `Too many attempts. Try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`,
      };
    }
    const result = await changeAdminPassword({
      session,
      currentPassword: parsed.data.current_password,
      newPassword: parsed.data.new_password,
    });
    if (!result.success) return result;
    await createSession(result.session);
    await clearRateLimit(rateLimit.key).catch(() => undefined);
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/profile");
    return result;
  } catch (error) {
    console.error("[resetOwnPassword]", error);
    return { success: false, message: "Could not change the password right now." };
  }
}
