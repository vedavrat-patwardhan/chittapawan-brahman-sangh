import type { Metadata } from "next";
import Link from "next/link";

import { DirectoryPagination } from "@/components/directory-pagination";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TYPES,
} from "@/lib/constants/form-options";
import { listMembers } from "@/lib/directory-queries";
import { qp, type RawSearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business Directory",
  description:
    "Search and filter Chittapawan Brahman Sangh members by sector, business type, and city.",
};

type PageProps = {
  searchParams?: Promise<RawSearchParams & { demo_submitted?: string }>;
};

const fi =
  "w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface-card)] px-4 py-2.5 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]";

function NoticeBanner({
  title,
  message,
  tone = "info",
}: {
  title: string;
  message: string;
  tone?: "info" | "error";
}) {
  const styles =
    tone === "error"
      ? "border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_6%,transparent)]"
      : "border-[color-mix(in_oklch,var(--accent)_30%,transparent)] bg-[color-mix(in_oklch,var(--accent)_7%,transparent)]";

  return (
    <div
      role="status"
      className={`rounded-[var(--radius-card)] border p-5 text-sm text-[var(--ink)] ${styles}`}
    >
      <p className="font-semibold text-[var(--accent-strong)]">{title}</p>
      <p className="mt-2 text-[var(--ink-soft)]">{message}</p>
    </div>
  );
}

export default async function DirectoryPage(props: PageProps) {
  const raw = (await props.searchParams) ?? {};
  const search = qp(raw.search);
  const category = qp(raw.category);
  const city = qp(raw.city);
  const business_type = qp(raw.business_type);
  const pageRaw = qp(raw.page);
  const page = pageRaw ? Number(pageRaw) : 1;

  let data: Awaited<ReturnType<typeof listMembers>> = {
    rows: [],
    total: 0,
    page: 1,
    pageCount: 1,
  };
  let dbError: string | null = null;

  try {
    data = await listMembers({
      search,
      category,
      city,
      business_type,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    });
  } catch (e: unknown) {
    console.error(
      "[DirectoryPage] MongoDB query failed:",
      e instanceof Error ? e.message : "Unknown error",
    );
    dbError = "We could not reach the directory database.";
  }

  const demoSubmitted = qp(raw.demo_submitted) === "1";

  const baseQuery: Record<string, string | undefined> = {
    search,
    category,
    city,
    business_type,
  };
  const hasFilters = !!(search || category || city || business_type);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-[var(--hero-pad-inline)] py-10 sm:py-14">
      {demoSubmitted && (
        <NoticeBanner
          title="Demo submission received"
          message="Form validations are temporarily disabled for testing. Nothing was saved to the database while it is offline."
        />
      )}

      {dbError && (
        <NoticeBanner
          tone="error"
          title="Directory data unavailable"
          message={`${dbError} Please try again shortly; no unapproved data has been exposed.`}
        />
      )}

      {/* Header row */}
      <div className="motion-rise flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          Community business directory
        </h1>
        <Link
          className="inline-flex min-h-10 w-max items-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[color-mix(in_oklch,white_96%,var(--accent))] shadow-[0_16px_36px_-24px_var(--accent-strong)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] focus-visible:ring-focus"
          href="/join"
        >
          Add listing
        </Link>
      </div>

      {/* Filter bar */}
      <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-5 shadow-[0_24px_64px_-48px_color-mix(in_oklch,var(--accent)_20%,rgba(0,0,0,0.12))]">
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          method="get"
        >
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
              Search
            </span>
            <input
              name="search"
              defaultValue={search}
              placeholder="Name, keyword, service…"
              className={fi}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
              Sector
            </span>
            <select
              name="category"
              defaultValue={category ?? ""}
              className={fi}
            >
              <option value="">All sectors</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
              Business type
            </span>
            <select
              name="business_type"
              defaultValue={business_type ?? ""}
              className={fi}
            >
              <option value="">All types</option>
              {BUSINESS_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
              City
            </span>
            <input
              name="city"
              defaultValue={city}
              placeholder="Any city"
              className={fi}
            />
          </label>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[color-mix(in_oklch,white_96%,var(--accent))] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] focus-visible:ring-focus sm:flex-none"
            >
              Search
            </button>
            {hasFilters && (
              <Link
                className="inline-flex min-h-10 items-center rounded-full border border-[var(--line-strong)] px-5 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] focus-visible:ring-focus"
                href="/directory"
                scroll={false}
              >
                Clear
              </Link>
            )}
          </div>
        </form>
      </section>

      {/* Results */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold tabular-nums text-[var(--ink)]">
              {data.total}
            </span>{" "}
            {data.total === 1 ? "business" : "businesses"}
            {hasFilters ? " matching filters" : ""}
          </p>
          <p className="hidden text-xs text-[var(--muted)] sm:block">
            Scroll table sideways on mobile
          </p>
        </div>

        <div className="grid gap-3 sm:hidden">
          {data.rows.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] px-5 py-10 text-center text-sm text-[var(--muted)]">
              No approved businesses match those filters yet.{" "}
              <Link href="/join" className="font-bold text-[var(--accent-strong)] hover:underline">Apply for a listing →</Link>
            </div>
          ) : (
            data.rows.map((row) => (
              <article key={row.id} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-5 shadow-[0_18px_45px_-38px_var(--ink)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.64rem] font-bold tracking-[0.11em] text-[var(--accent-strong)] uppercase">{row.business_category}</p>
                      {row.is_verified_current ? <span className="rounded-full bg-[color-mix(in_oklch,var(--success)_10%,transparent)] px-2 py-0.5 text-[0.6rem] font-bold text-[var(--success)]">Verified ✓</span> : null}
                    </div>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--ink)]">{row.business_name}</h2>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">{row.full_name} · {row.city}</p>
                  </div>
                  <Link href={`/directory/${row.id}`} aria-label={`View ${row.business_name}`} className="shrink-0 rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-xs font-bold text-[var(--accent-strong)]">View →</Link>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">{row.products_services}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {row.business_types.slice(0, 2).map((type) => (
                    <span key={type} className="rounded-full bg-[var(--surface-inset)] px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--ink-soft)]">{type}</span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="-mx-[var(--hero-pad-inline)] hidden overflow-x-auto px-[var(--hero-pad-inline)] sm:mx-0 sm:block sm:px-0">
          <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                {[
                  "Member",
                  "Business",
                  "Sector",
                  "City",
                  "Types",
                  "Keywords",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "border-b border-[var(--line-strong)] px-4 py-3 text-[0.66rem] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase",
                      h === "" ? "text-right" : "",
                      h === "Member" ? "sticky left-0 bg-[var(--surface)]" : "",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center text-[var(--muted)]"
                  >
                    No approved businesses match those filters yet.{" "}
                    <Link
                      href="/join"
                      className="font-semibold text-[var(--accent-strong)] hover:underline underline-offset-4"
                    >
                      Add the first one →
                    </Link>
                  </td>
                </tr>
              ) : (
                data.rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-[var(--line)] text-[var(--ink-soft)] transition-[background-color] duration-150 hover:bg-[var(--surface-inset)]",
                      idx % 2 === 0
                        ? "bg-[var(--surface-card)]"
                        : "bg-[var(--surface-raised)]",
                    )}
                  >
                    <td className="sticky left-0 bg-inherit px-4 py-4 font-semibold text-[var(--ink)] shadow-[4px_0_10px_-6px_rgba(0,0,0,0.12)]">
                      {row.full_name}
                      {row.is_verified_current ? <span className="mt-1 block text-[0.62rem] font-bold text-[var(--success)]">Verified ✓</span> : null}
                    </td>
                    <td className="px-4 py-4 text-[var(--ink)]">
                      {row.business_name}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[var(--accent-xsoft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)] ring-1 ring-[var(--accent-soft)]">
                        {row.business_category}
                      </span>
                    </td>
                    <td className="px-4 py-4">{row.city}</td>
                    <td className="px-4 py-4 text-xs">
                      {row.business_types.slice(0, 2).join(" · ")}
                      {row.business_types.length > 2 ? "…" : ""}
                    </td>
                    <td className="max-w-[220px] px-4 py-4 text-xs text-[var(--muted)]">
                      {row.keywords_tags.length > 100
                        ? `${row.keywords_tags.slice(0, 100)}…`
                        : row.keywords_tags}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        className="inline-flex rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)] transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[var(--accent)] focus-visible:ring-focus"
                        href={`/directory/${row.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <DirectoryPagination
        page={data.page}
        pageCount={data.pageCount}
        baseQuery={baseQuery}
      />
    </div>
  );
}
