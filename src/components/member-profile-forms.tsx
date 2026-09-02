"use client";

import { useActionState } from "react";
import { updateMemberPassword, updateMemberProfile, type MemberProfileState } from "@/app/actions/account-profile";

function Message({ state }: { state: MemberProfileState }) {
  return state?.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{state.message}</p> : null;
}

export function MemberNameForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateMemberProfile, undefined);
  return <form action={action} className="space-y-5"><Message state={state} /><label className="flex flex-col gap-1.5 text-sm font-semibold text-(--ink)">Name<input name="name" defaultValue={name} className="field-input" required /></label><label className="flex flex-col gap-1.5 text-sm font-semibold text-(--ink)">Email<input value={email} className="field-input opacity-70" disabled /><span className="text-xs font-normal text-(--muted)">Email is the permanent sign-in address for this account.</span></label><button disabled={pending} className="rounded-full bg-(--ink) px-5 py-2.5 text-sm font-semibold text-(--surface-card) disabled:opacity-60">{pending ? "Saving…" : "Save profile"}</button></form>;
}

export function MemberPasswordForm() {
  const [state, action, pending] = useActionState(updateMemberPassword, undefined);
  return <form action={action} className="space-y-5"><Message state={state} /><label className="flex flex-col gap-1.5 text-sm font-semibold text-(--ink)">Current password<input name="current_password" type="password" autoComplete="current-password" className="field-input" required /></label><label className="flex flex-col gap-1.5 text-sm font-semibold text-(--ink)">New password<input name="new_password" type="password" autoComplete="new-password" minLength={8} className="field-input" required /><span className="text-xs font-normal text-(--muted)">8+ characters with one capital, one small letter, and one symbol.</span></label><label className="flex flex-col gap-1.5 text-sm font-semibold text-(--ink)">Confirm new password<input name="confirm_password" type="password" autoComplete="new-password" minLength={8} className="field-input" required /></label><button disabled={pending} className="rounded-full bg-(--accent) px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Changing…" : "Change password"}</button></form>;
}

