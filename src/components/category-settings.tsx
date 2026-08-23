"use client";

import { useActionState } from "react";

import {
  updateBusinessCategories,
  type CategoryActionState,
} from "@/app/actions/categories";
import type { CategoryUsage } from "@/lib/categories";

export function CategorySettings({
  categories,
  usage,
}: {
  categories: string[];
  usage: CategoryUsage;
}) {
  const [state, formAction, pending] = useActionState<
    CategoryActionState,
    FormData
  >(updateBusinessCategories, undefined);
  return (
    <div className="space-y-6">
      {state ? (
        <div role={state.success ? "status" : "alert"} className={`rounded-xl border px-4 py-3 text-sm ${state.success ? "border-[color-mix(in_oklch,var(--success)_28%,transparent)] text-[var(--success)]" : "border-[color-mix(in_oklch,var(--risk)_30%,transparent)] text-[var(--risk)]"}`}>
          {state.message}
        </div>
      ) : null}
      <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-5 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
          New category
          <input name="new_category" minLength={2} maxLength={80} required className="field-input" placeholder="e.g. Arts & Creative Services" />
        </label>
        <button name="operation" value="add" disabled={pending} className="min-h-11 self-end rounded-full bg-[var(--ink)] px-6 text-sm font-bold text-[var(--surface-card)] disabled:opacity-55">
          Add category
        </button>
      </form>
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)]">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <p className="text-sm text-[var(--muted)]"><strong className="text-[var(--ink)]">{categories.length}</strong> categories · order is reused in public forms and filters</p>
        </div>
        <ol className="divide-y divide-[var(--line)]">
          {categories.map((category, index) => {
            const used = usage[category] ?? 0;
            return (
              <li key={category} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface-inset)] text-xs font-bold tabular-nums text-[var(--muted)]">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--ink)]">{category}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">Referenced by {used} {used === 1 ? "listing" : "listings"}</p>
                  </div>
                </div>
                <form action={formAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="category" value={category} />
                  <button name="operation" value="up" disabled={pending || index === 0} aria-label={`Move ${category} up`} className="min-h-9 rounded-full border border-[var(--line)] px-3 text-xs font-bold text-[var(--ink-soft)] disabled:opacity-35">↑</button>
                  <button name="operation" value="down" disabled={pending || index === categories.length - 1} aria-label={`Move ${category} down`} className="min-h-9 rounded-full border border-[var(--line)] px-3 text-xs font-bold text-[var(--ink-soft)] disabled:opacity-35">↓</button>
                  <button name="operation" value="remove" disabled={pending || used > 0 || categories.length === 1} title={used ? "Reassign existing listings before removing this category" : "Remove unused category"} className="min-h-9 rounded-full border border-[color-mix(in_oklch,var(--risk)_28%,transparent)] px-3 text-xs font-bold text-[var(--risk)] disabled:cursor-not-allowed disabled:opacity-35">Remove</button>
                </form>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
