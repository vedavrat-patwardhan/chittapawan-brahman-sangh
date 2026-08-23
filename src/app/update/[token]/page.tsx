import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CorrectionForm } from "@/components/correction-form";
import { getCorrectionContext } from "@/lib/corrections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Correct directory listing",
  description: "Submit corrections to a community business directory listing.",
  robots: { index: false, follow: false },
};

export default async function CorrectionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const context = await getCorrectionContext(token).catch(() => null);
  if (!context) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-[var(--hero-pad-inline)] py-10 sm:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="text-[0.68rem] font-bold tracking-[0.15em] text-[var(--accent-strong)] uppercase">
          Secure listing correction
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
          Review what the community sees.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          Update only the fields that need attention. Your current listing remains live while the Sangh team reviews this request.
        </p>
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-[0_24px_64px_-48px_var(--ink)] sm:p-8">
        <CorrectionForm token={token} context={context} />
      </div>
    </div>
  );
}
