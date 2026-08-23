"use server";

import { revalidatePath } from "next/cache";

import { reviewApplication, verifyListing } from "@/lib/directory-queries";
import { requireAdmin } from "@/lib/auth/session";

export type ReviewApplicationState =
  | { success: boolean; message: string }
  | undefined;

export async function reviewDirectoryApplication(
  id: string,
  _previousState: ReviewApplicationState,
  formData: FormData,
): Promise<ReviewApplicationState> {
  const session = await requireAdmin();
  const decision = formData.get("decision")?.toString();
  const adminNote = formData.get("admin_note")?.toString().trim();
  const rejectionReason = formData
    .get("rejection_reason")
    ?.toString()
    .trim();

  if (decision !== "approved" && decision !== "rejected") {
    return { success: false, message: "Choose approve or reject." };
  }
  if (adminNote && adminNote.length > 2_000) {
    return { success: false, message: "Keep the private note under 2,000 characters." };
  }
  if (decision === "rejected" && (!rejectionReason || rejectionReason.length < 3)) {
    return { success: false, message: "Add a short rejection reason for the admin record." };
  }
  if (rejectionReason && rejectionReason.length > 1_000) {
    return { success: false, message: "Keep the rejection reason under 1,000 characters." };
  }

  try {
    const updated = await reviewApplication({
      id,
      status: decision,
      adminNote,
      rejectionReason,
      reviewer: {
        admin_id: session.id,
        email: session.email,
        name: session.name,
      },
    });
    if (!updated) {
      return { success: false, message: "This application no longer exists." };
    }
  } catch (error) {
    console.error("[reviewDirectoryApplication]", error);
    return { success: false, message: "Could not update this application right now." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/directory");
  revalidatePath(`/directory/${id}`);
  return {
    success: true,
    message:
      decision === "approved"
        ? "Listing approved and published in the directory."
        : "Application rejected and removed from the public directory.",
  };
}

export async function verifyDirectoryListing(
  id: string,
  _previousState: ReviewApplicationState,
  _formData: FormData,
): Promise<ReviewApplicationState> {
  void _previousState;
  void _formData;
  const session = await requireAdmin();
  try {
    const updated = await verifyListing({
      id,
      reviewer: {
        admin_id: session.id,
        email: session.email,
        name: session.name,
      },
    });
    if (!updated) {
      return { success: false, message: "Only published listings can be verified." };
    }
  } catch (error) {
    console.error("[verifyDirectoryListing]", error);
    return { success: false, message: "Could not record verification right now." };
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/directory");
  revalidatePath(`/directory/${id}`);
  return {
    success: true,
    message: "Details verified for another year.",
  };
}
