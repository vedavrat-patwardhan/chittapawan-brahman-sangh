export const LISTING_STATUSES = ["pending", "approved", "rejected"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export type MemberListItem = {
  id: string;
  created_at: string;
  full_name: string;
  business_name: string;
  business_category: string;
  sub_category: string;
  city: string;
  keywords_tags: string;
  business_types: string[];
  email: string;
  contact_number: string;
  products_services: string;
  verification_due_at: string | null;
  is_verified_current: boolean;
};

export type AdminApplicationListItem = MemberListItem & {
  status: ListingStatus;
  updated_at: string;
  reviewed_at: string | null;
  duplicate_risk: boolean;
  duplicate_match_fields: DuplicateMatchField[];
};

export const DUPLICATE_MATCH_FIELDS = ["email", "phone", "business_name"] as const;
export type DuplicateMatchField = (typeof DUPLICATE_MATCH_FIELDS)[number];

export type DuplicateCandidate = {
  id: string;
  full_name: string;
  business_name: string;
  status: ListingStatus;
  matched_on: DuplicateMatchField[];
};

export const CHANGE_REQUEST_STATUSES = [
  "pending",
  "processing",
  "approved",
  "rejected",
] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];
export type DirectoryChangeValue = string | string[] | null;

export type MemberReviewer = {
  admin_id: string;
  email: string;
  name: string;
};

/** Stored in MongoDB `directory_members`. `_id` is added by the driver. */
export type DirectoryMemberDocument = {
  created_at: Date;
  updated_at?: Date;
  status?: ListingStatus;
  reviewed_at?: Date | null;
  reviewed_by?: MemberReviewer | null;
  admin_note?: string | null;
  rejection_reason?: string | null;
  last_verified_at?: Date | null;
  verification_due_at?: Date | null;
  last_verified_by?: MemberReviewer | null;
  schema_version?: number;
  email_normalized?: string;
  contact_number_normalized?: string;
  business_name_normalized?: string;
  duplicate_risk?: boolean;
  duplicate_match_fields?: DuplicateMatchField[];
  full_name: string;
  business_name: string;
  profile_photo_path: string | null;
  contact_number: string;
  whatsapp_number: string | null;
  email: string;
  city: string;
  area_locality: string | null;
  business_category: string;
  sub_category: string;
  business_types: string[];
  keywords_tags: string;
  products_services: string;
  specialization: string | null;
  years_experience: string | null;
  price_ranges: string[];
  business_address: string | null;
  service_area: string[];
  google_maps_link: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  usp: string | null;
  certifications: string | null;
  awards: string | null;
  looking_for: string[];
  preferred_categories_connect: string[];
  portfolio_paths: string[];
  visiting_card_path: string | null;
  target_customers: string | null;
  referred_by: string | null;
  consent_share: true;
};

export function mapMemberRow(row: Record<string, unknown>): MemberListItem {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    full_name: String(row.full_name),
    business_name: String(row.business_name),
    business_category: String(row.business_category),
    sub_category: String(row.sub_category),
    city: String(row.city),
    keywords_tags: String(row.keywords_tags),
    business_types: (row.business_types as string[]) ?? [],
    email: String(row.email),
    contact_number: String(row.contact_number),
    products_services: String(row.products_services),
    verification_due_at:
      typeof row.verification_due_at === "string"
        ? row.verification_due_at
        : null,
    is_verified_current: row.is_verified_current === true,
  };
}

export function effectiveListingStatus(value: unknown): ListingStatus {
  return value === "pending" || value === "rejected" ? value : "approved";
}
