"use server";

import { redirect } from "next/navigation";

import { authenticateAdmin } from "@/lib/auth/admins";
import { createSession, destroySession } from "@/lib/auth/session";
import {
  clearRateLimit,
  consumeRateLimit,
  requestFingerprint,
} from "@/lib/rate-limit";

export type LoginState = { message: string } | undefined;

export async function login(
  _prev: LoginState,
  fd: FormData,
): Promise<LoginState> {
  const identifier = fd.get("identifier")?.toString() ?? "";
  const password = fd.get("password")?.toString() ?? "";
  const next = fd.get("next")?.toString();

  const fingerprint = await requestFingerprint("admin-login");
  const rateLimitKey = `admin-login:${fingerprint}:${identifier.trim().toLowerCase()}`;
  let rateLimitAvailable = false;
  try {
    const rateLimit = await consumeRateLimit({
      key: rateLimitKey,
      limit: 6,
      windowMs: 15 * 60 * 1000,
    });
    rateLimitAvailable = true;
    if (!rateLimit.allowed) {
      return {
        message: `Too many sign-in attempts. Try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`,
      };
    }
  } catch (error) {
    console.error("[login] Rate limit unavailable", error);
  }

  const admin = await authenticateAdmin(identifier, password);
  if (!admin) {
    return { message: "Invalid username or password." };
  }

  if (rateLimitAvailable) {
    await clearRateLimit(rateLimitKey).catch(() => undefined);
  }
  await createSession(admin);

  const destination =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  redirect(destination);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
