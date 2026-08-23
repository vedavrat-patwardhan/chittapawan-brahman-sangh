import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Administrator access for the Chittapawan Brahman Sangh directory.",
};

type PageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function LoginPage(props: PageProps) {
  const params = (await props.searchParams) ?? {};
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-(--hero-pad-inline) py-14">
      <div className="mb-8 text-center">
        <p className="mb-2 text-[0.68rem] font-semibold tracking-[0.16em] text-(--accent-strong) uppercase">
          Directory administration
        </p>
        <h1 className="font-display text-[clamp(2rem,5vw,2.5rem)] font-bold leading-tight tracking-tight text-(--ink)">
          Admin sign in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-(--ink-soft)">
          Review, verify, and publish business applications.
        </p>
      </div>

      <div className="rounded-(--radius-card) border border-(--line) bg-(--surface-card) p-6 shadow-[0_24px_64px_-48px_color-mix(in_oklch,var(--accent)_24%,rgba(0,0,0,0.16))] sm:p-8">
        <LoginForm nextPath={nextPath} />
      </div>

      <p className="mt-6 text-center text-sm text-(--muted)">
        <Link href="/" className="font-medium text-(--accent-strong) transition-colors hover:text-(--accent)">
          ← Back to landing page
        </Link>
      </p>
    </div>
  );
}
