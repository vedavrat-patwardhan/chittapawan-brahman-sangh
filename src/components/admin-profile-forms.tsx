"use client";

import { useActionState } from "react";

import {
  resetOwnPassword,
  updateOwnProfile,
  type ProfileActionState,
} from "@/app/actions/profile";

function ActionMessage({ state }: { state: ProfileActionState }) {
  if (!state) return null;
  return (
    <div
      role={state.success ? "status" : "alert"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        state.success
          ? "border-[color-mix(in_oklch,var(--success)_30%,transparent)] bg-[color-mix(in_oklch,var(--success)_6%,transparent)] text-[var(--success)]"
          : "border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_6%,transparent)] text-[var(--risk)]"
      }`}
    >
      {state.message}
    </div>
  );
}

export function AdminProfileForms({
  name,
  email,
  editable,
}: {
  name: string;
  email: string;
  editable: boolean;
}) {
  const [profileState, profileAction, profilePending] = useActionState<
    ProfileActionState,
    FormData
  >(updateOwnProfile, undefined);
  const [passwordState, passwordAction, passwordPending] = useActionState<
    ProfileActionState,
    FormData
  >(resetOwnPassword, undefined);

  if (!editable) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-inset)] p-5 text-sm leading-relaxed text-[var(--ink-soft)]">
        This emergency administrator is configured through environment variables. Update its name, email, or password in the deployment settings.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        action={profileAction}
        className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-6 shadow-[0_28px_70px_-58px_var(--ink)] sm:p-7"
      >
        <div>
          <p className="text-[0.66rem] font-bold tracking-[0.13em] text-[var(--accent-strong)] uppercase">
            Identity
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            Edit account details
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Your email is also your login identifier. Confirm the change with your current password.
          </p>
        </div>
        <ActionMessage state={profileState} />
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          Display name
          <input name="name" defaultValue={name} minLength={2} maxLength={120} autoComplete="name" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          Login email
          <input name="email" type="email" defaultValue={email} maxLength={254} autoComplete="email" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          Current password
          <input name="current_password" type="password" autoComplete="current-password" required className="field-input" />
        </label>
        <button type="submit" disabled={profilePending} className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-sm font-bold text-[var(--surface-card)] transition-[transform,opacity] hover:-translate-y-0.5 disabled:opacity-55">
          {profilePending ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form
        action={passwordAction}
        className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--accent)_28%,var(--line))] bg-[var(--accent-xsoft)] p-6 sm:p-7"
      >
        <div>
          <p className="text-[0.66rem] font-bold tracking-[0.13em] text-[var(--accent-strong)] uppercase">
            Security
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            Reset password
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Changing your password signs out every other browser and device using this account.
          </p>
        </div>
        <ActionMessage state={passwordState} />
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          Current password
          <input name="current_password" type="password" autoComplete="current-password" required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          New password
          <input name="new_password" type="password" autoComplete="new-password" minLength={14} required className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          Confirm new password
          <input name="confirm_password" type="password" autoComplete="new-password" minLength={14} required className="field-input" />
        </label>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          Use 14+ characters with uppercase, lowercase, a number, and a symbol.
        </p>
        <button type="submit" disabled={passwordPending} className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-bold text-white transition-[transform,background-color,opacity] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:opacity-55">
          {passwordPending ? "Changing…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
