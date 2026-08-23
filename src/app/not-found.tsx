import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative isolate flex flex-1 items-center overflow-hidden px-[var(--hero-pad-inline)] py-16 sm:py-24">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_82%,color-mix(in_oklch,var(--accent)_15%,transparent),transparent_34%),linear-gradient(115deg,transparent_45%,color-mix(in_oklch,var(--accent)_6%,transparent)_45%,color-mix(in_oklch,var(--accent)_6%,transparent)_55%,transparent_55%)]"
      />
      <section className="motion-rise mx-auto grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[color-mix(in_oklch,var(--surface-card)_94%,transparent)] shadow-[0_40px_100px_-68px_var(--ink)] md:grid-cols-[18rem_1fr]">
        <div className="relative flex min-h-64 items-center justify-center overflow-hidden border-b border-[var(--line)] bg-[var(--surface-inset)] p-8 md:min-h-full md:border-r md:border-b-0">
          <span
            aria-hidden
            className="absolute -left-5 -top-7 font-[family-name:var(--font-display)] text-[8rem] font-bold leading-none text-[color-mix(in_oklch,var(--accent)_11%,transparent)]"
          >
            404
          </span>
          <Image
            src="/brand/parshuram-mark-512.png"
            alt="Lord Parshuram emblem"
            width={224}
            height={224}
            className="relative h-44 w-44 object-contain drop-shadow-[0_22px_22px_color-mix(in_oklch,var(--accent)_20%,transparent)]"
          />
        </div>
        <div className="p-7 sm:p-11">
          <p className="text-[0.68rem] font-bold tracking-[0.16em] text-[var(--accent-strong)] uppercase">
            Page not found · 404
          </p>
          <h1 className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-[clamp(2.4rem,7vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.04em] text-[var(--ink)]">
            This path leads elsewhere.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--ink-soft)]">
            The page may have moved, or the address may be incomplete. Return
            home or search the community directory for the business you need.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/directory"
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-bold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] focus-visible:ring-focus"
            >
              Search directory
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] px-7 text-sm font-bold text-[var(--ink-soft)] transition-[transform,border-color,color] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--ink)] focus-visible:ring-focus"
            >
              Return home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
