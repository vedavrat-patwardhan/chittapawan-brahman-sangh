import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewPanel } from "@/components/review-panel";
import { CorrectionLinkPanel } from "@/components/correction-link-panel";
import {
  findPotentialDuplicates,
  getAdminApplicationById,
} from "@/lib/directory-queries";
import { storagePublicUrl } from "@/lib/uploads";
import { effectiveListingStatus, type MemberReviewer } from "@/types/member";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review application",
};

type PageProps = { params: Promise<{ id: string }> };

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function list(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function safeUrl(value: unknown): string | null {
  const candidate = text(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function InfoSection({
  title,
  fields,
}: {
  title: string;
  fields: Array<{ label: string; value: string }>;
}) {
  const visible = fields.filter((field) => field.value);
  if (!visible.length) return null;
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">{title}</h2>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {visible.map((field) => (
          <div key={field.label}>
            <dt className="text-[0.66rem] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">{field.label}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function AdminApplicationDetailPage(props: PageProps) {
  const { id } = await props.params;
  const row = await getAdminApplicationById(id).catch(() => null);
  if (!row) notFound();

  const duplicates = await findPotentialDuplicates(
    {
      email: text(row.email),
      contact_number: text(row.contact_number),
      business_name: text(row.business_name),
    },
    id,
  ).catch(() => []);

  const status = effectiveListingStatus(row.status);
  const reviewer = row.reviewed_by as MemberReviewer | null | undefined;
  const profileUrl = storagePublicUrl(text(row.profile_photo_path));
  const portfolioUrls = list(row.portfolio_paths)
    .map(storagePublicUrl)
    .filter((url): url is string => Boolean(url));
  const cardUrl = storagePublicUrl(text(row.visiting_card_path));
  const externalLinks = [
    { label: "Website", href: safeUrl(row.website) },
    { label: "Google Maps", href: safeUrl(row.google_maps_link) },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-[var(--hero-pad-inline)] py-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-14">
      <div className="min-w-0 space-y-6">
        <div>
          <Link href="/admin" className="text-sm font-bold text-[var(--accent-strong)] hover:underline">← Review queue</Link>
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[var(--surface-inset)] px-3 py-1 text-xs font-bold capitalize text-[var(--ink-soft)] ring-1 ring-[var(--line-strong)]">{status}</span>
                <span className="text-xs text-[var(--muted)]">Reference {id.slice(-8).toUpperCase()}</span>
              </div>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">{text(row.business_name)}</h1>
              <p className="mt-2 text-lg text-[var(--ink-soft)]">{text(row.full_name)} · {text(row.city)}</p>
            </div>
            {profileUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- protected MongoDB upload route
              <img src={profileUrl} alt={`${text(row.full_name)} profile`} className="h-28 w-28 rounded-2xl border border-[var(--line)] object-cover" />
            ) : null}
          </div>
        </div>

        {duplicates.length ? (
          <section className="rounded-[var(--radius-card)] border border-[color-mix(in_oklch,var(--risk)_32%,transparent)] bg-[color-mix(in_oklch,var(--risk)_6%,transparent)] p-5">
            <p className="text-[0.68rem] font-bold tracking-[0.12em] text-[var(--risk)] uppercase">
              Possible duplicate
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
              {duplicates.length} similar {duplicates.length === 1 ? "listing" : "listings"} found
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              This is a review signal only. The owner may operate multiple legitimate businesses.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {duplicates.map((duplicate) => (
                <Link
                  key={duplicate.id}
                  href={`/admin/applications/${duplicate.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color-mix(in_oklch,var(--risk)_22%,transparent)] bg-[var(--surface-card)] px-4 py-3 text-sm hover:border-[var(--risk)]"
                >
                  <span>
                    <strong className="text-[var(--ink)]">{duplicate.business_name}</strong>
                    <span className="ml-2 text-[var(--muted)]">{duplicate.full_name}</span>
                  </span>
                  <span className="text-xs font-bold text-[var(--risk)]">
                    Matches {duplicate.matched_on.map((field) => field.replaceAll("_", " ")).join(" · ")} →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <InfoSection title="Applicant & contact" fields={[
          { label: "Full name", value: text(row.full_name) },
          { label: "Email", value: text(row.email) },
          { label: "Contact", value: text(row.contact_number) },
          { label: "WhatsApp", value: text(row.whatsapp_number) },
          { label: "Referred by", value: text(row.referred_by) },
        ]} />

        <InfoSection title="Business profile" fields={[
          { label: "Business name", value: text(row.business_name) },
          { label: "Category", value: text(row.business_category) },
          { label: "Sub-category", value: text(row.sub_category) },
          { label: "Business types", value: list(row.business_types).join(" · ") },
          { label: "Keywords", value: text(row.keywords_tags) },
          { label: "Products & services", value: text(row.products_services) },
          { label: "Specialization", value: text(row.specialization) },
          { label: "Experience", value: text(row.years_experience) },
          { label: "Price range", value: list(row.price_ranges).join(" · ") },
          { label: "Target customers", value: text(row.target_customers) },
        ]} />

        <InfoSection title="Location & presence" fields={[
          { label: "City", value: text(row.city) },
          { label: "Area / locality", value: text(row.area_locality) },
          { label: "Business address", value: text(row.business_address) },
          { label: "Service area", value: list(row.service_area).join(" · ") },
          { label: "Instagram", value: text(row.instagram) },
          { label: "Facebook", value: text(row.facebook) },
          { label: "LinkedIn", value: text(row.linkedin) },
        ]} />

        {externalLinks.length ? (
          <div className="flex flex-wrap gap-3">
            {externalLinks.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--accent-strong)] hover:border-[var(--accent)]">{item.label} ↗</a>
            ))}
          </div>
        ) : null}

        <InfoSection title="Highlights & networking" fields={[
          { label: "USP", value: text(row.usp) },
          { label: "Certifications", value: text(row.certifications) },
          { label: "Awards", value: text(row.awards) },
          { label: "Looking for", value: list(row.looking_for).join(" · ") },
          { label: "Preferred connections", value: list(row.preferred_categories_connect).join(" · ") },
        ]} />

        {portfolioUrls.length || cardUrl ? (
          <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">Submitted media</h2>
            {portfolioUrls.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolioUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element -- protected MongoDB upload route
                  <img key={url} src={url} alt="Portfolio submission" loading="lazy" className="aspect-square w-full rounded-xl border border-[var(--line)] object-cover" />
                ))}
              </div>
            ) : null}
            {cardUrl ? <a href={cardUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-bold text-[var(--accent-strong)] hover:underline">Open visiting card ↗</a> : null}
          </section>
        ) : null}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <section className="rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface-card)] p-5 shadow-[0_24px_60px_-45px_var(--ink)]">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">Decision</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Verify ownership, category, contact details, and community eligibility before publishing.</p>
          <div className="mt-5">
            <ReviewPanel applicationId={id} defaultNote={text(row.admin_note)} defaultReason={text(row.rejection_reason)} />
          </div>
        </section>

        {status === "approved" ? <CorrectionLinkPanel memberId={id} /> : null}

        <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-inset)] p-5 text-xs leading-relaxed text-[var(--muted)]">
          <p><strong className="text-[var(--ink-soft)]">Submitted:</strong> {new Date(text(row.created_at)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
          {text(row.reviewed_at) ? <p className="mt-2"><strong className="text-[var(--ink-soft)]">Last reviewed:</strong> {new Date(text(row.reviewed_at)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p> : null}
          {reviewer ? <p className="mt-2"><strong className="text-[var(--ink-soft)]">Reviewer:</strong> {reviewer.name} ({reviewer.email})</p> : null}
          <p className="mt-2"><strong className="text-[var(--ink-soft)]">Consent:</strong> {row.consent_share === true ? "Recorded" : "Legacy / unverified"}</p>
        </section>
      </aside>
    </div>
  );
}
