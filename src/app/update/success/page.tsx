import type { Metadata } from "next";
import Link from "next/link";

import { qp, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Corrections received",
  robots: { index: false, follow: false },
};

export default async function CorrectionSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<RawSearchParams>;
}) {
  const reference = qp((await searchParams)?.reference);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center px-[var(--hero-pad-inline)] py-16">
      <div className="w-full rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[color-mix(in_oklch,var(--success)_12%,transparent)] text-2xl text-[var(--success)]">✓</span>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--ink)]">Corrections received.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--ink-soft)]">
          Your existing listing remains published. An administrator will review the proposed changes before they appear in the directory.
        </p>
        {reference ? <p className="mt-5 text-xs font-semibold tracking-wide text-[var(--muted)]">Reference {reference.slice(-8).toUpperCase()}</p> : null}
        <Link href="/directory" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[var(--ink)] px-6 text-sm font-bold text-[var(--surface-card)]">Browse the directory</Link>
      </div>
    </div>
  );
}
