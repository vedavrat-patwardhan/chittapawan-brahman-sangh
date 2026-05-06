import type { Metadata } from "next";

import { MemberIntakeForm } from "@/components/member-form";

export const metadata: Metadata = {
  title: "Add member",
  description:
    "Submit a structured profile to the Chittapawan community directory.",
};

export default function JoinPage() {
  return (
    <div className="pb-12">
      <MemberIntakeForm />
    </div>
  );
}
