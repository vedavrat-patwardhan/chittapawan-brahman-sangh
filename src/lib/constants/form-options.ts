/** Options aligned with intake form structure (community directory). */

export const BUSINESS_CATEGORIES = [
  "Manufacturing",
  "Trading (Wholesale / Distribution)",
  "Retail",
  "Service Provider",
  "Professional Services",
  "Construction & Real Estate",
  "Finance & Insurance",
  "IT & Digital Services",
  "Marketing & Advertising",
  "Education & Training",
  "Healthcare & Medical",
  "Hospitality & Food",
  "Transport & Logistics",
  "Import / Export",
  "Freelancer / Consultant",
  "Other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const BUSINESS_TYPES = [
  "B2B (Business to Business)",
  "B2C (Business to Customer)",
  "B2G (Business to Government)",
  "D2C (Direct to Customer)",
  "B2B2C",
  "Export / Import",
  "Other",
] as const;

export const SERVICE_AREA_OPTIONS = [
  "Local Area",
  "Entire City",
  "State",
  "Pan India",
  "International",
] as const;

export const LOOKING_FOR_OPTIONS = [
  "Clients",
  "Suppliers",
  "Partners",
  "Employees",
] as const;

export const PRICE_RANGE_OPTIONS = ["Budget", "Mid", "Premium"] as const;

export const YEARS_EXPERIENCE_OPTIONS = [
  "0–1",
  "1–3",
  "3–5",
  "5–10",
  "10+",
] as const;

export const SAMPLE_CITIES = [
  "Mumbai",
  "Pune",
  "Nashik",
  "Nagpur",
  "Aurangabad",
  "Bangalore",
  "Hyderabad",
  "Delhi",
  "Pune Pimpri-Chinchwad",
  "Other / Not listed",
] as const;

export const FORM_SECTION_IDS = [
  "basic",
  "business",
  "products",
  "location",
  "online",
  "highlights",
  "collab",
  "media",
  "consent",
] as const;
