export type MemberListItem = {
  id: string;
  created_at: string;
  full_name: string;
  business_name: string;
  business_category: string;
  sub_category: string;
  city: string;
  keywords_tags: string;
  business_types: string[];
  email: string;
  contact_number: string;
  products_services: string;
};

export function mapMemberRow(row: Record<string, unknown>): MemberListItem {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    full_name: String(row.full_name),
    business_name: String(row.business_name),
    business_category: String(row.business_category),
    sub_category: String(row.sub_category),
    city: String(row.city),
    keywords_tags: String(row.keywords_tags),
    business_types: (row.business_types as string[]) ?? [],
    email: String(row.email),
    contact_number: String(row.contact_number),
    products_services: String(row.products_services),
  };
}
