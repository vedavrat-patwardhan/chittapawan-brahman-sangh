import type { Metadata } from "next";

import { MemberIntakeForm } from "@/components/member-form";
import { getBusinessCategories } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Add member",
  description:
    "Submit a structured profile to the Chittapawan community directory.",
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
