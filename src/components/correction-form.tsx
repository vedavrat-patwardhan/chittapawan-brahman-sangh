"use client";

import { useActionState } from "react";

import {
  submitOwnerCorrection,
  submitAccountCorrection,
  type SubmitCorrectionState,
} from "@/app/actions/corrections";
import {
  BUSINESS_TYPES,
  LOOKING_FOR_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  YEARS_EXPERIENCE_OPTIONS,
} from "@/lib/constants/form-options";
import type { CorrectionContext } from "@/lib/corrections";
import { MultiSelect } from "@/components/select-field";

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[var(--ink)]">
      <span>
        {label}
        {required ? <span className="ml-1 text-[var(--risk)]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

export function CorrectionForm({
  token,
  memberId,
  context,
}: {
  token?: string;
  memberId?: string;
  context: CorrectionContext;
}) {
  const action = memberId
    ? submitAccountCorrection.bind(null, memberId)
    : submitOwnerCorrection.bind(null, token!);
  const [state, formAction, pending] = useActionState<
    SubmitCorrectionState,
    FormData
  >(action, undefined);
  const listing = context.listing;
  const serviceAreas = Array.isArray(listing.service_area)
    ? listing.service_area
    : [];
  const businessCategories = Array.isArray(listing.business_categories)
    ? listing.business_categories
    : [];
  const businessTypes = Array.isArray(listing.business_types) ? listing.business_types : [];
  const priceRanges = Array.isArray(listing.price_ranges) ? listing.price_ranges : [];
  const lookingFor = Array.isArray(listing.looking_for) ? listing.looking_for : [];
  const preferredCategories = Array.isArray(listing.preferred_categories_connect) ? listing.preferred_categories_connect : [];

  return (
    <form action={formAction} className="space-y-8">
      {state?.message ? (
        <div
          role="alert"
          className="rounded-xl border border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_7%,transparent)] px-4 py-3 text-sm text-[var(--risk)]"
        >
          {state.message}
        </div>
      ) : null}

      <section className="space-y-5">
        <div>
          <p className="text-[0.68rem] font-bold tracking-[0.12em] text-[var(--accent-strong)] uppercase">
            Owner & contact
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            Confirm how members can reach you
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required>
            <input name="full_name" defaultValue={String(listing.full_name)} required className="field-input" />
          </Field>
          <Field label="Business name" required>
            <input name="business_name" defaultValue={String(listing.business_name)} required className="field-input" />
          </Field>
          <Field label="Contact number" required>
            <input name="contact_number" type="tel" defaultValue={String(listing.contact_number)} required className="field-input" placeholder="+919876543210" />
          </Field>
          <Field label="WhatsApp number">
            <input name="whatsapp_number" type="tel" defaultValue={String(listing.whatsapp_number)} className="field-input" placeholder="+919876543210" />
          </Field>
          <Field label="Email" required>
            <input name="email" type="email" defaultValue={String(listing.email)} required className="field-input" />
          </Field>
        </div>
      </section>

      <section className="space-y-5 border-t border-[var(--line)] pt-8">
        <div>
          <p className="text-[0.68rem] font-bold tracking-[0.12em] text-[var(--accent-strong)] uppercase">
            Business profile
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            Correct your listing information
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Categories" required>
            <MultiSelect name="business_categories" options={context.businessCategories} defaultValue={businessCategories} maxSelections={5} />
          </Field>
          <Field label="Sub-category" required>
            <input name="sub_category" defaultValue={String(listing.sub_category)} required className="field-input" />
          </Field>
          <Field label="City" required>
            <input name="city" defaultValue={String(listing.city)} required className="field-input" />
          </Field>
          <Field label="Area / locality">
            <input name="area_locality" defaultValue={String(listing.area_locality)} className="field-input" />
          </Field>
        </div>
        <Field label="Products & services" required>
          <textarea name="products_services" defaultValue={String(listing.products_services)} required rows={5} className="field-input resize-y" />
        </Field>
        <Field label="Search keywords" required>
          <input name="keywords_tags" defaultValue={String(listing.keywords_tags)} required className="field-input" placeholder="tax, catering, interiors…" />
        </Field>
        <Field label="Specialization">
          <textarea name="specialization" defaultValue={String(listing.specialization)} rows={3} className="field-input resize-y" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Years of experience"><select name="years_experience" defaultValue={String(listing.years_experience)} className="field-input"><option value="">Not specified</option>{YEARS_EXPERIENCE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
          <Field label="Price ranges"><MultiSelect name="price_ranges" options={PRICE_RANGE_OPTIONS} defaultValue={priceRanges} maxSelections={3} /></Field>
        </div>
        <Field label="Business types" required><MultiSelect name="business_types" options={BUSINESS_TYPES} defaultValue={businessTypes} /></Field>
        <Field label="Business address">
          <textarea name="business_address" defaultValue={String(listing.business_address)} rows={3} className="field-input resize-y" />
        </Field>
        <Field label="Google Maps link"><input name="google_maps_link" defaultValue={String(listing.google_maps_link)} className="field-input" /></Field>
        <fieldset>
          <legend className="text-sm font-semibold text-[var(--ink)]">Service area</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SERVICE_AREA_OPTIONS.map((area) => (
              <label key={area} className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink-soft)]">
                <input type="checkbox" name="service_area" value={area} defaultChecked={serviceAreas.includes(area)} className="accent-[var(--accent)]" />
                {area}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="space-y-5 border-t border-[var(--line)] pt-8">
        <div><p className="text-[0.68rem] font-bold tracking-[0.12em] text-[var(--accent-strong)] uppercase">Trust & networking</p><h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">Complete the business profile</h2></div>
        <Field label="Unique value / USP"><textarea name="usp" defaultValue={String(listing.usp)} rows={3} className="field-input resize-y" /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Certifications"><textarea name="certifications" defaultValue={String(listing.certifications)} rows={3} className="field-input resize-y" /></Field><Field label="Awards"><textarea name="awards" defaultValue={String(listing.awards)} rows={3} className="field-input resize-y" /></Field></div>
        <Field label="Looking for"><MultiSelect name="looking_for" options={LOOKING_FOR_OPTIONS} defaultValue={lookingFor} maxSelections={4} /></Field>
        <Field label="Preferred business connections"><MultiSelect name="preferred_categories_connect" options={context.businessCategories} defaultValue={preferredCategories} /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Target customers"><textarea name="target_customers" defaultValue={String(listing.target_customers)} rows={3} className="field-input resize-y" /></Field><Field label="Referred by"><input name="referred_by" defaultValue={String(listing.referred_by)} className="field-input" /></Field></div>
      </section>

      <section className="space-y-5 border-t border-[var(--line)] pt-8">
        <div>
          <p className="text-[0.68rem] font-bold tracking-[0.12em] text-[var(--accent-strong)] uppercase">
            Online presence
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            Keep your links current
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website"><input name="website" defaultValue={String(listing.website)} className="field-input" /></Field>
          <Field label="Instagram"><input name="instagram" defaultValue={String(listing.instagram)} className="field-input" /></Field>
          <Field label="Facebook"><input name="facebook" defaultValue={String(listing.facebook)} className="field-input" /></Field>
          <Field label="LinkedIn"><input name="linkedin" defaultValue={String(listing.linkedin)} className="field-input" /></Field>
        </div>
        <Field label="Note for the administrators">
          <textarea name="owner_note" rows={3} maxLength={1_000} className="field-input resize-y" placeholder="Explain anything the reviewers should know…" />
        </Field>
      </section>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-inset)] p-4 text-sm leading-relaxed text-[var(--muted)]">
        Your published listing will stay unchanged until an administrator approves this request.{context.expiresAt ? ` This one-time link expires on ${new Date(context.expiresAt).toLocaleDateString("en-IN", { dateStyle: "long" })}.` : " You can track the request from your account."}
      </div>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-white transition-[transform,opacity] hover:-translate-y-0.5 disabled:opacity-55 sm:w-auto">
        {pending ? "Sending for review…" : "Submit corrections for review"}
      </button>
    </form>
  );
}
