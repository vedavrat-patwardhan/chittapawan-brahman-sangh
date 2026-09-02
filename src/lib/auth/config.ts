import { timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "cbs_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
export const MEMBER_SESSION_COOKIE_NAME = "cbs_member_session";
export const MEMBER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type EnvironmentAdmin = {
  id: string;
  email: string;
  name: string;
  password: string;
};

export function getEnvironmentAdmin(): EnvironmentAdmin | null {
  const email = (process.env.AUTH_USERNAME ?? "").trim().toLowerCase();
  const password = process.env.AUTH_PASSWORD ?? "";
  if (!email || !password) return null;
  return {
    id: `env:${email}`,
    email,
    name: process.env.AUTH_ADMIN_NAME?.trim() || "Directory administrator",
    password,
  };
}

export function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();

  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing env: AUTH_SESSION_SECRET");
  }
  return "local-development-only-change-me";
}

export function secretMatches(input: string, expected: string): boolean {
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
