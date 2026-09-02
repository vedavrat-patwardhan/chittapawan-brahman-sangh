import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MemberLoginForm } from "@/components/member-auth-forms";
import { getMemberSession } from "@/lib/auth/member-session";

export const metadata: Metadata = { title: "Member sign in", robots: { index: false, follow: false } };
type Props = { searchParams?: Promise<{ next?: string }> };

export default async function MemberLoginPage({ searchParams }: Props) {
  if (await getMemberSession()) redirect("/account");
  const params = (await searchParams) ?? {};
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : undefined;
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-(--hero-pad-inline) py-14">
      <div className="mb-8 text-center"><p className="text-xs font-semibold tracking-[0.15em] text-(--accent-strong) uppercase">Business owner access</p><h1 className="mt-2 font-display text-4xl font-bold text-(--ink)">Welcome back</h1><p className="mt-3 text-sm text-(--ink-soft)">Manage your applications and approved listings.</p></div>
      <div className="rounded-(--radius-card) border border-(--line) bg-(--surface-card) p-6 shadow-xl sm:p-8"><MemberLoginForm nextPath={nextPath} /></div>
      <p className="mt-6 text-center text-sm text-(--muted)"><Link href="/">← Back home</Link></p>
    </main>
  );
}

