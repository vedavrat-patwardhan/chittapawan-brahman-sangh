import type { Metadata } from "next";
import Link from "next/link";

import { DirectoryPagination } from "@/components/directory-pagination";
import {
  getApplicationCounts,
  listApplications,
  type ApplicationCounts,
} from "@/lib/directory-queries";
import { qp, type RawSearchParams } from "@/lib/search-params";
import { LISTING_STATUSES, type ListingStatus } from "@/types/member";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Application review",
  description: "Review and publish community business directory applications.",
};

type PageProps = {
  searchParams?: Promise<RawSearchParams>;
};

const emptyCounts: ApplicationCounts = {
  all: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  verificationDue: 0,
};

function statusTone(status: ListingStatus): string {
  if (status === "approved") {
    return "bg-[color-mix(in_oklch,var(--success)_10%,transparent)] text-[var(--success)] ring-[color-mix(in_oklch,var(--success)_24%,transparent)]";
  }
  if (status === "rejected") {
    return "bg-[color-mix(in_oklch,var(--risk)_8%,transparent)] text-[var(--risk)] ring-[color-mix(in_oklch,var(--risk)_22%,transparent)]";
  }
  return "bg-[var(--accent-xsoft)] text-[var(--accent-strong)] ring-[var(--accent-soft)]";
}

export default async function AdminDashboardPage(props: PageProps) {
  const raw = (await props.searchParams) ?? {};
  const search = qp(raw.search);
  const requestedStatus = qp(raw.status);
  const verification = qp(raw.verification) === "due" ? "due" : undefined;
  const status: ListingStatus | "all" =
    requestedStatus === "all"
      ? "all"
      : LISTING_STATUSES.includes(requestedStatus as ListingStatus)
        ? (requestedStatus as ListingStatus)
        : verification
          ? "approved"
          : "pending";
  const parsedPage = Number(qp(raw.page) ?? "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  let counts = emptyCounts;
  let applications: Awaited<ReturnType<typeof listApplications>> = {
    rows: [],
    total: 0,
    page: 1,
    pageCount: 1,
  };
  let dbError = false;
  try {
    [counts, applications] = await Promise.all([
      getApplicationCounts(),
      listApplications({ search, status, verification, page }),
    ]);
  } catch (error) {
    dbError = true;
    console.error(
      "[AdminDashboardPage] MongoDB query failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  const tabs: Array<{ value: ListingStatus | "all"; label: string; count: number }> = [
    { value: "pending", label: "Needs review", count: counts.pending },
    { value: "approved", label: "Published", count: counts.approved },
    { value: "rejected", label: "Rejected", count: counts.rejected },
    { value: "all", label: "All", count: counts.all },
  ];
  const exportParams = new URLSearchParams();
  if (status !== "all") exportParams.set("status", status);
  if (search) exportParams.set("search", search);
  if (verification) exportParams.set("verification", verification);
  const exportHref = `/admin/export?${exportParams.toString()}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-[var(--hero-pad-inline)] py-10 sm:py-14">
      <div className="motion-rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-bold tracking-[0.15em] text-[var(--accent-strong)] uppercase">
            Admin workspace
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--ink)]">
            Application review
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">
            New submissions stay private until an administrator verifies and publishes them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={exportHref}
            className="inline-flex min-h-10 w-max items-center rounded-full bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--surface-card)] transition-opacity hover:opacity-85"
          >
            Export CSV ↓
          </a>
          <Link
            href="/join"
            className="inline-flex min-h-10 w-max items-center rounded-full border border-[var(--line-strong)] px-5 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
          >
            Open public form ↗
          </Link>
        </div>
      </div>

      {dbError ? (
        <div role="alert" className="rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_6%,transparent)] p-5 text-sm text-[var(--ink-soft)]">
          <strong className="text-[var(--risk)]">MongoDB is unavailable.</strong>{" "}
          Check the Atlas network allowlist, TLS access, and <code>MONGODB_URI</code>. No application data was changed.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Application totals">
        {tabs.map((tab) => {
          const active = tab.value === status;
          const href = new URLSearchParams();
          if (tab.value !== "pending") href.set("status", tab.value);
          if (search) href.set("search", search);
          const query = href.toString();
          return (
            <Link
              key={tab.value}
              href={query ? `/admin?${query}` : "/admin"}
              scroll={false}
              className={`rounded-[var(--radius-card)] border p-5 transition-[transform,border-color,background-color] hover:-translate-y-0.5 ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent-xsoft)]"
                  : "border-[var(--line)] bg-[var(--surface-card)]"
              }`}
            >
              <span className="block font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-[var(--ink)]">
                {tab.count}
              </span>
              <span className="mt-1 block text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </section>

      <Link
        href={verification ? "/admin?status=approved" : "/admin?status=approved&verification=due"}
        className={`flex flex-col gap-2 rounded-[var(--radius-card)] border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${verification ? "border-[var(--risk)] bg-[color-mix(in_oklch,var(--risk)_6%,transparent)]" : "border-[var(--line)] bg-[var(--surface-card)] hover:border-[var(--risk)]"}`}
      >
        <span>
          <strong className="text-sm text-[var(--ink)]">Annual verification due</strong>
          <span className="mt-1 block text-xs text-[var(--muted)]">Listings remain published while the team confirms their details.</span>
        </span>
        <span className="text-2xl font-bold tabular-nums text-[var(--risk)]">{counts.verificationDue}</span>
      </Link>

      <form method="get" className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-4 sm:flex-row">
        {status !== "pending" ? <input type="hidden" name="status" value={status} /> : null}
        {verification ? <input type="hidden" name="verification" value="due" /> : null}
        <label className="sr-only" htmlFor="admin-search">Search applications</label>
        <input
          id="admin-search"
          name="search"
          defaultValue={search}
          placeholder="Search name, business, email, phone, city…"
          className="field-input flex-1"
        />
        <button type="submit" className="min-h-11 rounded-full bg-[var(--ink)] px-6 text-sm font-semibold text-[var(--surface-card)]">
          Search
        </button>
        {search ? (
          <Link href={verification ? "/admin?status=approved&verification=due" : status === "pending" ? "/admin" : `/admin?status=${status}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line-strong)] px-5 text-sm font-semibold text-[var(--ink-soft)]">
            Clear
          </Link>
        ) : null}
      </form>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)]">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <p className="text-sm text-[var(--muted)]">
            <span className="font-bold tabular-nums text-[var(--ink)]">{applications.total}</span>{" "}
            {applications.total === 1 ? "application" : "applications"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--surface-inset)] text-[0.66rem] tracking-[0.12em] text-[var(--muted)] uppercase">
              <tr>
                <th className="px-5 py-3 font-bold">Applicant</th>
                <th className="px-5 py-3 font-bold">Business</th>
                <th className="px-5 py-3 font-bold">Category</th>
                <th className="px-5 py-3 font-bold">Submitted</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {applications.rows.length ? applications.rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-[var(--surface-inset)]">
                  <td className="px-5 py-4">
                    <p className="font-bold text-[var(--ink)]">{row.full_name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{row.email}</p>
                    {row.duplicate_risk ? (
                      <p className="mt-1 text-[0.68rem] font-bold text-[var(--risk)]">
                        Possible duplicate
                      </p>
                    ) : null}
                    {row.status === "approved" && !row.is_verified_current ? (
                      <p className="mt-1 text-[0.68rem] font-bold text-[var(--risk)]">Verification due</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[var(--ink-soft)]">{row.business_name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{row.city}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--ink-soft)]">{row.business_categories.join(", ")}</td>
                  <td className="px-5 py-4 text-xs text-[var(--muted)]">
                    <time dateTime={row.created_at}>{new Date(row.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</time>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-bold capitalize ring-1 ${statusTone(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/applications/${row.id}`} className="inline-flex rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-xs font-bold text-[var(--accent-strong)] hover:border-[var(--accent)]">
                      Review →
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-[var(--muted)]">Nothing in this queue.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <DirectoryPagination
        page={applications.page}
        pageCount={applications.pageCount}
        pathname="/admin"
        baseQuery={{ search, status: status === "pending" ? undefined : status, verification }}
      />
    </div>
  );
}
