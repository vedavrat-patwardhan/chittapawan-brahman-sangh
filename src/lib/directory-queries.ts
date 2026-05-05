import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { mapMemberRow, type MemberListItem } from "@/types/member";

export const PAGE_SIZE = 20;

export type MemberListFilters = {
  search?: string;
  category?: string;
  city?: string;
  business_type?: string;
  page: number;
};

function sanitizeLike(q: string) {
  return q.replace(/[%_\\,]/g, "").trim();
}

export async function listMembers(
  filters: MemberListFilters,
): Promise<{ rows: MemberListItem[]; total: number; page: number; pageCount: number }> {
  const page = Number.isFinite(filters.page) ? Math.max(1, filters.page) : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = createSupabaseAdmin();

  let query = supabase
    .from("directory_members")
    .select(
      "id, created_at, full_name, business_name, business_category, sub_category, city, keywords_tags, business_types, email, contact_number, products_services",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const cat = filters.category?.trim();
  if (cat) query = query.eq("business_category", cat);

  const city = sanitizeLike(filters.city ?? "");
  if (city.length) query = query.ilike("city", `%${city}%`);

  const btype = filters.business_type?.trim();
  if (btype) query = query.contains("business_types", [btype]);

  const search = sanitizeLike(filters.search ?? "");
  if (search.length) {
    const pattern = `%${search}%`;
    query = query.or(
      `full_name.ilike.${pattern},business_name.ilike.${pattern},keywords_tags.ilike.${pattern},sub_category.ilike.${pattern},products_services.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const rows = (data ?? []).map((r) => mapMemberRow(r as Record<string, unknown>));

  return {
    rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getMemberById(
  id: string,
): Promise<Record<string, unknown> | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("directory_members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}
