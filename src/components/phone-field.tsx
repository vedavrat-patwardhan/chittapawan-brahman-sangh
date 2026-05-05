"use client";

import { forwardRef } from "react";
import PhoneInput, {
  type Country,
  getCountries,
  getCountryCallingCode,
} from "react-phone-number-input";
import type { Value } from "react-phone-number-input";

import { cn } from "@/lib/utils/cn";

/* ── Country select ──────────────────────────────────────────────────── */
const CountrySelect = ({
  value,
  onChange,
  disabled,
}: {
  value: Country;
  onChange: (country: Country) => void;
  disabled?: boolean;
}) => (
  <div className="phone-country-select">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Country)}
      disabled={disabled}
      aria-label="Country code"
      className="phone-country-native"
    >
      {getCountries().map((country) => (
        <option key={country} value={country}>
          +{getCountryCallingCode(country)} ({country})
        </option>
      ))}
    </select>
    {/* visible pill showing flag emoji + calling code */}
    <div aria-hidden className="phone-country-display" tabIndex={-1}>
      <span className="phone-flag">
        {value
          ? String.fromCodePoint(
              ...[...value].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
            )
          : "🌐"}
      </span>
      <span className="phone-code">+{value ? getCountryCallingCode(value) : "–"}</span>
      <svg
        aria-hidden
        width="10"
        height="6"
        viewBox="0 0 10 6"
        className="phone-chevron"
        fill="none"
      >
        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

/* ── Custom text input ───────────────────────────────────────────────── */
const PhoneTextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    ref={ref}
    {...props}
    className={cn("phone-number-input", props.className)}
  />
));
PhoneTextInput.displayName = "PhoneTextInput";

/* ── Public component ────────────────────────────────────────────────── */
export interface PhoneFieldProps {
  /** E.164 value like "+919876543210" */
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  defaultCountry?: Country;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  id?: string;
}

export function PhoneField({
  value,
  onChange,
  defaultCountry = "IN",
  placeholder,
  hasError = false,
  disabled,
  id,
}: PhoneFieldProps) {
  return (
    <div className={cn("phone-field-root", hasError && "phone-field-error")}>
      <PhoneInput
        id={id}
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder ?? "98765 43210"}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneTextInput}
        countryCallingCodeEditable={false}
        smartCaret
      />
    </div>
  );
}
