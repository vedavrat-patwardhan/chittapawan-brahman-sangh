import type { Metadata, Viewport } from "next";
import { Libre_Bodoni, Atkinson_Hyperlegible } from "next/font/google";

import { MobileNav, SiteFooter, SiteHeader } from "@/components/site-shell";
import {
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  siteUrl,
} from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Chittapawan Brahman Sangh · Business Directory",
    template: "%s · Chittapawan Brahman Sangh",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Chittapawan Brahman Sangh",
    "Chitpavan business directory",
    "Nashik business community",
    "Konkanastha Brahmin businesses",
    "community business directory",
  ],
  authors: [{ name: "Chittapawan Brahman Sangh, Nashik" }],
  creator: "Chittapawan Brahman Sangh, Nashik",
  publisher: "Chittapawan Brahman Sangh, Nashik",
  category: "Business directory",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: "Chittapawan Brahman Sangh · Business Directory",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Chittapawan Brahman Sangh · Business Directory",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#EC7416",
  colorScheme: "light",
};

const libreDisplay = Libre_Bodoni({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700"],
});

const atkinsonBody = Atkinson_Hyperlegible({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const rootUrl = absoluteUrl("/");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${rootUrl}#organization`,
        name: "Chittapawan Brahman Sangh, Nashik",
        foundingDate: "1933",
        url: rootUrl,
        logo: absoluteUrl("/brand/parshuram-mark-512.png"),
        sameAs: ["https://www.nasikchitpavan.org"],
      },
      {
        "@type": "WebSite",
        "@id": `${rootUrl}#website`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: rootUrl,
        publisher: { "@id": `${rootUrl}#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/directory")}?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${libreDisplay.variable} ${atkinsonBody.variable}`}
    >
      <body className="relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <a
          className="sr-only focus-visible:pointer-events-auto focus-visible:absolute focus-visible:left-5 focus-visible:top-5 focus-visible:z-[60] focus-visible:inline-flex focus-visible:rounded-full focus-visible:bg-[var(--accent)] focus-visible:px-5 focus-visible:py-3 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-[color-mix(in_oklch,white_96%,var(--accent))] focus-visible:ring-focus"
          href="#main"
        >
          Skip to content
        </a>
        <div className="flex min-h-screen flex-col pb-24 sm:pb-0">
          <SiteHeader />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <SiteFooter />
        </div>

        <MobileNav />
      </body>
    </html>
  );
}
