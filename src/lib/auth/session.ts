import { cookies } from "next/headers";

import { getSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/config";

const ONE_WEEK = 60 * 60 * 24 * 7;

export type Session = {
  username: string;
};

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token || token !== getSessionToken()) return null;
  return { username: "admin" };
}

export async function createSession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, getSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_WEEK,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}
