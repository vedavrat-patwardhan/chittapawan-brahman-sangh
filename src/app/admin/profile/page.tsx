import type { Metadata } from "next";

import { AdminProfileForms } from "@/components/admin-profile-forms";
import { getAdminProfile } from "@/lib/auth/admins";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administrator profile",
  robots: { index: false, follow: false },
};

function formatDate(value: string | null): string {
  return value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not recorded";
}

export default async function AdminProfilePage() {
  const session = await requireAdmin();
  const profile = await getAdminProfile(session);
  const initials = profile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-[var(--hero-pad-inline)] py-10 sm:py-14">
      <section className="relative overflow-hidden rounded-[calc(var(--radius-card)+0.35rem)] border border-[var(--line)] bg-[var(--surface-card)] p-6 sm:p-8">
        <div aria-hidden className="absolute -top-20 right-0 h-52 w-52 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.4rem] bg-[var(--ink)] font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--surface-card)] shadow-[0_20px_50px_-32px_var(--ink)]">
              {initials || "A"}
            </div>
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.15em] text-[var(--accent-strong)] uppercase">
                Administrator account
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
                {profile.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{profile.email}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-right">
            <div>
              <dt className="font-bold tracking-wide text-[var(--muted)] uppercase">Last sign-in</dt>
              <dd className="mt-1 text-[var(--ink-soft)]">{formatDate(profile.last_login_at)}</dd>
            </div>
            <div>
              <dt className="font-bold tracking-wide text-[var(--muted)] uppercase">Account created</dt>
              <dd className="mt-1 text-[var(--ink-soft)]">{formatDate(profile.created_at)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <AdminProfileForms
        name={profile.name}
        email={profile.email}
        editable={profile.editable}
      />
    </div>
  );
}
