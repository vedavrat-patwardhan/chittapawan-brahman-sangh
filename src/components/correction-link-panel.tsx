"use client";

import { useActionState, useState } from "react";

import {
  createOwnerCorrectionLink,
  type CorrectionActionState,
} from "@/app/actions/corrections";

export function CorrectionLinkPanel({ memberId }: { memberId: string }) {
  const action = createOwnerCorrectionLink.bind(null, memberId);
  const [state, formAction, pending] = useActionState<
    CorrectionActionState,
    FormData
  >(action, undefined);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!state?.path) return;
    const absolute = new URL(state.path, window.location.origin).toString();
    await navigator.clipboard.writeText(absolute);
    setCopied(true);
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-5">
      <p className="text-[0.66rem] font-bold tracking-[0.12em] text-[var(--accent-strong)] uppercase">
        Owner self-service
      </p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
        Request corrections
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
        Generate a 14-day, one-time link to send privately to the listing owner. A new link revokes any unused previous link.
      </p>
      {state ? (
        <div className={`mt-4 rounded-xl border px-3 py-3 text-xs ${state.success ? "border-[color-mix(in_oklch,var(--success)_28%,transparent)] text-[var(--ink-soft)]" : "border-[color-mix(in_oklch,var(--risk)_30%,transparent)] text-[var(--risk)]"}`}>
          {state.message}
        </div>
      ) : null}
      {state?.success && state.path ? (
        <div className="mt-3 space-y-2">
          <code className="block overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-[var(--surface-inset)] px-3 py-2 text-[0.68rem] text-[var(--ink-soft)]">
            {state.path}
          </code>
          <button type="button" onClick={copyLink} className="inline-flex min-h-9 w-full items-center justify-center rounded-full border border-[var(--accent)] px-4 text-xs font-bold text-[var(--accent-strong)]">
            {copied ? "Copied full link ✓" : "Copy full link"}
          </button>
          {state.expiresAt ? <p className="text-center text-[0.66rem] text-[var(--muted)]">Expires {new Date(state.expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p> : null}
        </div>
      ) : (
        <form action={formAction} className="mt-4">
          <button type="submit" disabled={pending} className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-[var(--line-strong)] px-4 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--accent)] disabled:opacity-55">
            {pending ? "Generating…" : "Generate correction link"}
          </button>
        </form>
      )}
    </section>
  );
}
