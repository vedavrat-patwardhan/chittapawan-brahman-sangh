export const SITE_NAME = "Chittapawan Brahman Sangh Business Directory";
export const SITE_SHORT_NAME = "Chittapawan Directory";
export const SITE_DESCRIPTION =
  "Discover trusted businesses, professionals, and services within the Chittapawan Brahman Sangh community in Nashik.";

export function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  try {
    return new URL(configured || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl()).toString();
}
