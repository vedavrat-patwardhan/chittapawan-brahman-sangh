"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/actions/auth";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}

      {state?.message && (
        <div
          role="alert"
          className="rounded-xl border border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_7%,transparent)] px-4 py-3 text-sm text-(--ink)"
        >
          {state.message}
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-(--ink)">
          Username or email
        </span>
        <input
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="admin"
          required
          className="field-input"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-(--ink)">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="field-input"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-8 text-sm font-semibold text-[color-mix(in_oklch,white_96%,var(--accent))] shadow-[0_12px_32px_-18px_var(--accent-strong)] transition-[transform,background-color,opacity] duration-200 hover:bg-(--accent-strong) active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-focus"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      <p className="rounded-lg border border-(--line) bg-(--surface-inset) px-4 py-3 text-xs leading-relaxed text-(--muted)">
        Temporary access for testers: use <strong className="text-(--ink-soft)">admin</strong> /{" "}
        <strong className="text-(--ink-soft)">admin</strong>. Real accounts will be added when the
        database is connected.
      </p>
    </form>
  );
}
