"use server";

import { revalidatePath } from "next/cache";

import { changeMemberAccountPassword, updateMemberAccountName } from "@/lib/auth/member-accounts";
import { createMemberSession, requireMember } from "@/lib/auth/member-session";
import { memberPasswordSchema, memberProfileSchema } from "@/lib/validation/account.schema";

export type MemberProfileState = { success: boolean; message: string } | undefined;

export async function updateMemberProfile(_state: MemberProfileState, formData: FormData): Promise<MemberProfileState> {
  const session = await requireMember("/account/profile");
  const parsed = memberProfileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Check your name." };
  const account = await updateMemberAccountName(session.id, parsed.data.name);
  if (!account) return { success: false, message: "Could not update your profile." };
  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true, message: "Profile updated." };
}

export async function updateMemberPassword(_state: MemberProfileState, formData: FormData): Promise<MemberProfileState> {
  const session = await requireMember("/account/profile");
  const parsed = memberPasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Check your password." };
  const account = await changeMemberAccountPassword(session.id, parsed.data.current_password, parsed.data.new_password);
  if (!account) return { success: false, message: "Your current password is incorrect." };
  await createMemberSession(account);
  return { success: true, message: "Password changed. Your other sessions have been signed out." };
}

