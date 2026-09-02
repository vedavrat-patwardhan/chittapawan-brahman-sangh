"use server";

import { redirect } from "next/navigation";

import {
  authenticateMemberAccount,
  createMemberAccount,
} from "@/lib/auth/member-accounts";
import { createMemberSession, destroyMemberSession } from "@/lib/auth/member-session";
import { consumeRateLimit, requestFingerprint } from "@/lib/rate-limit";
import { memberLoginSchema, signupSchema } from "@/lib/validation/account.schema";

export type AccountAuthState = { message: string } | undefined;

function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function signup(
  _state: AccountAuthState,
  formData: FormData,
): Promise<AccountAuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Check your details." };

  let account;
  try {
    const fingerprint = await requestFingerprint("member-signup");
    const rate = await consumeRateLimit({
      key: `member-signup:${fingerprint}`,
      limit: 8,
      windowMs: 60 * 60 * 1_000,
    });
    if (!rate.allowed) return { message: "Too many attempts. Please try again later." };
    account = await createMemberAccount(parsed.data);
  } catch (error) {
    console.error("[memberSignup]", error);
    return { message: "Could not create your account right now. Please try again shortly." };
  }
  if (!account) return { message: "An account with this email already exists. Sign in instead." };
  await createMemberSession(account);
  const next = safeNext(formData.get("next"), "/join");
  redirect(`${next}${next.includes("?") ? "&" : "?"}welcome=1`);
}

export async function memberLogin(
  _state: AccountAuthState,
  formData: FormData,
): Promise<AccountAuthState> {
  const parsed = memberLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Check your details." };
  let account;
  try {
    const fingerprint = await requestFingerprint("member-login");
    const rate = await consumeRateLimit({
      key: `member-login:${fingerprint}:${parsed.data.email}`,
      limit: 8,
      windowMs: 15 * 60 * 1_000,
    });
    if (!rate.allowed) return { message: "Too many attempts. Please try again in a few minutes." };
    account = await authenticateMemberAccount(parsed.data.email, parsed.data.password);
  } catch (error) {
    console.error("[memberLogin]", error);
    return { message: "Could not sign you in right now. Please try again shortly." };
  }
  if (!account) return { message: "Email or password is incorrect." };
  await createMemberSession(account);
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function memberLogout(): Promise<void> {
  await destroyMemberSession();
  redirect("/");
}
