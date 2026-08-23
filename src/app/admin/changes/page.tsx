import type { Metadata } from "next";
import Link from "next/link";

import { listChangeRequests } from "@/lib/corrections";
import { qp, type RawSearchParams } from "@/lib/search-params";
import {
  CHANGE_REQUEST_STATUSES,
  type ChangeRequestStatus,
} from "@/types/member";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Listing corrections" };

export default async function AdminChangesPage({
  searchParams,
}: {
  searchParams?: Promise<RawSearchParams>;
}) {
  const requested = qp((await searchParams)?.status);
  const status: ChangeRequestStatus | "all" =
    requested === "all"
      ? "all"
      : CHANGE_REQUEST_STATUSES.includes(requested as ChangeRequestStatus)
        ? (requested as ChangeRequestStatus)
        : "pending";
  const rows = await listChangeRequests(status).catch(() => []);
  const tabs: Array<{ value: ChangeRequestStatus | "all"; label: string }> = [
    { value: "pending", label: "Needs review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-[var(--hero-pad-inline)] py-10 sm:py-14">
      <div>
        <p className="text-[0.68rem] font-bold tracking-[0.15em] text-[var(--accent-strong)] uppercase">Admin workspace</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--ink)]">Owner corrections</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">Compare every proposed value with the published listing before approving it.</p>
      </div>
      <nav aria-label="Change request status" className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link key={tab.value} href={tab.value === "pending" ? "/admin/changes" : `/admin/changes?status=${tab.value}`} className={`rounded-full border px-4 py-2 text-xs font-bold ${status === tab.value ? "border-[var(--accent)] bg-[var(--accent-xsoft)] text-[var(--accent-strong)]" : "border-[var(--line)] text-[var(--ink-soft)]"}`}>
            {tab.label}
          </Link>
        ))}
      </nav>
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)]">
        <div className="divide-y divide-[var(--line)]">
          {rows.length ? rows.map((row) => (
            <Link key={row.id} href={`/admin/changes/${row.id}`} className="grid gap-3 px-5 py-5 transition-colors hover:bg-[var(--surface-inset)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-[var(--ink)]">{row.business_name}</h2>
                  <span className="rounded-full bg-[var(--surface-inset)] px-2 py-1 text-[0.66rem] font-bold capitalize text-[var(--muted)] ring-1 ring-[var(--line)]">{row.status}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{row.full_name} · {row.change_count} changed {row.change_count === 1 ? "field" : "fields"}</p>
                {row.owner_note ? <p className="mt-2 line-clamp-1 text-sm text-[var(--ink-soft)]">“{row.owner_note}”</p> : null}
              </div>
              <div className="text-xs font-bold text-[var(--accent-strong)] sm:text-right">
                <time className="block font-normal text-[var(--muted)]" dateTime={row.submitted_at}>{new Date(row.submitted_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</time>
                Compare changes →
              </div>
            </Link>
          )) : <p className="px-5 py-14 text-center text-sm text-[var(--muted)]">No change requests in this queue.</p>}
        </div>
      </section>
    </div>
  );
}
