import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

import {
  BUSINESS_TYPES,
  LOOKING_FOR_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  YEARS_EXPERIENCE_OPTIONS,
} from "@/lib/constants/form-options";

const optTrim = z
  .string()
  .max(2_000)
  .optional()
  .transform((v) => (v?.trim()?.length ? v.trim() : undefined));

const optionalHttpUrl = z
  .string()
  .max(500)
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  })
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid web address");

export const directoryMemberInsertSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  business_name: z.string().trim().min(2).max(160),
  contact_number: z
    .string()
    .trim()
    .max(30)
    .min(6, "Contact number is required")
    .refine((v) => isValidPhoneNumber(v), "Enter a valid phone number"),
  whatsapp_number: z
    .string()
    .max(30)
    .optional()
    .transform((v) => (v?.trim()?.length ? v.trim() : undefined))
    .refine(
      (v) => v === undefined || isValidPhoneNumber(v),
      "Enter a valid WhatsApp number",
    ),
  email: z.string().trim().email().max(254),
  city: z.string().trim().min(2).max(120),
  area_locality: optTrim,

  business_category: z.string().trim().min(2).max(80),
  sub_category: z.string().trim().min(2).max(160),
  business_types: z.array(z.enum(BUSINESS_TYPES)).min(1).max(7),
  keywords_tags: z.string().trim().min(4).max(500),
  products_services: z.string().trim().min(10).max(5_000),
  specialization: optTrim,
  years_experience: z
    .union([z.enum(YEARS_EXPERIENCE_OPTIONS), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  price_ranges: z.array(z.enum(PRICE_RANGE_OPTIONS)).max(3).optional(),

  business_address: optTrim,
  service_area: z.array(z.enum(SERVICE_AREA_OPTIONS)).max(5),
  google_maps_link: optionalHttpUrl,

  website: optionalHttpUrl,
  instagram: optTrim,
  facebook: optTrim,
  linkedin: optTrim,

  usp: optTrim,
  certifications: optTrim,
  awards: optTrim,

  looking_for: z.array(z.enum(LOOKING_FOR_OPTIONS)).max(4),
  preferred_categories_connect: z.array(z.string().trim().min(2).max(80)).max(50),

  target_customers: optTrim,
  referred_by: optTrim,

  consent_share: z.literal(true),

  profile_photo_path: z.string().max(100).optional(),
  portfolio_paths: z.array(z.string().max(100)).max(6).optional(),
  visiting_card_path: z.string().max(100).optional(),
});

export type DirectoryMemberInsertInput = z.infer<typeof directoryMemberInsertSchema>;

const correctionOptionalText = z.string().trim().max(2_000);
const correctionOptionalUrl = z
  .string()
  .trim()
  .max(500)
  .transform((value) => {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  })
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid web address");

export const directoryCorrectionSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  business_name: z.string().trim().min(2).max(160),
  contact_number: z
    .string()
    .trim()
    .max(30)
    .min(6, "Contact number is required")
    .refine((value) => isValidPhoneNumber(value), "Use a full number such as +919876543210"),
  whatsapp_number: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) => !value || isValidPhoneNumber(value),
      "Use a full WhatsApp number such as +919876543210",
    ),
  email: z.string().trim().email().max(254),
  city: z.string().trim().min(2).max(120),
  area_locality: correctionOptionalText,
  business_category: z.string().trim().min(2).max(80),
  sub_category: z.string().trim().min(2).max(160),
  products_services: z.string().trim().min(10).max(5_000),
  business_address: correctionOptionalText,
  service_area: z.array(z.enum(SERVICE_AREA_OPTIONS)).max(5),
  website: correctionOptionalUrl,
  instagram: correctionOptionalText,
  facebook: correctionOptionalText,
  linkedin: correctionOptionalText,
  owner_note: z.string().trim().max(1_000),
});

export type DirectoryCorrectionInput = z.infer<typeof directoryCorrectionSchema>;

export type DirectoryMemberRow = DirectoryMemberInsertInput & {
  id: string;
  created_at: string;
};
