import Link from "next/link";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_oklch,var(--surface-card)_85%,transparent)]"
      style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-[var(--hero-pad-inline)] py-4">
        <Link href="/" className="group min-w-0">
          <span className="block font-[family-name:var(--font-display)] text-[1.15rem] font-bold leading-tight tracking-tight text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--accent-strong)] sm:text-xl">
            Chitpavan Brahman Sangh
          </span>
          <span className="block text-[0.68rem] font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
            Nashik · est. 1933
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            className="rounded-full px-3 py-2 text-sm font-medium text-[var(--ink-soft)] transition-[color,transform] duration-200 ease-[var(--ease-out-expo)] hover:text-[var(--ink)] active:scale-[0.98] sm:px-4"
            href="/directory"
          >
            Directory
          </Link>
          <Link
            className="rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[color-mix(in_oklch,white_96%,var(--accent))] shadow-[0_8px_24px_-14px_var(--accent-strong)] transition-[transform,background-color] duration-200 ease-[var(--ease-out-expo)] hover:bg-[var(--accent-strong)] active:scale-[0.98] sm:px-4"
            href="/join"
          >
            Join directory
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface-inset)]">
      <div className="mx-auto max-w-6xl px-[var(--hero-pad-inline)] py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
              Chitpavan Brahman Sangh
            </p>
            <p className="text-sm text-[var(--muted)]">Nashik · Established 1933</p>
          </div>
          <div className="flex flex-col gap-1 text-sm text-[var(--ink-soft)]">
            <Link href="/directory" className="hover:text-[var(--accent-strong)] transition-colors">
              Browse directory
            </Link>
            <Link href="/join" className="hover:text-[var(--accent-strong)] transition-colors">
              Add your listing
            </Link>
            <a
              href="https://www.nasikchitpavan.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent-strong)] transition-colors"
            >
              Official website ↗
            </a>
          </div>
        </div>
        <p className="mt-8 text-xs text-[var(--muted)]">
          Member details shared only within the Sangh community. Contact the office before reproducing any data.
        </p>
      </div>
    </footer>
  );
}
