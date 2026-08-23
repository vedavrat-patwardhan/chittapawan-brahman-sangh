"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/session";
import { canonicalCategory, getBusinessCategories } from "@/lib/categories";
import {
  createChangeRequest,
  getCorrectionContext,
  issueCorrectionToken,
  reviewChangeRequest,
} from "@/lib/corrections";
import { directoryCorrectionSchema } from "@/lib/validation/member.schema";

export type CorrectionActionState =
  | { success: boolean; message: string; path?: string; expiresAt?: string }
  | undefined;

function values(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function createOwnerCorrectionLink(
  memberId: string,
  _previousState: CorrectionActionState,
  _formData: FormData,
): Promise<CorrectionActionState> {
  void _previousState;
  void _formData;
  const session = await requireAdmin();
  try {
    const result = await issueCorrectionToken(memberId, {
      admin_id: session.id,
      email: session.email,
      name: session.name,
    });
    if (!result) {
      return {
        success: false,
        message: "Correction links can only be created for published listings.",
      };
    }
    return {
      success: true,
      message: "A new one-time link is ready. Any previous unused link was revoked.",
      ...result,
    };
  } catch (error) {
    console.error("[createOwnerCorrectionLink]", error);
    return { success: false, message: "Could not create a correction link right now." };
  }
}

export type SubmitCorrectionState =
  | { success: false; message: string }
  | undefined;

export async function submitOwnerCorrection(
  token: string,
  _previousState: SubmitCorrectionState,
  formData: FormData,
): Promise<SubmitCorrectionState> {
  const parsed = directoryCorrectionSchema.safeParse({
    full_name: formData.get("full_name")?.toString() ?? "",
    business_name: formData.get("business_name")?.toString() ?? "",
    contact_number: formData.get("contact_number")?.toString() ?? "",
    whatsapp_number: formData.get("whatsapp_number")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    area_locality: formData.get("area_locality")?.toString() ?? "",
    business_category: formData.get("business_category")?.toString() ?? "",
    sub_category: formData.get("sub_category")?.toString() ?? "",
    products_services: formData.get("products_services")?.toString() ?? "",
    business_address: formData.get("business_address")?.toString() ?? "",
    service_area: values(formData, "service_area"),
    website: formData.get("website")?.toString() ?? "",
    instagram: formData.get("instagram")?.toString() ?? "",
    facebook: formData.get("facebook")?.toString() ?? "",
    linkedin: formData.get("linkedin")?.toString() ?? "",
    owner_note: formData.get("owner_note")?.toString() ?? "",
  });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(" · "),
    };
  }
  const [allowedCategories, correctionContext] = await Promise.all([
    getBusinessCategories(),
    getCorrectionContext(token),
  ]);
  const currentCategory = correctionContext?.listing.business_category;
  const businessCategory =
    canonicalCategory(parsed.data.business_category, allowedCategories) ??
    (parsed.data.business_category === currentCategory
      ? parsed.data.business_category
      : undefined);
  if (!businessCategory) {
    return {
      success: false,
      message: "Choose a business category from the current directory options.",
    };
  }

  let requestId: string | null;
  try {
    requestId = await createChangeRequest(token, {
      ...parsed.data,
      business_category: businessCategory,
    });
  } catch (error) {
    console.error("[submitOwnerCorrection]", error);
    return { success: false, message: "Could not submit these changes right now." };
  }
  if (!requestId) {
    return {
      success: false,
      message: "This correction link is invalid, expired, or has already been used.",
    };
  }
  if (requestId === "unchanged") {
    return {
      success: false,
      message: "No changes were found. Update a field or add a note for the administrators.",
    };
  }
  redirect(`/update/success?reference=${requestId}`);
}

export async function decideOwnerCorrection(
  requestId: string,
  _previousState: CorrectionActionState,
  formData: FormData,
): Promise<CorrectionActionState> {
  const session = await requireAdmin();
  const decision = formData.get("decision")?.toString();
  const adminNote = formData.get("admin_note")?.toString().trim();
  if (decision !== "approved" && decision !== "rejected") {
    return { success: false, message: "Choose approve or reject." };
  }
  if (adminNote && adminNote.length > 2_000) {
    return { success: false, message: "Keep the admin note under 2,000 characters." };
  }
  try {
    const updated = await reviewChangeRequest({
      id: requestId,
      decision,
      adminNote,
      reviewer: {
        admin_id: session.id,
        email: session.email,
        name: session.name,
      },
    });
    if (!updated) {
      return {
        success: false,
        message: "This request was already reviewed or its listing is unavailable.",
      };
    }
  } catch (error) {
    console.error("[decideOwnerCorrection]", error);
    return { success: false, message: "Could not review this change request right now." };
  }

  revalidatePath("/admin/changes");
  revalidatePath(`/admin/changes/${requestId}`);
  revalidatePath("/admin");
  revalidatePath("/directory");
  return {
    success: true,
    message:
      decision === "approved"
        ? "Changes approved and published."
        : "Change request rejected; the published listing was not modified.",
  };
}
