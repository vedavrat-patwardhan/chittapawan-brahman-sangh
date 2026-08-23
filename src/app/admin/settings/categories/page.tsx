import type { Metadata } from "next";

import { CategorySettings } from "@/components/category-settings";
import { getBusinessCategories, getCategoryUsage } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Business categories" };

export default async function CategorySettingsPage() {
  const [categories, usage] = await Promise.all([
    getBusinessCategories(),
    getCategoryUsage().catch(() => ({})),
  ]);
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 px-[var(--hero-pad-inline)] py-10 sm:py-14">
      <div>
        <p className="text-[0.68rem] font-bold tracking-[0.15em] text-[var(--accent-strong)] uppercase">Directory settings</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--ink)]">Business categories</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">Keep the community taxonomy useful as the directory grows. Categories already used by a listing cannot be removed until those listings are reassigned.</p>
      </div>
      <CategorySettings categories={categories} usage={usage} />
    </div>
  );
}
