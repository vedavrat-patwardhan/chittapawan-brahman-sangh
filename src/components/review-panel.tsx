"use client";

import { useActionState } from "react";

import {
  reviewDirectoryApplication,
  type ReviewApplicationState,
} from "@/app/actions/review";

export function ReviewPanel({
  applicationId,
  defaultNote,
  defaultReason,
}: {
  applicationId: string;
  defaultNote: string;
  defaultReason: string;
}) {
  const action = reviewDirectoryApplication.bind(null, applicationId);
  const [state, formAction, pending] = useActionState<
    ReviewApplicationState,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state ? (
        <div
          role={state.success ? "status" : "alert"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.success
              ? "border-[color-mix(in_oklch,var(--success)_30%,transparent)] bg-[color-mix(in_oklch,var(--success)_7%,transparent)] text-[var(--ink)]"
              : "border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_7%,transparent)] text-[var(--risk)]"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-[var(--ink)]">Private admin note</span>
        <textarea
          name="admin_note"
          defaultValue={defaultNote}
          rows={3}
          maxLength={2_000}
          className="field-input resize-y"
          placeholder="Verification call, documents checked, follow-up details…"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-[var(--ink)]">
          Rejection reason <span className="font-normal text-[var(--muted)]">(required only when rejecting)</span>
        </span>
        <textarea
          name="rejection_reason"
          defaultValue={defaultReason}
          rows={2}
          maxLength={1_000}
          className="field-input resize-y"
          placeholder="Duplicate, incomplete ownership details, outside community…"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--success)] px-6 text-sm font-bold text-white transition-[transform,opacity] hover:-translate-y-0.5 disabled:opacity-55"
        >
          {pending ? "Updating…" : "Approve & publish"}
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--risk)_38%,transparent)] px-6 text-sm font-bold text-[var(--risk)] transition-[transform,background-color,opacity] hover:-translate-y-0.5 hover:bg-[color-mix(in_oklch,var(--risk)_7%,transparent)] disabled:opacity-55"
        >
          Reject application
        </button>
      </div>
    </form>
  );
}
