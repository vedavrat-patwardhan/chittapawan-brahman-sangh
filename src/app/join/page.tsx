import type { Metadata } from "next";

import { MemberIntakeForm } from "@/components/member-form";
import { getBusinessCategories } from "@/lib/categories";
import { requireMember } from "@/lib/auth/member-session";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Add member",
  description:
    "Submit a structured profile to the Chittapawan community directory.",
  alternates: { canonical: "/join" },
  openGraph: {
    type: "website",
    url: "/join",
    siteName: SITE_NAME,
    title: "Apply to the Chittapawan Business Directory",
    description:
      "Submit your business for verification and connect with the Chittapawan Brahman Sangh community.",
  },
};

export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Promise<{ welcome?: string }> };

export default async function JoinPage({ searchParams }: PageProps) {
  const [account, businessCategories, params] = await Promise.all([
    requireMember("/join"),
    getBusinessCategories(),
    searchParams ?? Promise.resolve({} as { welcome?: string }),
  ]);
  return (
    <div className="pb-12">
      {params.welcome === "1" && (
        <div className="mx-auto mt-8 max-w-3xl px-(--hero-pad-inline)">
          <div className="rounded-2xl border border-(--line) bg-(--surface-card) px-5 py-4 text-sm text-(--ink-soft)">
            <strong className="text-(--ink)">Your account is ready.</strong>{" "}
            Add your business below. It will remain private until an administrator approves it.
          </div>
        </div>
      )}
      <MemberIntakeForm
        businessCategories={businessCategories}
        accountName={account.name}
        accountEmail={account.email}
      />
    </div>
  );
}
