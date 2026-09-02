import type { Metadata } from "next";
import Link from "next/link";

import { memberLogout } from "@/app/actions/account-auth";
import { requireMember } from "@/lib/auth/member-session";
import { listPendingOwnerChangeMemberIds } from "@/lib/corrections";
import { listOwnedApplications } from "@/lib/directory-queries";

export const metadata: Metadata = { title: "My business account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
type Props = { searchParams?: Promise<{ submitted?: string; change_submitted?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const account = await requireMember("/account");
  const [listings, pendingChangeIds, params] = await Promise.all([
    listOwnedApplications(account.id),
    listPendingOwnerChangeMemberIds(account.id),
    searchParams ?? Promise.resolve({} as { submitted?: string; change_submitted?: string }),
  ]);
  const pendingChanges = new Set(pendingChangeIds);
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-(--hero-pad-inline) py-12 sm:py-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold tracking-[0.15em] text-(--accent-strong) uppercase">Owner dashboard</p><h1 className="mt-2 font-display text-4xl font-bold text-(--ink)">Namaskar, {account.name.split(" ")[0]}</h1><p className="mt-2 text-(--ink-soft)">{account.email}</p></div>
        <div className="flex flex-wrap gap-3"><Link href="/join" className="rounded-full bg-(--accent) px-5 py-2.5 text-sm font-semibold text-white">Add a business</Link><Link href="/account/profile" className="rounded-full border border-(--line-strong) px-5 py-2.5 text-sm font-semibold text-(--ink-soft)">Settings</Link><form action={memberLogout}><button className="rounded-full border border-(--line-strong) px-5 py-2.5 text-sm font-semibold text-(--ink-soft)">Sign out</button></form></div>
      </div>

      {(params.submitted === "1" || params.change_submitted === "1") && <div className="mt-8 rounded-2xl border border-(--line) bg-(--surface-card) p-4 text-sm text-(--ink-soft)"><strong className="text-(--ink)">{params.submitted === "1" ? "Application received." : "Changes sent for review."}</strong> The public directory will update only after an administrator approves it.</div>}

      <section className="mt-10">
        <div className="flex items-end justify-between"><div><h2 className="font-display text-2xl font-bold text-(--ink)">Your businesses</h2><p className="mt-1 text-sm text-(--muted)">Track review status and maintain approved listings.</p></div></div>
        {listings.length ? <div className="mt-5 grid gap-4">
          {listings.map((listing) => {
            const id = String(listing.id);
            const status = String(listing.status);
            const categories = Array.isArray(listing.business_categories) ? listing.business_categories.join(" · ") : String(listing.business_category);
            const changePending = pendingChanges.has(id);
            return <article key={id} className="rounded-2xl border border-(--line) bg-(--surface-card) p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-xl font-bold text-(--ink)">{String(listing.business_name)}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "approved" ? "bg-emerald-100 text-emerald-800" : status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{status === "approved" ? "Published" : status === "rejected" ? "Needs attention" : "Under review"}</span>{changePending && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">Edit under review</span>}</div><p className="mt-2 text-sm text-(--muted)">{categories} · {String(listing.city)}</p>{status === "rejected" && listing.rejection_reason ? <p className="mt-2 text-sm text-(--risk)">{String(listing.rejection_reason)}</p> : null}</div>
                <div className="flex gap-2">{status === "approved" && <><Link href={`/directory/${id}`} className="rounded-full border border-(--line-strong) px-4 py-2 text-sm font-semibold text-(--ink-soft)">View public</Link><Link href={`/account/businesses/${id}/edit`} aria-disabled={changePending} className={`rounded-full px-4 py-2 text-sm font-semibold ${changePending ? "pointer-events-none bg-(--surface-inset) text-(--muted)" : "bg-(--ink) text-(--surface-card)"}`}>{changePending ? "Review pending" : "Edit details"}</Link></>}</div>
              </div>
            </article>;
          })}
        </div> : <div className="mt-5 rounded-2xl border border-dashed border-(--line-strong) bg-(--surface-inset) px-6 py-10 text-center"><h3 className="font-display text-xl font-bold text-(--ink)">Add your first business</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-(--muted)">Complete the guided form once. Your listing stays private until the Sangh administrators approve it.</p><Link href="/join" className="mt-5 inline-flex rounded-full bg-(--accent) px-5 py-2.5 text-sm font-semibold text-white">Start application</Link></div>}
      </section>
    </main>
  );
}
