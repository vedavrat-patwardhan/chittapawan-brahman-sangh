"use client";

import Link from "next/link";
import { useEffect } from "react";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="relative">
        <title>Something went wrong · Chittapawan Brahman Sangh</title>
        <main className="relative isolate flex min-h-screen items-center overflow-hidden px-5 py-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_20%,color-mix(in_oklch,var(--accent)_20%,transparent),transparent_32%)]"
          />
          <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-[var(--line)] bg-[var(--surface-card)] p-8 text-center shadow-[0_40px_100px_-68px_var(--ink)] sm:p-12">
            {/* A plain image keeps this last-resort page independent of the Next image pipeline. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/parshuram-mark-192.png"
              alt="Lord Parshuram emblem"
              width="112"
              height="112"
              className="mx-auto h-28 w-28 object-contain"
            />
            <p className="mt-7 text-[0.68rem] font-bold tracking-[0.16em] text-[var(--risk)] uppercase">
              Site interruption
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
              We could not load the site.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[var(--ink-soft)]">
              Please try once more. If the problem continues, return to the
              homepage and start again.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => retry()}
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-white hover:bg-[var(--accent-strong)] focus-visible:ring-focus"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] px-7 text-sm font-bold text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--ink)] focus-visible:ring-focus"
              >
                Return home
              </Link>
            </div>
            {error.digest ? (
              <p className="mt-7 text-xs text-[var(--muted)]">
                Support reference: <span className="font-mono">{error.digest}</span>
              </p>
            ) : null}
          </section>
        </main>
      </body>
    </html>
  );
}
