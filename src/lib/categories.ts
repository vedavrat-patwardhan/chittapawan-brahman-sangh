import { BUSINESS_CATEGORIES } from "@/lib/constants/form-options";
import { membersCollection, settingsCollection } from "@/lib/mongodb";
import type { MemberReviewer } from "@/types/member";

const defaults = [...BUSINESS_CATEGORIES];

function cleanCategories(values: unknown): string[] {
  if (!Array.isArray(values)) return defaults;
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const category = value.trim();
    const key = category.toLocaleLowerCase("en");
    if (category.length < 2 || category.length > 80 || seen.has(key)) continue;
    seen.add(key);
    categories.push(category);
  }
  return categories.length ? categories : defaults;
}

export async function getBusinessCategories(): Promise<string[]> {
  try {
    const settings = await settingsCollection();
    const document = await settings.findOne({ key: "business_categories" });
    return cleanCategories(document?.values);
  } catch {
    return defaults;
  }
}

export function categoryIsAllowed(
  category: string,
  allowed: readonly string[],
): boolean {
  return Boolean(canonicalCategory(category, allowed));
}

export function canonicalCategory(
  category: string,
  allowed: readonly string[],
): string | undefined {
  return allowed.find(
    (candidate) =>
      candidate.toLocaleLowerCase("en") ===
      category.trim().toLocaleLowerCase("en"),
  );
}

export type CategoryUsage = Record<string, number>;

export async function getCategoryUsage(): Promise<CategoryUsage> {
  const members = await membersCollection();
  const groups = await members
    .aggregate<{ _id: string; count: number }>([
      {
        $project: {
          categories: {
            $setUnion: [
              {
                $cond: [
                  { $isArray: "$business_categories" },
                  "$business_categories",
                  [],
                ],
              },
              ["$business_category"],
              { $ifNull: ["$preferred_categories_connect", []] },
            ],
          },
        },
      },
      { $unwind: "$categories" },
      { $match: { categories: { $type: "string", $ne: "" } } },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
    ])
    .toArray();
  return Object.fromEntries(groups.map((group) => [group._id, group.count]));
}

export type CategoryMutationResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function mutateBusinessCategories(input: {
  operation: "add" | "remove" | "up" | "down";
  category?: string;
  newCategory?: string;
  reviewer: MemberReviewer;
}): Promise<CategoryMutationResult> {
  const settings = await settingsCollection();
  const document = await settings.findOne({ key: "business_categories" });
  const current = cleanCategories(document?.values);
  const next = [...current];

  if (input.operation === "add") {
    const candidate = input.newCategory?.trim() ?? "";
    if (candidate.length < 2 || candidate.length > 80) {
      return { success: false, message: "Use a category name between 2 and 80 characters." };
    }
    if (current.length >= 50) {
      return { success: false, message: "The directory supports up to 50 categories." };
    }
    if (categoryIsAllowed(candidate, current)) {
      return { success: false, message: "That category already exists." };
    }
    next.push(candidate);
  } else {
    const index = current.findIndex((category) => category === input.category);
    if (index < 0) return { success: false, message: "That category no longer exists." };
    if (input.operation === "remove") {
      if (current.length === 1) {
        return { success: false, message: "Keep at least one business category." };
      }
      const members = await membersCollection();
      const used = await members.countDocuments({
        $or: [
          { business_category: current[index] },
          { business_categories: current[index] },
          { preferred_categories_connect: current[index] },
        ],
      });
      if (used) {
        return {
          success: false,
          message: `Cannot remove this category while ${used} listing${used === 1 ? " uses" : "s use"} it.`,
        };
      }
      next.splice(index, 1);
    } else {
      const target = input.operation === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= current.length) {
        return { success: false, message: "That category is already at the edge." };
      }
      [next[index], next[target]] = [next[target]!, next[index]!];
    }
  }

  const now = new Date();
  await settings.updateOne(
    { key: "business_categories" },
    {
      $set: { values: next, updated_at: now, updated_by: input.reviewer },
      $setOnInsert: { created_at: now },
    },
    { upsert: true },
  );
  return {
    success: true,
    message:
      input.operation === "add"
        ? "Category added."
        : input.operation === "remove"
          ? "Unused category removed."
          : "Category order updated.",
  };
}
