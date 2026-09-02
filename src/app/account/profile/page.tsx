import type { Metadata } from "next";
import Link from "next/link";
import { MemberNameForm, MemberPasswordForm } from "@/components/member-profile-forms";
import { requireMember } from "@/lib/auth/member-session";

export const metadata: Metadata = { title: "Account settings", robots: { index: false, follow: false } };
export default async function MemberProfilePage() {
  const account = await requireMember("/account/profile");
  return <main className="mx-auto w-full max-w-4xl flex-1 px-(--hero-pad-inline) py-12 sm:py-16"><Link href="/account" className="text-sm font-semibold text-(--accent-strong)">← Back to dashboard</Link><h1 className="mt-7 font-display text-4xl font-bold text-(--ink)">Account settings</h1><div className="mt-8 grid gap-6 md:grid-cols-2"><section className="rounded-(--radius-card) border border-(--line) bg-(--surface-card) p-6"><h2 className="mb-5 font-display text-2xl font-bold text-(--ink)">Profile</h2><MemberNameForm name={account.name} email={account.email} /></section><section className="rounded-(--radius-card) border border-(--line) bg-(--surface-card) p-6"><h2 className="mb-5 font-display text-2xl font-bold text-(--ink)">Password</h2><MemberPasswordForm /></section></div></main>;
}
