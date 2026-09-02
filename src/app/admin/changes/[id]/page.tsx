import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChangeReviewPanel } from "@/components/change-review-panel";
import { getChangeRequest } from "@/lib/corrections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review listing corrections" };

const labels: Record<string, string> = {
  full_name: "Full name",
  business_name: "Business name",
  contact_number: "Contact number",
  whatsapp_number: "WhatsApp number",
  email: "Email",
  city: "City",
  area_locality: "Area / locality",
  business_categories: "Categories",
  sub_category: "Sub-category",
  business_types: "Business types",
  keywords_tags: "Search keywords",
  products_services: "Products & services",
  specialization: "Specialization",
  years_experience: "Years of experience",
  price_ranges: "Price ranges",
  business_address: "Business address",
  service_area: "Service area",
  google_maps_link: "Google Maps link",
  website: "Website",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  usp: "Unique value / USP",
  certifications: "Certifications",
  awards: "Awards",
  looking_for: "Looking for",
  preferred_categories_connect: "Preferred connections",
  target_customers: "Target customers",
  referred_by: "Referred by",
};

function display(value: unknown): string {
  if (Array.isArray(value)) return value.join(" · ") || "—";
  return typeof value === "string" && value ? value : "—";
}

export default async function AdminChangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getChangeRequest(id).catch(() => null);
  if (!request) notFound();
  const changes = Object.entries(request.changes);
  const reviewed = request.status !== "pending";
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-[var(--hero-pad-inline)] py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-14">
      <main className="min-w-0 space-y-6">
        <div>
          <Link href="/admin/changes" className="text-sm font-bold text-[var(--accent-strong)] hover:underline">← Correction queue</Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[var(--surface-inset)] px-3 py-1 text-xs font-bold capitalize text-[var(--ink-soft)] ring-1 ring-[var(--line)]">{request.status}</span>
            <span className="text-xs text-[var(--muted)]">Reference {id.slice(-8).toUpperCase()}</span>
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--ink)]">{request.business_name}</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Submitted by {request.full_name} on {new Date(request.submitted_at).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
        </div>
        {request.owner_note ? (
          <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-inset)] p-5">
            <p className="text-[0.66rem] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">Owner note</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">{request.owner_note}</p>
          </section>
        ) : null}
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)]">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">Proposed changes</h2>
          </div>
          {changes.length ? (
            <div className="divide-y divide-[var(--line)]">
              {changes.map(([field, proposed]) => (
                <div key={field} className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                  <div>
                    <p className="text-[0.66rem] font-bold tracking-[0.1em] text-[var(--muted)] uppercase">Current {labels[field] ?? field}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">{display(request.current[field])}</p>
                  </div>
                  <div className="rounded-xl border border-[color-mix(in_oklch,var(--accent)_25%,transparent)] bg-[var(--accent-xsoft)] p-4">
                    <p className="text-[0.66rem] font-bold tracking-[0.1em] text-[var(--accent-strong)] uppercase">Proposed</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[var(--ink)]">{display(proposed)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="px-5 py-10 text-sm text-[var(--muted)]">No field changes; review the owner note above.</p>}
        </section>
      </main>
      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <section className="rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface-card)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">Decision</h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">Approval applies only the highlighted values. Rejection leaves the published listing unchanged.</p>
          <div className="mt-5"><ChangeReviewPanel requestId={id} defaultNote={request.admin_note ?? ""} disabled={reviewed} /></div>
        </section>
        <Link href={`/admin/applications/${request.member_id}`} className="inline-flex w-full justify-center rounded-full border border-[var(--line-strong)] px-4 py-2.5 text-xs font-bold text-[var(--accent-strong)]">Open full listing →</Link>
      </aside>
    </div>
  );
}
