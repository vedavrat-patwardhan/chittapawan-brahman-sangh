"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { mutateBusinessCategories } from "@/lib/categories";

export type CategoryActionState =
  | { success: boolean; message: string }
  | undefined;

export async function updateBusinessCategories(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const session = await requireAdmin();
  const operation = formData.get("operation")?.toString();
  if (
    operation !== "add" &&
    operation !== "remove" &&
    operation !== "up" &&
    operation !== "down"
  ) {
    return { success: false, message: "Choose a valid category action." };
  }
  try {
    const result = await mutateBusinessCategories({
      operation,
      category: formData.get("category")?.toString(),
      newCategory: formData.get("new_category")?.toString(),
      reviewer: {
        admin_id: session.id,
        email: session.email,
        name: session.name,
      },
    });
    if (!result.success) return result;
    revalidatePath("/admin/settings/categories");
    revalidatePath("/join");
    revalidatePath("/directory");
    return result;
  } catch (error) {
    console.error("[updateBusinessCategories]", error);
    return { success: false, message: "Could not update categories right now." };
  }
}
