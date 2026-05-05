import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

import {
  BUSINESS_CATEGORIES,
  BUSINESS_TYPES,
  LOOKING_FOR_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  YEARS_EXPERIENCE_OPTIONS,
} from "@/lib/constants/form-options";

const optTrim = z
  .string()
  .optional()
  .transform((v) => (v?.trim()?.length ? v.trim() : undefined));

export const directoryMemberInsertSchema = z.object({
  full_name: z.string().trim().min(2),
  business_name: z.string().trim().min(2),
  contact_number: z
    .string()
    .trim()
    .min(6, "Contact number is required")
    .refine((v) => isValidPhoneNumber(v), "Enter a valid phone number"),
  whatsapp_number: z
    .string()
    .optional()
    .transform((v) => (v?.trim()?.length ? v.trim() : undefined))
    .refine(
      (v) => v === undefined || isValidPhoneNumber(v),
      "Enter a valid WhatsApp number",
    ),
  email: z.string().trim().email(),
  city: z.string().trim().min(2),
  area_locality: optTrim,

  business_category: z.enum(BUSINESS_CATEGORIES),
  sub_category: z.string().trim().min(2),
  business_types: z.array(z.enum(BUSINESS_TYPES)).min(1),
  keywords_tags: z.string().trim().min(4),
  products_services: z.string().trim().min(10),
  specialization: optTrim,
  years_experience: z
    .union([z.enum(YEARS_EXPERIENCE_OPTIONS), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  price_ranges: z.array(z.enum(PRICE_RANGE_OPTIONS)).optional(),

  business_address: optTrim,
  service_area: z.array(z.enum(SERVICE_AREA_OPTIONS)),
  google_maps_link: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),

  website: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length ? v.trim() : undefined)),
  instagram: optTrim,
  facebook: optTrim,
  linkedin: optTrim,

  usp: optTrim,
  certifications: optTrim,
  awards: optTrim,

  looking_for: z.array(z.enum(LOOKING_FOR_OPTIONS)),
  preferred_categories_connect: z.array(z.enum(BUSINESS_CATEGORIES)),

  target_customers: optTrim,
  referred_by: optTrim,

  consent_share: z.literal(true),

  profile_photo_path: z.string().optional(),
  portfolio_paths: z.array(z.string()).optional(),
  visiting_card_path: z.string().optional(),
});

export type DirectoryMemberInsertInput = z.infer<typeof directoryMemberInsertSchema>;

export type DirectoryMemberRow = DirectoryMemberInsertInput & {
  id: string;
  created_at: string;
};
