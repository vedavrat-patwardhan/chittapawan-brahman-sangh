import Link from "next/link";

import { cn } from "@/lib/utils/cn";

type Props = {
  page: number;
  pageCount: number;
  baseQuery: Record<string, string | undefined>;
};

function buildHref(pageNum: number, base: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, val] of Object.entries(base)) {
    if (!val || !val.trim()) continue;
    p.set(k, val.trim());
  }
  if (pageNum <= 1) p.delete("page");
  else p.set("page", String(pageNum));
  const qs = p.toString();
  return qs.length ? `/directory?${qs}` : "/directory";
}

export function DirectoryPagination({ page, pageCount, baseQuery }: Props) {
  if (pageCount <= 1) return null;
  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);
  const label = (
    <p className="text-sm tabular-nums text-[var(--muted)]">
      Page{" "}
      <span className="font-semibold text-[var(--ink)]">{page}</span>
      {" of "}
      <span className="font-semibold text-[var(--ink)]">{pageCount}</span>
    </p>
  );

  const btn =
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[color-mix(in_oklch,var(--accent)_22%,transparent)] bg-[var(--surface-card)] px-5 text-sm font-semibold text-[var(--ink)] transition-[transform,background-color,color] duration-200 ease-[var(--ease-out-expo)] hover:border-[color-mix(in_oklch,var(--accent)_35%,transparent)] hover:text-[var(--accent-strong)] active:scale-[0.985] disabled:opacity-40 sm:flex-none";

  const prevHref = page > 1 ? buildHref(prev, baseQuery) : null;
  const nextHref = page < pageCount ? buildHref(next, baseQuery) : null;

  return (
    <div className="flex flex-col gap-6 border-t border-[var(--line)] pt-10 sm:flex-row sm:items-center sm:justify-between">
      {label}
      <div className="flex items-center gap-3">
        {prevHref ? (
          <Link
            aria-label="Previous page"
            prefetch={false}
            className={cn(btn)}
            href={prevHref}
            scroll={false}
          >
            ← Previous
          </Link>
        ) : (
          <span
            aria-disabled
            className={cn(btn, "cursor-not-allowed opacity-45 hover:border-transparent hover:text-[var(--ink)]")}
          >
            ← Previous
          </span>
        )}
        {nextHref ? (
          <Link
            aria-label="Next page"
            prefetch={false}
            className={cn(btn)}
            href={nextHref}
            scroll={false}
          >
            Next →
          </Link>
        ) : (
          <span
            aria-disabled
            className={cn(btn, "cursor-not-allowed opacity-45 hover:border-transparent hover:text-[var(--ink)]")}
          >
            Next →
          </span>
        )}
      </div>
    </div>
  );
}
