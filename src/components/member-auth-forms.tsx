"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  memberLogin,
  signup,
  type AccountAuthState,
} from "@/app/actions/account-auth";

function ErrorMessage({ state }: { state: AccountAuthState }) {
  if (!state?.message) return null;
  return (
    <div role="alert" className="rounded-xl border border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_7%,transparent)] px-4 py-3 text-sm text-(--ink)">
      {state.message}
    </div>
  );
}

export function SignupForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState<AccountAuthState, FormData>(signup, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <ErrorMessage state={state} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-(--ink)">Your name</span>
        <input className="field-input" name="name" autoComplete="name" required autoFocus placeholder="Ramesh Kulkarni" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-(--ink)">Email address</span>
        <input className="field-input" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-(--ink)">Create password</span>
        <input className="field-input" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="text-xs leading-relaxed text-(--muted)">8+ characters with one capital, one small letter, and one symbol.</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-(--ink)">Confirm password</span>
        <input className="field-input" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <button disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-8 text-sm font-semibold text-white transition-colors hover:bg-(--accent-strong) disabled:opacity-60">
        {pending ? "Creating your account…" : "Create account & add business"}
      </button>
      <p className="text-center text-sm text-(--muted)">Already registered? <Link className="font-semibold text-(--accent-strong)" href={`/account/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`}>Sign in</Link></p>
    </form>
  );
}

export function MemberLoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState<AccountAuthState, FormData>(memberLogin, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <ErrorMessage state={state} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-(--ink)">Email address</span>
        <input className="field-input" name="email" type="email" autoComplete="email" required autoFocus />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-(--ink)">Password</span>
        <input className="field-input" name="password" type="password" autoComplete="current-password" required />
      </label>
      <button disabled={pending} className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-8 text-sm font-semibold text-white transition-colors hover:bg-(--accent-strong) disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-(--muted)">New here? <Link className="font-semibold text-(--accent-strong)" href={`/signup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`}>Create an account</Link></p>
    </form>
  );
}

