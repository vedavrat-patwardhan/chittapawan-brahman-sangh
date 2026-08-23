import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  getEnvironmentAdmin,
  getSessionSecret,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/config";
import { adminsCollection, parseObjectId } from "@/lib/mongodb";

export type Session = {
  id: string;
  email: string;
  name: string;
  role: "admin";
};

type SessionPayload = Session & {
  version: 1;
  expires_at: number;
};

function sign(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodeSession(session: Session): string {
  const payload: SessionPayload = {
    ...session,
    version: 1,
    expires_at: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(sign(encoded));
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return null;
  }

  try {
    const value = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    if (
      value.version !== 1 ||
      value.role !== "admin" ||
      typeof value.id !== "string" ||
      typeof value.email !== "string" ||
      typeof value.name !== "string" ||
      typeof value.expires_at !== "number" ||
      value.expires_at <= Date.now()
    ) {
      return null;
    }
    return value as SessionPayload;
  } catch {
    return null;
  }
}

export const getSession = cache(async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decodeSession(token);
  if (!payload) return null;

  if (payload.id.startsWith("env:")) {
    const environmentAdmin = getEnvironmentAdmin();
    if (!environmentAdmin || environmentAdmin.id !== payload.id) return null;
    return {
      id: environmentAdmin.id,
      email: environmentAdmin.email,
      name: environmentAdmin.name,
      role: "admin",
    };
  }

  const id = parseObjectId(payload.id);
  if (!id) return null;
  try {
    const admins = await adminsCollection();
    const admin = await admins.findOne(
      { _id: id, active: true },
      { projection: { email: 1, name: 1 } },
    );
    if (!admin) return null;
    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: "admin",
    };
  } catch {
    return null;
  }
});

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  return session;
}

export async function createSession(session: Session): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    priority: "high",
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}
