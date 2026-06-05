"use server";

import { redirect } from "next/navigation";

import { credentialsMatch } from "@/lib/auth/config";
import { createSession, destroySession } from "@/lib/auth/session";

export type LoginState = { message: string } | undefined;

export async function login(
  _prev: LoginState,
  fd: FormData,
): Promise<LoginState> {
  const identifier = fd.get("identifier")?.toString() ?? "";
  const password = fd.get("password")?.toString() ?? "";
  const next = fd.get("next")?.toString();

  if (!credentialsMatch(identifier, password)) {
    return { message: "Invalid username or password." };
  }

  await createSession();

  const destination =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/directory";
  redirect(destination);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
