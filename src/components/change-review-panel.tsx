"use client";

import { useActionState } from "react";

import {
  decideOwnerCorrection,
  type CorrectionActionState,
} from "@/app/actions/corrections";

export function ChangeReviewPanel({
  requestId,
  defaultNote,
  disabled,
}: {
  requestId: string;
  defaultNote: string;
  disabled: boolean;
}) {
  const action = decideOwnerCorrection.bind(null, requestId);
  const [state, formAction, pending] = useActionState<
    CorrectionActionState,
    FormData
  >(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {state ? (
        <div role={state.success ? "status" : "alert"} className={`rounded-xl border px-3 py-3 text-xs ${state.success ? "border-[color-mix(in_oklch,var(--success)_30%,transparent)] text-[var(--ink-soft)]" : "border-[color-mix(in_oklch,var(--risk)_30%,transparent)] text-[var(--risk)]"}`}>
          {state.message}
        </div>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
        Private admin note
        <textarea name="admin_note" defaultValue={defaultNote} maxLength={2_000} rows={3} disabled={disabled} className="field-input resize-y disabled:opacity-60" />
      </label>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <button name="decision" value="approved" disabled={pending || disabled} className="min-h-10 rounded-full bg-[var(--success)] px-4 text-xs font-bold text-white disabled:opacity-50">
          {pending ? "Updating…" : "Approve & publish"}
        </button>
        <button name="decision" value="rejected" disabled={pending || disabled} className="min-h-10 rounded-full border border-[color-mix(in_oklch,var(--risk)_38%,transparent)] px-4 text-xs font-bold text-[var(--risk)] disabled:opacity-50">
          Reject changes
        </button>
      </div>
    </form>
  );
}
