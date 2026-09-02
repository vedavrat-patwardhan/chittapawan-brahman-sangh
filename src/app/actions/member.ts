"use server";

import { redirect } from "next/navigation";

import { insertMember } from "@/lib/directory-queries";
import { requireMember } from "@/lib/auth/member-session";
import { canonicalCategory, getBusinessCategories } from "@/lib/categories";
import { BYPASS_FORM_VALIDATION } from "@/lib/feature-flags";
import { consumeRateLimit, requestFingerprint } from "@/lib/rate-limit";
import { deleteMemberUploads, uploadMemberFile } from "@/lib/uploads";
import {
  directoryMemberInsertSchema,
  type DirectoryMemberInsertInput,
} from "@/lib/validation/member.schema";

export type SubmitMemberState =
  | { message: string }
  | undefined;

function getAll(fd: FormData, key: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of fd.getAll(key)) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export async function submitDirectoryMember(
  _prev: SubmitMemberState,
  fd: FormData,
): Promise<SubmitMemberState> {
  const account = await requireMember("/join");
  if (fd.get("company_website_confirmation")?.toString().trim()) {
    redirect("/join/success?reference=received");
  }

  if (!BYPASS_FORM_VALIDATION && fd.get("consent_share") !== "on") {
    return {
      message:
        "Please confirm consent to share your listing with verified group members.",
    };
  }

  const raw = {
    full_name: fd.get("full_name")?.toString() ?? "",
    business_name: fd.get("business_name")?.toString() ?? "",
    contact_number: fd.get("contact_number")?.toString() ?? "",
    whatsapp_number: fd.get("whatsapp_number")?.toString(),
    email: fd.get("email")?.toString() ?? "",
    city: fd.get("city")?.toString() ?? "",
    area_locality: fd.get("area_locality")?.toString(),

    business_categories: getAll(fd, "business_categories"),
    sub_category: fd.get("sub_category")?.toString() ?? "",
    business_types: getAll(fd, "business_types"),
    keywords_tags: fd.get("keywords_tags")?.toString() ?? "",
    products_services: fd.get("products_services")?.toString() ?? "",
    specialization: fd.get("specialization")?.toString(),
    years_experience: fd.get("years_experience")?.toString(),
    price_ranges: getAll(fd, "price_ranges"),

    business_address: fd.get("business_address")?.toString(),
    service_area: getAll(fd, "service_area"),
    google_maps_link: fd.get("google_maps_link")?.toString(),

    website: fd.get("website")?.toString(),
    instagram: fd.get("instagram")?.toString(),
    facebook: fd.get("facebook")?.toString(),
    linkedin: fd.get("linkedin")?.toString(),

    usp: fd.get("usp")?.toString(),
    certifications: fd.get("certifications")?.toString(),
    awards: fd.get("awards")?.toString(),

    looking_for: getAll(fd, "looking_for"),
    preferred_categories_connect: getAll(fd, "preferred_categories_connect"),

    target_customers: fd.get("target_customers")?.toString(),
    referred_by: fd.get("referred_by")?.toString(),

    consent_share: true as const,
  };

  if (BYPASS_FORM_VALIDATION) {
    redirect("/directory?demo_submitted=1");
  }

  const parsed = directoryMemberInsertSchema.safeParse({
    ...raw,
    price_ranges: raw.price_ranges.length > 0 ? raw.price_ranges : undefined,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(" · ");
    return { message: msg || "Something in the form needs attention." };
  }

  const allowedCategories = await getBusinessCategories();
  const businessCategories = parsed.data.business_categories.map((category) =>
    canonicalCategory(category, allowedCategories),
  );
  const preferredCategories = parsed.data.preferred_categories_connect.map(
    (category) => canonicalCategory(category, allowedCategories),
  );
  if (
    businessCategories.some((category) => !category) ||
    preferredCategories.some((category) => !category)
  ) {
    return {
      message: "Choose business categories from the current directory options.",
    };
  }
  const payload: DirectoryMemberInsertInput = {
    ...parsed.data,
    business_categories: Array.from(
      new Set(
        businessCategories.filter(
          (category): category is string => Boolean(category),
        ),
      ),
    ),
    preferred_categories_connect: preferredCategories.filter(
      (category): category is string => Boolean(category),
    ),
  };

  const profilePhoto = fd.get("profile_photo");
  const portfolioFiles = fd
    .getAll("portfolio")
    .filter((file): file is File => file instanceof File && file.size > 0);
  const visitingCard = fd.get("visiting_card");
  const files = [
    ...(profilePhoto instanceof File && profilePhoto.size > 0
      ? [profilePhoto]
      : []),
    ...portfolioFiles,
    ...(visitingCard instanceof File && visitingCard.size > 0
      ? [visitingCard]
      : []),
  ];
  if (portfolioFiles.length > 4) {
    return { message: "Upload no more than 4 portfolio images." };
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) {
    return { message: "Keep the combined upload size under 10 MB." };
  }

  try {
    const fingerprint = await requestFingerprint("member-submission");
    const rateLimit = await consumeRateLimit({
      key: `member-submission:${account.id}:${fingerprint}`,
      limit: 4,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return {
        message: `Submission limit reached. Please try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`,
      };
    }
  } catch (error) {
    console.error("[submitDirectoryMember] Rate limit unavailable", error);
  }

  const createdUploadIds: string[] = [];
  let profile_photo_path: string | undefined;
  const portfolio_paths: string[] = [];
  let visiting_card_path: string | undefined;

  const saveUpload = async (
    file: File,
    folder: "profiles" | "portfolio" | "cards",
  ): Promise<{ path?: string; error?: string }> => {
    const result = await uploadMemberFile(file, folder);
    if (result.path) createdUploadIds.push(result.path);
    return result.error ? { error: result.error } : { path: result.path };
  };

  if (profilePhoto instanceof File && profilePhoto.size > 0) {
    const upload = await saveUpload(profilePhoto, "profiles");
    if (upload.error) return { message: upload.error };
    profile_photo_path = upload.path;
  }
  for (const file of portfolioFiles) {
    const upload = await saveUpload(file, "portfolio");
    if (upload.error) {
      await deleteMemberUploads(createdUploadIds).catch(() => undefined);
      return { message: upload.error };
    }
    if (upload.path) portfolio_paths.push(upload.path);
  }
  if (visitingCard instanceof File && visitingCard.size > 0) {
    const upload = await saveUpload(visitingCard, "cards");
    if (upload.error) {
      await deleteMemberUploads(createdUploadIds).catch(() => undefined);
      return { message: upload.error };
    }
    visiting_card_path = upload.path;
  }

  let id: string;
  try {
    id = await insertMember({
      ...payload,
      profile_photo_path,
      portfolio_paths: portfolio_paths.length ? portfolio_paths : undefined,
      visiting_card_path,
    }, account.id);
  } catch (e: unknown) {
    await deleteMemberUploads(createdUploadIds).catch(() => undefined);
    console.error("[submitDirectoryMember]", e);
    return {
      message: "Could not save your application right now. Please try again shortly.",
    };
  }

  redirect(`/account?submitted=1&reference=${id}`);
}
