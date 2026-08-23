import type { Metadata } from "next";

import { MemberIntakeForm } from "@/components/member-form";
import { getBusinessCategories } from "@/lib/categories";
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

export default async function JoinPage() {
  const businessCategories = await getBusinessCategories();
  return (
    <div className="pb-12">
      <MemberIntakeForm businessCategories={businessCategories} />
    </div>
  );
}
