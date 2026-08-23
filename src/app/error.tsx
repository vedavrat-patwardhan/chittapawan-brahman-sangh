"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  return (
    <div className="relative isolate flex flex-1 items-center overflow-hidden px-[var(--hero-pad-inline)] py-16 sm:py-24">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_18%,color-mix(in_oklch,var(--accent)_18%,transparent),transparent_30%),linear-gradient(135deg,transparent_42%,color-mix(in_oklch,var(--accent)_7%,transparent)_42%,color-mix(in_oklch,var(--accent)_7%,transparent)_58%,transparent_58%)]"
      />
      <section className="motion-rise mx-auto grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[color-mix(in_oklch,var(--surface-card)_94%,transparent)] shadow-[0_40px_100px_-68px_var(--ink)] md:grid-cols-[1fr_18rem]">
        <div className="p-7 sm:p-11">
          <p className="text-[0.68rem] font-bold tracking-[0.16em] text-[var(--risk)] uppercase">
            Temporary interruption
          </p>
          <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.4rem,7vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.04em] text-[var(--ink)]">
            We lost the thread.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--ink-soft)]">
            The requested page could not finish loading. Your browser is still
            connected—try the page again, or return to the directory and
            continue from there.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] focus-visible:ring-focus"
            >
              Try again
            </button>
            <Link
              href="/directory"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] px-7 text-sm font-bold text-[var(--ink-soft)] transition-[transform,border-color,color] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--ink)] focus-visible:ring-focus"
            >
              Open directory
            </Link>
          </div>
          {error.digest ? (
            <p className="mt-7 text-xs text-[var(--muted)]">
              Support reference: <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
        </div>
        <div className="relative flex min-h-56 items-center justify-center overflow-hidden border-t border-[var(--line)] bg-[var(--surface-inset)] p-8 md:min-h-full md:border-t-0 md:border-l">
          <span
            aria-hidden
            className="absolute -right-4 -top-14 font-[family-name:var(--font-display)] text-[13rem] font-bold leading-none text-[color-mix(in_oklch,var(--accent)_9%,transparent)]"
          >
            !
          </span>
          <Image
            src="/brand/parshuram-mark-512.png"
            alt="Lord Parshuram emblem"
            width={224}
            height={224}
            className="relative h-44 w-44 object-contain drop-shadow-[0_22px_22px_color-mix(in_oklch,var(--accent)_20%,transparent)]"
          />
        </div>
      </section>
    </div>
  );
}
