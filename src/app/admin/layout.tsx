import Link from "next/link";

import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-[var(--line)] bg-[var(--surface-inset)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-[var(--hero-pad-inline)] py-4">
          <nav aria-label="Admin" className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--surface-card)]"
            >
              Review queue
            </Link>
            <Link
              href="/directory"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
            >
              Public directory ↗
            </Link>
          </nav>
          <p className="text-xs text-[var(--muted)]">
            Signed in as <span className="font-semibold text-[var(--ink-soft)]">{session.name}</span>
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
