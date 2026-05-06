import type { Metadata } from "next";
import Link from "next/link";
import { Libre_Bodoni, Atkinson_Hyperlegible } from "next/font/google";

import { SiteFooter, SiteHeader } from "@/components/site-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Chittapawan Brahman Sangh · Business Directory",
    template: "%s · Chittapawan Brahman Sangh",
  },
  description:
    "The digital member directory of Chittapawan Brahman Sangh, Nashik — est. 1933. Browse and connect with 175+ community businesses.",
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
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${libreDisplay.variable} ${atkinsonBody.variable}`}
    >
      <body className="relative">
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

        {/* Mobile floating nav bar */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 z-20 sm:hidden"
        >
          <div className="flex justify-center px-[var(--hero-pad-inline)] pb-6">
            <div className="pointer-events-auto flex w-full max-w-xs items-center gap-2 rounded-full bg-[color-mix(in_oklch,var(--surface-card)_85%,transparent)] p-1.5 shadow-[0_4px_24px_-4px_color-mix(in_oklch,var(--accent)_35%,rgba(0,0,0,0.25))] backdrop-blur-xl backdrop-saturate-150">
              <Link
                className="flex-1 rounded-full py-2.5 text-center text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                href="/directory"
              >
                Directory
              </Link>
              <Link
                className="flex-1 rounded-full bg-[var(--accent)] py-2.5 text-center text-sm font-semibold text-[color-mix(in_oklch,white_96%,var(--accent))]"
                href="/join"
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
