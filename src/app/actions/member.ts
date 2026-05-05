"use server";

import { redirect } from "next/navigation";

import { uploadMemberFile } from "@/lib/public-url";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
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
  if (fd.get("consent_share") !== "on") {
    return {
      message:
        "Please confirm consent to share your listing with verified group members.",
    };
  }

  let profile_photo_path: string | undefined;
  const profilePhoto = fd.get("profile_photo");
  if (profilePhoto instanceof File && profilePhoto.size > 0) {
    const up = await uploadMemberFile(profilePhoto, "profiles");
    if (up.error) return { message: up.error };
    profile_photo_path = up.path;
  }

  const portfolio_paths: string[] = [];
  const portfolioFiles = fd.getAll("portfolio");
  for (const f of portfolioFiles) {
    if (!(f instanceof File) || f.size === 0) continue;
    const up = await uploadMemberFile(f, "portfolio");
    if (up.error) return { message: up.error };
    portfolio_paths.push(up.path);
  }

  let visiting_card_path: string | undefined;
  const visitingCard = fd.get("visiting_card");
  if (visitingCard instanceof File && visitingCard.size > 0) {
    const up = await uploadMemberFile(visitingCard, "cards");
    if (up.error) return { message: up.error };
    visiting_card_path = up.path;
  }

  const raw = {
    full_name: fd.get("full_name")?.toString() ?? "",
    business_name: fd.get("business_name")?.toString() ?? "",
    contact_number: fd.get("contact_number")?.toString() ?? "",
    whatsapp_number: fd.get("whatsapp_number")?.toString(),
    email: fd.get("email")?.toString() ?? "",
    city: fd.get("city")?.toString() ?? "",
    area_locality: fd.get("area_locality")?.toString(),

    business_category: fd.get("business_category")?.toString() ?? "",
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
    profile_photo_path,
    portfolio_paths: portfolio_paths.length ? portfolio_paths : undefined,
    visiting_card_path,
  };

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

  const payload: DirectoryMemberInsertInput = parsed.data;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("directory_members")
    .insert({
      full_name: payload.full_name,
      business_name: payload.business_name,
      profile_photo_path: payload.profile_photo_path ?? null,
      contact_number: payload.contact_number,
      whatsapp_number: payload.whatsapp_number ?? null,
      email: payload.email,
      city: payload.city,
      area_locality: payload.area_locality ?? null,

      business_category: payload.business_category,
      sub_category: payload.sub_category,
      business_types: payload.business_types,
      keywords_tags: payload.keywords_tags,
      products_services: payload.products_services,
      specialization: payload.specialization ?? null,
      years_experience: payload.years_experience ?? null,
      price_ranges: payload.price_ranges ?? [],

      business_address: payload.business_address ?? null,
      service_area: payload.service_area,
      google_maps_link: payload.google_maps_link ?? null,

      website: payload.website ?? null,
      instagram: payload.instagram ?? null,
      facebook: payload.facebook ?? null,
      linkedin: payload.linkedin ?? null,

      usp: payload.usp ?? null,
      certifications: payload.certifications ?? null,
      awards: payload.awards ?? null,

      looking_for: payload.looking_for,
      preferred_categories_connect: payload.preferred_categories_connect,

      portfolio_paths: payload.portfolio_paths ?? [],
      visiting_card_path: payload.visiting_card_path ?? null,

      target_customers: payload.target_customers ?? null,
      referred_by: payload.referred_by ?? null,

      consent_share: payload.consent_share,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitDirectoryMember]", error);
    return {
      message: error.message || "Could not save to the directory right now.",
    };
  }

  redirect(`/directory/${data.id}`);
}
