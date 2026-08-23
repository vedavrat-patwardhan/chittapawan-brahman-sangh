"use client";

import { useActionState } from "react";

import {
  submitOwnerCorrection,
  type SubmitCorrectionState,
} from "@/app/actions/corrections";
import {
  BUSINESS_CATEGORIES,
  SERVICE_AREA_OPTIONS,
} from "@/lib/constants/form-options";
import type { CorrectionContext } from "@/lib/corrections";

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
  context,
}: {
  token: string;
  context: CorrectionContext;
}) {
  const action = submitOwnerCorrection.bind(null, token);
  const [state, formAction, pending] = useActionState<
    SubmitCorrectionState,
    FormData
  >(action, undefined);
  const listing = context.listing;
  const serviceAreas = Array.isArray(listing.service_area)
    ? listing.service_area
    : [];

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
          <Field label="Category" required>
            <select name="business_category" defaultValue={String(listing.business_category)} required className="field-input">
              {BUSINESS_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
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
        <Field label="Business address">
          <textarea name="business_address" defaultValue={String(listing.business_address)} rows={3} className="field-input resize-y" />
        </Field>
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
        Your published listing will stay unchanged until an administrator approves this request. This one-time link expires on {new Date(context.expiresAt).toLocaleDateString("en-IN", { dateStyle: "long" })}.
      </div>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-white transition-[transform,opacity] hover:-translate-y-0.5 disabled:opacity-55 sm:w-auto">
        {pending ? "Sending for review…" : "Submit corrections for review"}
      </button>
    </form>
  );
}
