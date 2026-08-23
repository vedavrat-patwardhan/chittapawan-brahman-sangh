"use client";

import { useActionState } from "react";

import {
  verifyDirectoryListing,
  type ReviewApplicationState,
} from "@/app/actions/review";

export function VerificationPanel({
  memberId,
  lastVerifiedAt,
  dueAt,
  current,
}: {
  memberId: string;
  lastVerifiedAt: string;
  dueAt: string;
  current: boolean;
}) {
  const action = verifyDirectoryListing.bind(null, memberId);
  const [state, formAction, pending] = useActionState<
    ReviewApplicationState,
    FormData
  >(action, undefined);
  return (
    <section className={`rounded-[var(--radius-card)] border p-5 ${current ? "border-[color-mix(in_oklch,var(--success)_25%,transparent)] bg-[color-mix(in_oklch,var(--success)_5%,transparent)]" : "border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_5%,transparent)]"}`}>
      <p className={`text-[0.66rem] font-bold tracking-[0.12em] uppercase ${current ? "text-[var(--success)]" : "text-[var(--risk)]"}`}>Annual verification</p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">{current ? "Details are current" : "Verification is due"}</h2>
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
        {lastVerifiedAt ? `Last confirmed ${new Date(lastVerifiedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}. ` : "No verification date is recorded. "}
        {dueAt ? `Next due ${new Date(dueAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}.` : "Confirm the details to start the annual cycle."}
      </p>
      {state ? <p role={state.success ? "status" : "alert"} className={`mt-3 rounded-lg border px-3 py-2 text-xs ${state.success ? "border-[color-mix(in_oklch,var(--success)_25%,transparent)] text-[var(--success)]" : "border-[color-mix(in_oklch,var(--risk)_30%,transparent)] text-[var(--risk)]"}`}>{state.message}</p> : null}
      <form action={formAction} className="mt-4">
        <button type="submit" disabled={pending} className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[var(--ink)] px-4 text-xs font-bold text-[var(--surface-card)] disabled:opacity-55">
          {pending ? "Recording…" : "Mark details as verified"}
        </button>
      </form>
    </section>
  );
}
