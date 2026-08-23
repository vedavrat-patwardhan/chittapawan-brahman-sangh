import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Application received",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ reference?: string }>;
};

export default async function SubmissionSuccessPage(props: PageProps) {
  const params = (await props.searchParams) ?? {};
  const rawReference = params.reference ?? "received";
  const reference = /^[a-f\d]{24}$/i.test(rawReference)
    ? rawReference.slice(-8).toUpperCase()
    : "RECEIVED";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center px-[var(--hero-pad-inline)] py-16 sm:py-24">
      <section className="motion-rise w-full rounded-[2rem] border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center shadow-[0_35px_90px_-65px_var(--ink)] sm:p-12">
        <div aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--success)_12%,transparent)] text-2xl font-bold text-[var(--success)] ring-1 ring-[color-mix(in_oklch,var(--success)_25%,transparent)]">
          ✓
        </div>
        <p className="mt-6 text-[0.68rem] font-bold tracking-[0.15em] text-[var(--accent-strong)] uppercase">Reference {reference}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">Application received.</h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[var(--ink-soft)]">
          Thank you. A directory administrator will verify the details before anything is published. Please keep the reference above if you need to follow up with the Sangh office.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/directory" className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-white hover:bg-[var(--accent-strong)]">Browse directory</Link>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] px-7 text-sm font-bold text-[var(--ink-soft)] hover:border-[var(--accent)]">Back home</Link>
        </div>
      </section>
    </div>
  );
}
