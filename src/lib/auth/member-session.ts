import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  MEMBER_SESSION_COOKIE_NAME,
  MEMBER_SESSION_MAX_AGE_SECONDS,
  getSessionSecret,
} from "@/lib/auth/config";
import { getMemberAccountById, type MemberAccount } from "@/lib/auth/member-accounts";

type MemberSessionPayload = {
  id: string;
  sessionVersion: number;
  expiresAt: number;
};

function sign(encoded: string): string {
  return createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
}

function encode(payload: MemberSessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function decode(value: string): MemberSessionPayload | null {
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as MemberSessionPayload;
    if (!payload.id || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const getMemberSession = cache(async (): Promise<MemberAccount | null> => {
  const value = (await cookies()).get(MEMBER_SESSION_COOKIE_NAME)?.value;
  if (!value) return null;
  const payload = decode(value);
  if (!payload) return null;
  const account = await getMemberAccountById(payload.id);
  if (!account || account.sessionVersion !== payload.sessionVersion) return null;
  return account;
});

export async function requireMember(next = "/account"): Promise<MemberAccount> {
  const account = await getMemberSession();
  if (!account) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return account;
}

export async function createMemberSession(account: MemberAccount): Promise<void> {
  const maxAge = MEMBER_SESSION_MAX_AGE_SECONDS;
  (await cookies()).set(
    MEMBER_SESSION_COOKIE_NAME,
    encode({
      id: account.id,
      sessionVersion: account.sessionVersion,
      expiresAt: Date.now() + maxAge * 1_000,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    },
  );
}

export async function destroyMemberSession(): Promise<void> {
  (await cookies()).delete(MEMBER_SESSION_COOKIE_NAME);
}

