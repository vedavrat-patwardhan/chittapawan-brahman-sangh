import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CorrectionForm } from "@/components/correction-form";
import { requireMember } from "@/lib/auth/member-session";
import { getOwnedCorrectionContext } from "@/lib/corrections";

export const metadata: Metadata = { title: "Edit business details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function EditOwnedBusinessPage({ params }: Props) {
  const { id } = await params;
  const account = await requireMember(`/account/businesses/${id}/edit`);
  const context = await getOwnedCorrectionContext(account.id, id);
  if (!context) notFound();
  return <main className="mx-auto w-full max-w-4xl flex-1 px-(--hero-pad-inline) py-12 sm:py-16"><Link href="/account" className="text-sm font-semibold text-(--accent-strong)">← Back to your businesses</Link><div className="mt-7"><p className="text-xs font-semibold tracking-[0.15em] text-(--accent-strong) uppercase">Request an update</p><h1 className="mt-2 font-display text-4xl font-bold text-(--ink)">Edit {String(context.listing.business_name)}</h1><p className="mt-3 max-w-2xl leading-7 text-(--ink-soft)">Your current public listing remains live while administrators review these edits.</p></div><div className="mt-10 rounded-(--radius-card) border border-(--line) bg-(--surface-card) p-6 sm:p-8"><CorrectionForm memberId={id} context={context} /></div></main>;
}

