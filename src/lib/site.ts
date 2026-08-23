export const SITE_NAME = "Chittapawan Brahman Sangh Business Directory";
export const SITE_SHORT_NAME = "Chittapawan Directory";
export const SITE_DESCRIPTION =
  "Discover trusted businesses, professionals, and services within the Chittapawan Brahman Sangh community in Nashik.";

const PRODUCTION_SITE_URL =
  "https://chittapawan-brahman-sangh.vercel.app";

function asUrl(value: string | undefined): URL | null {
  const candidate = value?.trim();
  if (!candidate) return null;
  try {
    return new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`,
    );
  } catch {
    return null;
  }
}

function isLocalUrl(url: URL): boolean {
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

export function siteUrl(): URL {
  const configured = asUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured && (process.env.NODE_ENV !== "production" || !isLocalUrl(configured))) {
    return configured;
  }

  const vercelProductionUrl = asUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
  );
  if (vercelProductionUrl) return vercelProductionUrl;

  return new URL(
    process.env.NODE_ENV === "production"
      ? PRODUCTION_SITE_URL
      : "http://localhost:3000",
  );
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl()).toString();
}
