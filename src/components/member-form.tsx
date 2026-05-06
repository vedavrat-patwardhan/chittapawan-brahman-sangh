"use client";

import { useActionState, useRef, useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import type { Value as PhoneValue } from "react-phone-number-input";

import { submitDirectoryMember } from "@/app/actions/member";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TYPES,
  INDIA_CITIES,
  LOOKING_FOR_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  YEARS_EXPERIENCE_OPTIONS,
} from "@/lib/constants/form-options";
import { cn } from "@/lib/utils/cn";
import { PhoneField } from "@/components/phone-field";
import { MultiSelect, SearchableSelect } from "@/components/select-field";

/* ── Step manifest ─────────────────────────────────────────────────────── */
const STEPS = [
  { id: "contact", title: "Who you are", short: "Identity" },
  { id: "location", title: "Where you work", short: "Location" },
  { id: "business", title: "Your business", short: "Business" },
  { id: "services", title: "What you offer", short: "Services" },
  { id: "presence", title: "Find you online", short: "Presence" },
  { id: "network", title: "Connect & close", short: "Network" },
] as const;

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full name",
  business_name: "Business name",
  contact_number: "Contact number",
  email: "Email address",
  city: "City",
  business_category: "Business category",
  sub_category: "Sub-category",
  products_services: "Products / services",
  keywords_tags: "Keywords / tags",
  consent_share: "Consent",
};

const STEP_REQUIRED: Record<number, string[]> = {
  0: ["full_name", "business_name", "contact_number", "email"],
  1: ["city"],
  2: ["business_category", "sub_category"],
  3: ["products_services", "keywords_tags"],
  4: [],
  5: ["consent_share"],
};

/* ── Progress bar ──────────────────────────────────────────────────────── */
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = total > 1 ? (step / (total - 1)) * 100 : 100;
  return (
    <div className="relative flex items-start justify-between px-1">
      {/* track */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-4 h-[2px] -translate-y-1/2 rounded-full bg-(--line-strong)"
      />
      {/* fill */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-4 top-4 h-[2px] -translate-y-1/2 rounded-full bg-(--accent) transition-all duration-500 ease-(--ease-out-expo)"
        style={{ width: `calc(${pct}% * (100% - 2rem) / 100%)` }}
      />
      {Array.from({ length: total }, (_, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div
            key={i}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                done
                  ? "bg-(--accent) text-white shadow-[0_2px_8px_-2px_var(--accent-glow)]"
                  : active
                    ? "bg-(--accent) text-white shadow-[0_0_0_5px_var(--accent-soft),0_2px_8px_-2px_var(--accent-glow)]"
                    : "border-2 border-(--line-strong) bg-(--surface-raised) text-(--muted)",
              )}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-[0.6rem] font-semibold tracking-wider whitespace-nowrap uppercase sm:block",
                active ? "text-(--accent-strong)" : "text-(--muted)",
              )}
            >
              {STEPS[i].short}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Field wrapper with inline error ──────────────────────────────────── */
function WizardField({
  label,
  hint,
  required,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-field className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-(--ink)">
          {label}
          {required && (
            <span className="ml-0.5 text-(--accent)" aria-hidden>
              *
            </span>
          )}
        </span>
        {hint && !error && (
          <span className="shrink-0 text-[0.72rem] text-(--muted)">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-(--risk)"
        >
          <span aria-hidden className="text-[0.65rem]">
            ⚠
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

/* helper: base input class + error modifier */
function ic(errors: Record<string, string>, key: string) {
  return cn("field-input", errors[key] && "field-input-error");
}

/* ── Step shell ─────────────────────────────────────────────────────────── */
function StepShell({
  title,
  stepNum,
  children,
  visible,
  animClass,
}: {
  title: string;
  stepNum: number;
  children: React.ReactNode;
  visible: boolean;
  animClass: string;
}) {
  return (
    <div aria-hidden={!visible} className={cn(visible ? animClass : "hidden")}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-(--ink) sm:text-[1.85rem]">
          {title}
        </h2>
        <span
          aria-hidden
          className="shrink-0 select-none font-display text-[3rem] font-bold leading-none text-(--accent-soft) sm:text-[3.5rem]"
        >
          {String(stepNum + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}

/* ── Main form ──────────────────────────────────────────────────────────── */
export function MemberIntakeForm() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* Phone state — controlled so we can validate + pass to hidden inputs */
  const [contactPhone, setContactPhone] = useState<PhoneValue | undefined>(
    undefined,
  );
  const [whatsappPhone, setWhatsappPhone] = useState<PhoneValue | undefined>(
    undefined,
  );
  const [sameAsContact, setSameAsContact] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [state, formAction, isPending] = useActionState(
    submitDirectoryMember,
    undefined,
  );

  const total = STEPS.length;
  const isLast = step === total - 1;
  const animClass = dir === "forward" ? "step-forward" : "step-back";

  function clearError(name: string) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  }

  function validateCurrentStep(): boolean {
    const form = formRef.current;
    if (!form) return true;

    const required = STEP_REQUIRED[step] ?? [];
    const errors: Record<string, string> = {};

    for (const name of required) {
      if (name === "consent_share") {
        const cb = form.querySelector<HTMLInputElement>(
          '[name="consent_share"]',
        );
        if (!cb?.checked) errors.consent_share = "You must agree to continue.";
        continue;
      }

      /* Phone fields are controlled — validate against state value */
      if (name === "contact_number") {
        if (!contactPhone) {
          errors.contact_number = "Contact number is required";
        } else if (!isValidPhoneNumber(contactPhone)) {
          errors.contact_number =
            "Enter a valid phone number for the selected country";
        }
        continue;
      }

      const el = form.querySelector<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >(`[name="${name}"]`);
      if (!el || !el.value.trim()) {
        errors[name] = `${FIELD_LABELS[name] ?? name} is required`;
      }
    }

    setFieldErrors(errors);

    /* Focus first errored field */
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      if (firstKey === "contact_number") {
        form.querySelector<HTMLElement>(".phone-number-input")?.focus();
      } else {
        const el = form.querySelector<HTMLElement>(`[name="${firstKey}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus({ preventScroll: true });
      }
    }

    return Object.keys(errors).length === 0;
  }

  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    if (validateCurrentStep()) {
      setDir("forward");
      setStep((s) => Math.min(s + 1, total - 1));
      setFieldErrors({});
      scrollToTop();
    }
  }

  function back() {
    setDir("back");
    setStep((s) => Math.max(s - 1, 0));
    setFieldErrors({});
    scrollToTop();
  }

  return (
    <div
      ref={topRef}
      className="mx-auto w-full max-w-(--form-max-w) px-(--hero-pad-inline) py-10 sm:py-14"
    >
      {/* Page header */}
      <div className="mb-8">
        <p className="mb-2 text-[0.68rem] font-semibold tracking-[0.16em] text-(--accent-strong) uppercase">
          Member directory · {STEPS.length}-step intake
        </p>
        <h1 className="font-display text-[clamp(2rem,5vw,2.75rem)] font-bold leading-tight tracking-tight text-(--ink)">
          Join the Sangh directory.
        </h1>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <ProgressBar step={step} total={total} />
      </div>

      {/* Server-side error */}
      {state?.message && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-[color-mix(in_oklch,var(--risk)_30%,transparent)] bg-[color-mix(in_oklch,var(--risk)_7%,transparent)] px-5 py-4 text-sm text-(--ink)"
        >
          {state.message}
        </div>
      )}

      {/* Form card */}
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="rounded-(--radius-card) border border-(--line) bg-(--surface-card) p-6 shadow-[0_24px_64px_-48px_color-mix(in_oklch,var(--accent)_24%,rgba(0,0,0,0.16))] sm:p-8"
      >
        {/* ── Step 0 : Identity ──────────────────────────────────────── */}
        <StepShell
          stepNum={0}
          title={STEPS[0].title}
          visible={step === 0}
          animClass={animClass}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <WizardField
              label="Full name"
              required
              error={fieldErrors.full_name}
            >
              <input
                name="full_name"
                autoComplete="name"
                placeholder="Ramesh Kulkarni"
                className={ic(fieldErrors, "full_name")}
                onChange={() => clearError("full_name")}
              />
            </WizardField>
            <WizardField
              label="Business name"
              required
              error={fieldErrors.business_name}
            >
              <input
                name="business_name"
                placeholder="Kulkarni Associates"
                className={ic(fieldErrors, "business_name")}
                onChange={() => clearError("business_name")}
              />
            </WizardField>
          </div>

          <WizardField
            label="Profile photo"
            hint="Optional · JPG / PNG / WebP, max 5 MB"
          >
            <input
              name="profile_photo"
              type="file"
              accept="image/*"
              className="field-input"
            />
          </WizardField>

          <WizardField
            label="Contact number"
            required
            error={fieldErrors.contact_number}
          >
            {/* Hidden input carries E.164 value into FormData */}
            <input
              type="hidden"
              name="contact_number"
              value={contactPhone ?? ""}
            />
            <PhoneField
              value={contactPhone}
              onChange={(v) => {
                setContactPhone(v);
                clearError("contact_number");
              }}
              hasError={!!fieldErrors.contact_number}
              placeholder="98765 43210"
            />
          </WizardField>

          <WizardField label="WhatsApp number" hint="Optional">
            <input
              type="hidden"
              name="whatsapp_number"
              value={
                sameAsContact ? (contactPhone ?? "") : (whatsappPhone ?? "")
              }
            />
            {/* Same-as-contact toggle */}
            <label className="mb-2 flex cursor-pointer items-center gap-2.5 select-none">
              <input
                type="checkbox"
                checked={sameAsContact}
                onChange={(e) => {
                  setSameAsContact(e.target.checked);
                  if (e.target.checked) setWhatsappPhone(undefined);
                }}
                className="h-4 w-4 accent-(--accent)"
              />
              <span className="text-sm text-(--ink-soft)">
                Same as contact number
              </span>
            </label>
            {!sameAsContact && (
              <PhoneField
                value={whatsappPhone}
                onChange={setWhatsappPhone}
                placeholder="98765 43210"
              />
            )}
            {sameAsContact && contactPhone && (
              <p className="rounded-lg border border-(--line) bg-(--surface-inset) px-3.5 py-2.5 text-sm text-(--ink-soft)">
                Will use{" "}
                <span className="font-semibold text-(--ink)">
                  {contactPhone}
                </span>
              </p>
            )}
          </WizardField>

          <WizardField label="Email address" required error={fieldErrors.email}>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ramesh@example.com"
              className={ic(fieldErrors, "email")}
              onChange={() => clearError("email")}
            />
          </WizardField>
        </StepShell>

        {/* ── Step 1 : Location ──────────────────────────────────────── */}
        <StepShell
          stepNum={1}
          title={STEPS[1].title}
          visible={step === 1}
          animClass={animClass}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <WizardField label="City" required error={fieldErrors.city}>
              <SearchableSelect
                name="city"
                options={INDIA_CITIES}
                placeholder="Search city…"
                hasError={!!fieldErrors.city}
                onChange={() => clearError("city")}
              />
            </WizardField>
            <WizardField label="Area / locality">
              <input
                name="area_locality"
                placeholder="Tilak Road"
                className="field-input"
              />
            </WizardField>
          </div>

          <WizardField label="Business address">
            <textarea
              name="business_address"
              className="field-input resize-y min-h-[100px]"
              placeholder="Shop / office address…"
              rows={3}
            />
          </WizardField>

          <WizardField label="Service area" hint="Select all that apply">
            <MultiSelect
              name="service_area"
              options={SERVICE_AREA_OPTIONS}
              placeholder="Select areas you serve…"
            />
          </WizardField>

          <WizardField label="Google Maps link" hint="Optional">
            <input
              name="google_maps_link"
              className="field-input"
              placeholder="https://maps.google.com/…"
            />
          </WizardField>
        </StepShell>

        {/* ── Step 2 : Business ──────────────────────────────────────── */}
        <StepShell
          stepNum={2}
          title={STEPS[2].title}
          visible={step === 2}
          animClass={animClass}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <WizardField
              label="Business category"
              required
              error={fieldErrors.business_category}
            >
              <SearchableSelect
                name="business_category"
                options={BUSINESS_CATEGORIES}
                placeholder="Select sector…"
                hasError={!!fieldErrors.business_category}
                onChange={() => clearError("business_category")}
              />
            </WizardField>
            <WizardField
              label="Sub-category"
              required
              hint="e.g. 'GST consultant'"
              error={fieldErrors.sub_category}
            >
              <input
                name="sub_category"
                placeholder="Your specific niche"
                className={ic(fieldErrors, "sub_category")}
                onChange={() => clearError("sub_category")}
              />
            </WizardField>
          </div>

          <WizardField label="Business type(s)" hint="Select all that apply">
            <MultiSelect
              name="business_types"
              options={BUSINESS_TYPES}
              placeholder="Select business types…"
            />
          </WizardField>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <WizardField label="Years of experience">
              <SearchableSelect
                name="years_experience"
                options={YEARS_EXPERIENCE_OPTIONS}
                placeholder="Select range…"
              />
            </WizardField>
            <WizardField label="Price positioning" hint="Optional">
              <MultiSelect
                name="price_ranges"
                options={PRICE_RANGE_OPTIONS}
                placeholder="Select positioning…"
              />
            </WizardField>
          </div>

          <WizardField label="Specialization" hint="One sharp line — optional">
            <input
              name="specialization"
              className="field-input"
              placeholder="What you're best known for"
            />
          </WizardField>
        </StepShell>

        {/* ── Step 3 : Services ──────────────────────────────────────── */}
        <StepShell
          stepNum={3}
          title={STEPS[3].title}
          visible={step === 3}
          animClass={animClass}
        >
          <WizardField
            label="Products / services"
            required
            hint="What someone actually commissions from you"
            error={fieldErrors.products_services}
          >
            <textarea
              name="products_services"
              className={cn(
                "field-input resize-y min-h-[120px]",
                fieldErrors.products_services && "field-input-error",
              )}
              rows={5}
              placeholder="Describe what you offer in plain language…"
              onChange={() => clearError("products_services")}
            />
          </WizardField>

          <WizardField
            label="Keywords / tags"
            required
            hint="Comma-separated — e.g. 'GST, audit, SMEs'"
            error={fieldErrors.keywords_tags}
          >
            <input
              name="keywords_tags"
              placeholder="keyword1, keyword2, keyword3"
              className={ic(fieldErrors, "keywords_tags")}
              onChange={() => clearError("keywords_tags")}
            />
          </WizardField>
        </StepShell>

        {/* ── Step 4 : Presence ──────────────────────────────────────── */}
        <StepShell
          stepNum={4}
          title={STEPS[4].title}
          visible={step === 4}
          animClass={animClass}
        >
          <WizardField label="Website">
            <input
              name="website"
              inputMode="url"
              className="field-input"
              placeholder="https://yoursite.com"
            />
          </WizardField>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <WizardField label="Instagram">
              <input
                name="instagram"
                className="field-input"
                placeholder="@handle or full URL"
              />
            </WizardField>
            <WizardField label="Facebook">
              <input
                name="facebook"
                className="field-input"
                placeholder="Page name or URL"
              />
            </WizardField>
          </div>

          <WizardField label="LinkedIn">
            <input
              name="linkedin"
              className="field-input"
              placeholder="Profile or company URL"
            />
          </WizardField>

          <WizardField
            label="Unique selling proposition"
            hint="What makes you stand out?"
          >
            <textarea
              name="usp"
              className="field-input resize-y min-h-[100px]"
              rows={4}
              placeholder="Why clients choose you over others…"
            />
          </WizardField>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <WizardField label="Certifications / licences" hint="Optional">
              <input
                name="certifications"
                className="field-input"
                placeholder="CA, FSSAI, ISO 9001…"
              />
            </WizardField>
            <WizardField label="Awards / achievements" hint="Optional">
              <input
                name="awards"
                className="field-input"
                placeholder="Best vendor 2023…"
              />
            </WizardField>
          </div>
        </StepShell>

        {/* ── Step 5 : Network + Media + Consent ─────────────────────── */}
        <StepShell
          stepNum={5}
          title={STEPS[5].title}
          visible={step === 5}
          animClass={animClass}
        >
          <WizardField
            label="Looking for"
            hint="Helps members approach you correctly"
          >
            <MultiSelect
              name="looking_for"
              options={LOOKING_FOR_OPTIONS}
              placeholder="What are you looking for?"
            />
          </WizardField>

          <WizardField label="Sectors you want to connect with">
            <MultiSelect
              name="preferred_categories_connect"
              options={BUSINESS_CATEGORIES}
              placeholder="Search and select sectors…"
            />
          </WizardField>

          <WizardField label="Target customers" hint="Optional">
            <textarea
              name="target_customers"
              className="field-input resize-y min-h-[90px]"
              rows={3}
              placeholder="Who pays you — businesses, homeowners, students…"
            />
          </WizardField>

          <WizardField label="Referred by / group name" hint="Optional">
            <input
              name="referred_by"
              className="field-input"
              placeholder="Name or WhatsApp group"
            />
          </WizardField>

          {/* Media uploads */}
          <div className="rounded-xl border border-(--line) bg-(--surface-inset) p-5">
            <p className="mb-4 text-[0.68rem] font-bold tracking-wider text-(--muted) uppercase">
              Media uploads · optional
            </p>
            <div className="flex flex-col gap-4">
              <WizardField
                label="Portfolio / product photos"
                hint="Multiple files, max 5 MB each"
              >
                <input
                  name="portfolio"
                  type="file"
                  multiple
                  accept="image/*"
                  className="field-input"
                />
              </WizardField>
              <WizardField label="Visiting card scan" hint="JPG, PNG, or PDF">
                <input
                  name="visiting_card"
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="field-input"
                />
              </WizardField>
            </div>
          </div>

          {/* Consent */}
          <div
            className={cn(
              "rounded-xl border-2 p-5 transition-colors duration-150",
              fieldErrors.consent_share
                ? "border-[color-mix(in_oklch,var(--risk)_50%,transparent)] bg-[color-mix(in_oklch,var(--risk)_4%,var(--surface-raised))]"
                : "border-(--line-strong) bg-(--surface-raised)",
            )}
          >
            <label className="flex cursor-pointer gap-4">
              <input
                type="checkbox"
                name="consent_share"
                value="on"
                className="mt-0.5 h-5 w-5 shrink-0 accent-(--accent)"
                onChange={() => clearError("consent_share")}
              />
              <span className="text-sm leading-relaxed text-(--ink-soft)">
                <strong className="font-semibold text-(--ink)">I agree</strong>{" "}
                to share my details with verified Chittapawan Brahman Sangh
                members for networking and business discovery. This listing will
                be visible to all registered members.
              </span>
            </label>
            {fieldErrors.consent_share && (
              <p
                role="alert"
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-(--risk)"
              >
                <span aria-hidden className="text-[0.65rem]">
                  ⚠
                </span>
                {fieldErrors.consent_share}
              </p>
            )}
          </div>
        </StepShell>
      </form>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-(--line-strong) bg-(--surface-card) px-6 text-sm font-semibold text-(--ink-soft) transition-[border-color,color,transform] duration-200 hover:border-(--accent) hover:text-(--ink) active:scale-[0.97] focus-visible:ring-focus"
            >
              ← Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-(--muted)">
            {step + 1} / {total}
          </span>

          {isLast ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (validateCurrentStep() && formRef.current) {
                  formRef.current.requestSubmit();
                }
              }}
              className="inline-flex min-h-11 items-center rounded-full bg-(--accent) px-8 text-sm font-semibold text-white shadow-[0_12px_32px_-18px_var(--accent-strong)] transition-[transform,background-color,opacity] duration-200 hover:bg-(--accent-strong) active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-focus"
            >
              {isPending ? "Saving…" : "Submit listing"}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-11 items-center rounded-full bg-(--accent) px-8 text-sm font-semibold text-white shadow-[0_12px_32px_-18px_var(--accent-strong)] transition-[transform,background-color] duration-200 hover:bg-(--accent-strong) active:scale-[0.97] focus-visible:ring-focus"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
