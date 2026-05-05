import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element -- Supabase storage hosts vary per deployment */
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getMemberById } from "@/lib/directory-queries";
import { storagePublicUrl } from "@/lib/public-url";

export const dynamic = "force-dynamic";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function whatsAppLink(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[1.65rem] border border-[color-mix(in_oklch,var(--accent)_12%,transparent)] bg-[color-mix(in_oklch,var(--surface-card)_92%,transparent)] p-6 sm:p-7">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">{title}</h2>
      <div className="space-y-2 text-base leading-relaxed text-[var(--ink-soft)]">{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <p>
      <span className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </span>
      <br />
      <span className="text-[var(--ink)]">{value}</span>
    </p>
  );
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const row = await getMemberById(id);
    const name = asString(row?.full_name);
    const business = asString(row?.business_name);
    if (!row) return { title: "Not found" };
    return {
      title: name || business || "Member",
      description: business ? `${business} · ${asString(row.city)}` : "Directory member record",
    };
  } catch {
    return { title: "Member" };
  }
}

export default async function MemberDetailPage(props: PageProps) {
  const { id } = await props.params;
  let row: Record<string, unknown> | null;
  try {
    row = await getMemberById(id);
  } catch {
    notFound();
  }
  if (!row) notFound();

  const fullName = asString(row.full_name);
  const businessName = asString(row.business_name);
  const profileUrl = storagePublicUrl(asString(row.profile_photo_path));
  const portfolio = asStringArray(row.portfolio_paths)
    .map((p) => storagePublicUrl(p))
    .filter((u): u is string => Boolean(u));
  const visitingUrl = storagePublicUrl(asString(row.visiting_card_path));
  const wa = asString(row.whatsapp_number);
  const waHref = wa ? whatsAppLink(wa) : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-[var(--hero-pad-inline)] py-12 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          className="text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
          href="/directory"
          scroll={false}
        >
          ← Back to directory
        </Link>
        <p className="text-xs text-[var(--muted)]">
          Added{" "}
          <time dateTime={asString(row.created_at)}>
            {new Date(asString(row.created_at)).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        </p>
      </div>

      <header className="motion-rise flex flex-col gap-10 lg:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <div>
            <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-[var(--accent-strong)] uppercase">
              {asString(row.business_category)}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
              {fullName}
            </h1>
            <p className="mt-2 text-xl text-[var(--ink-soft)]">{businessName}</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {asString(row.city)}
              {asString(row.area_locality) ? ` · ${asString(row.area_locality)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              className="rounded-full border border-[color-mix(in_oklch,var(--accent)_24%,transparent)] px-4 py-2 font-semibold text-[var(--accent-strong)] transition-[transform] duration-200 hover:-translate-y-0.5 focus-visible:ring-focus"
              href={`tel:${asString(row.contact_number).replace(/\s+/g, "")}`}
            >
              Call
            </a>
            {waHref ? (
              <a
                className="rounded-full border border-[color-mix(in_oklch,var(--accent)_24%,transparent)] px-4 py-2 font-semibold text-[var(--accent-strong)] transition-[transform] duration-200 hover:-translate-y-0.5 focus-visible:ring-focus"
                href={waHref}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
            <a
              className="rounded-full border border-[color-mix(in_oklch,var(--accent)_24%,transparent)] px-4 py-2 font-semibold text-[var(--accent-strong)] transition-[transform] duration-200 hover:-translate-y-0.5 focus-visible:ring-focus"
              href={`mailto:${asString(row.email)}`}
            >
              Email
            </a>
          </div>
        </div>
        {profileUrl ? (
          <div className="relative aspect-[4/5] w-full max-w-xs self-start overflow-hidden rounded-[1.75rem] border border-[color-mix(in_oklch,var(--accent)_16%,transparent)] bg-[var(--surface-card)] shadow-[0_40px_90px_-70px_oklch(22%_0.05_62)]">
            <img
              src={profileUrl}
              alt={`${fullName} portrait`}
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-8">
        <DetailBlock title="Positioning">
          <Line label="Sub-category" value={asString(row.sub_category)} />
          <Line label="Business types" value={asStringArray(row.business_types).join(" · ") || null} />
          <Line label="Keywords" value={asString(row.keywords_tags)} />
          <Line label="Specialization" value={asString(row.specialization)} />
          <Line label="Experience" value={asString(row.years_experience)} />
          <Line label="Price bands" value={asStringArray(row.price_ranges).join(" · ") || null} />
          <div>
            <span className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
              Products / services
            </span>
            <p className="mt-2 whitespace-pre-wrap text-[var(--ink)]">{asString(row.products_services)}</p>
          </div>
          {asString(row.target_customers) ? (
            <div>
              <span className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                Target customers
              </span>
              <p className="mt-2 whitespace-pre-wrap text-[var(--ink)]">{asString(row.target_customers)}</p>
            </div>
          ) : null}
        </DetailBlock>

        <DetailBlock title="Location & reach">
          <Line label="Address" value={asString(row.business_address)} />
          <Line label="Service area" value={asStringArray(row.service_area).join(" · ") || null} />
          {asString(row.google_maps_link) ? (
            <p>
              <span className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                Maps
              </span>
              <br />
              <a
                className="text-[var(--accent-strong)] underline-offset-4 hover:underline"
                href={asString(row.google_maps_link)}
                target="_blank"
                rel="noreferrer"
              >
                Open map
              </a>
            </p>
          ) : null}
        </DetailBlock>

        <DetailBlock title="Presence">
          {asString(row.website) ? (
            <p>
              <span className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                Website
              </span>
              <br />
              <a
                className="break-all text-[var(--accent-strong)] underline-offset-4 hover:underline"
                href={
                  asString(row.website).startsWith("http")
                    ? asString(row.website)
                    : `https://${asString(row.website)}`
                }
                target="_blank"
                rel="noreferrer"
              >
                {asString(row.website)}
              </a>
            </p>
          ) : null}
          <Line label="Instagram" value={asString(row.instagram)} />
          <Line label="Facebook" value={asString(row.facebook)} />
          <Line label="LinkedIn" value={asString(row.linkedin)} />
        </DetailBlock>

        <DetailBlock title="Highlights">
          {asString(row.usp) ? (
            <div>
              <span className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
                USP
              </span>
              <p className="mt-2 whitespace-pre-wrap text-[var(--ink)]">{asString(row.usp)}</p>
            </div>
          ) : null}
          <Line label="Certifications" value={asString(row.certifications)} />
          <Line label="Awards" value={asString(row.awards)} />
        </DetailBlock>

        <DetailBlock title="Collaboration">
          <Line label="Looking for" value={asStringArray(row.looking_for).join(" · ") || null} />
          <Line
            label="Preferred categories"
            value={asStringArray(row.preferred_categories_connect).join(" · ") || null}
          />
          <Line label="Referred by" value={asString(row.referred_by)} />
        </DetailBlock>

        {(portfolio.length > 0 || visitingUrl) && (
          <DetailBlock title="Media">
            {portfolio.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {portfolio.map((src) => (
                  <div
                    key={src}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-[color-mix(in_oklch,var(--accent)_12%,transparent)]"
                  >
                    <img
                      src={src}
                      alt="Portfolio upload"
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            {visitingUrl ? (
              <p className="pt-2">
                <a
                  className="text-[var(--accent-strong)] underline-offset-4 hover:underline"
                  href={visitingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View visiting card
                </a>
              </p>
            ) : null}
          </DetailBlock>
        )}
      </div>
    </div>
  );
}
