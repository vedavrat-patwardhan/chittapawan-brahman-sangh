import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/member-auth-forms";
import { getMemberSession } from "@/lib/auth/member-session";

export const metadata: Metadata = { title: "Create member account", robots: { index: false, follow: false } };

type Props = { searchParams?: Promise<{ next?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  if (await getMemberSession()) redirect("/account");
  const params = (await searchParams) ?? {};
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/join";
  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-(--hero-pad-inline) py-14 md:grid-cols-[1fr_28rem]">
      <section>
        <p className="text-xs font-semibold tracking-[0.15em] text-(--accent-strong) uppercase">Community membership</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.6rem)] font-bold leading-[0.98] tracking-tight text-(--ink)">Your business belongs in the community.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-(--ink-soft)">Create one account to submit businesses, follow approval status, and request future updates without filling everything again.</p>
        <div className="mt-7 grid gap-3 text-sm text-(--ink-soft)">
          <p>✓ Your listing stays private during review</p><p>✓ You control only your own business records</p><p>✓ Approved edits replace public details only after review</p>
        </div>
      </section>
      <section className="rounded-(--radius-card) border border-(--line) bg-(--surface-card) p-6 shadow-xl sm:p-8">
        <SignupForm nextPath={nextPath} />
        <p className="mt-6 text-center text-xs text-(--muted)"><Link href="/">← Back home</Link></p>
      </section>
    </main>
  );
}

