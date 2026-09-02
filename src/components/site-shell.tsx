import Image from "next/image";
import Link from "next/link";

import { logout } from "@/app/actions/auth";
import { memberLogout } from "@/app/actions/account-auth";
import { getSession } from "@/lib/auth/session";
import { getMemberSession } from "@/lib/auth/member-session";

export async function SiteHeader() {
  const [session, member] = await Promise.all([getSession(), getMemberSession()]);

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_oklch,var(--surface-card)_85%,transparent)]"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-[var(--hero-pad-inline)] py-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <Image
            src="/brand/parshuram-mark-192.png"
            alt=""
            width={48}
            height={48}
            priority
            className="h-11 w-11 shrink-0 object-contain transition-transform duration-300 group-hover:rotate-2 group-hover:scale-[1.03] sm:h-12 sm:w-12"
          />
          <span className="min-w-0">
            <span className="block truncate font-[family-name:var(--font-display)] text-[1.02rem] font-bold leading-tight tracking-tight text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--accent-strong)] sm:text-xl">
              Chittapawan Brahman Sangh
            </span>
            <span className="block text-[0.64rem] font-medium tracking-[0.12em] text-[var(--muted)] uppercase sm:text-[0.68rem]">
              Nashik · est. 1933
            </span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--ink-soft)] transition-[color,transform] duration-200 ease-[var(--ease-out-expo)] hover:text-[var(--ink)] active:scale-[0.98] sm:inline-flex sm:px-4"
            href="/directory"
          >
            Directory
          </Link>
          <Link
            className="rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[color-mix(in_oklch,white_96%,var(--accent))] shadow-[0_8px_24px_-14px_var(--accent-strong)] transition-[transform,background-color] duration-200 ease-[var(--ease-out-expo)] hover:bg-[var(--accent-strong)] active:scale-[0.98] sm:px-4"
            href={member ? "/join" : "/signup?next=/join"}
          >
            {member ? "Add business" : "Join"}
          </Link>
          {member ? (
            <>
              <Link className="hidden rounded-full border border-[var(--line-strong)] px-3 py-2 text-sm font-semibold text-[var(--ink-soft)] md:inline-flex" href="/account">My account</Link>
              <form action={memberLogout} className="hidden lg:block"><button type="submit" className="rounded-full px-3 py-2 text-sm text-(--muted)">Sign out</button></form>
            </>
          ) : (
            <Link className="hidden rounded-full px-3 py-2 text-sm font-medium text-(--ink-soft) md:inline-flex" href="/account/login">Member sign in</Link>
          )}
          {session ? (
            <>
              <Link
                className="hidden rounded-full border border-[var(--line-strong)] px-3 py-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)] md:inline-flex"
                href="/admin"
              >
                Admin
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--line-strong)] px-3 py-2 text-sm font-medium text-[var(--ink-soft)] transition-[border-color,color] duration-200 hover:border-[var(--accent)] hover:text-[var(--ink)] sm:px-4"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)] md:inline-flex"
              href="/login"
            >
              Admin sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export async function MobileNav() {
  const [session, member] = await Promise.all([getSession(), getMemberSession()]);

  return (
    <div
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
          {session ? (
            <Link
              className="flex-1 rounded-full py-2.5 text-center text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
              href="/admin"
            >
              Admin
            </Link>
          ) : null}
          {member ? (
            <Link className="flex-1 rounded-full py-2.5 text-center text-sm font-medium text-[var(--ink-soft)]" href="/account">Account</Link>
          ) : null}
          <Link
            className="flex-1 rounded-full bg-[var(--accent)] py-2.5 text-center text-sm font-semibold text-[color-mix(in_oklch,white_96%,var(--accent))]"
            href={member ? "/join" : "/signup?next=/join"}
          >
            {member ? "Add" : "Join"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface-inset)]">
      <div className="mx-auto max-w-6xl px-[var(--hero-pad-inline)] py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/parshuram-mark-192.png" alt="" width={52} height={52} className="h-13 w-13 object-contain" />
            <div className="space-y-1">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
                Chittapawan Brahman Sangh
              </p>
              <p className="text-sm text-[var(--muted)]">
                Nashik · Established 1933
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-sm text-[var(--ink-soft)]">
            <Link href="/account/login" className="hover:text-[var(--accent-strong)] transition-colors">Member sign in</Link>
            <Link
              href="/login"
              className="hover:text-[var(--accent-strong)] transition-colors"
            >
              Admin sign in
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
          Approved details are shared for community networking. Contact the
          office before reproducing or republishing directory data.
        </p>
      </div>
    </footer>
  );
}
