import type { NextRequest } from "next/server";

import { getSession } from "@/lib/auth/session";
import { exportApplications } from "@/lib/directory-queries";
import { LISTING_STATUSES, type ListingStatus } from "@/types/member";

export const dynamic = "force-dynamic";

type CsvColumn = {
  heading: string;
  value: (row: Record<string, unknown>) => unknown;
};

const columns: CsvColumn[] = [
  { heading: "Reference", value: (row) => row.id },
  { heading: "Status", value: (row) => row.status },
  { heading: "Submitted at", value: (row) => row.created_at },
  { heading: "Updated at", value: (row) => row.updated_at },
  { heading: "Reviewed at", value: (row) => row.reviewed_at },
  { heading: "Applicant", value: (row) => row.full_name },
  { heading: "Business", value: (row) => row.business_name },
  { heading: "Email", value: (row) => row.email },
  { heading: "Contact", value: (row) => row.contact_number },
  { heading: "WhatsApp", value: (row) => row.whatsapp_number },
  { heading: "Category", value: (row) => row.business_category },
  { heading: "Sub-category", value: (row) => row.sub_category },
  { heading: "Business types", value: (row) => row.business_types },
  { heading: "City", value: (row) => row.city },
  { heading: "Area / locality", value: (row) => row.area_locality },
  { heading: "Service area", value: (row) => row.service_area },
  { heading: "Products & services", value: (row) => row.products_services },
  { heading: "Specialization", value: (row) => row.specialization },
  { heading: "Experience", value: (row) => row.years_experience },
  { heading: "Price ranges", value: (row) => row.price_ranges },
  { heading: "Website", value: (row) => row.website },
  { heading: "Looking for", value: (row) => row.looking_for },
  {
    heading: "Preferred connections",
    value: (row) => row.preferred_categories_connect,
  },
  { heading: "Referred by", value: (row) => row.referred_by },
  { heading: "Possible duplicate", value: (row) => row.duplicate_risk },
  {
    heading: "Duplicate match fields",
    value: (row) => row.duplicate_match_fields,
  },
  { heading: "Admin note", value: (row) => row.admin_note },
  { heading: "Rejection reason", value: (row) => row.rejection_reason },
  {
    heading: "Reviewer",
    value: (row) => {
      const reviewer = row.reviewed_by;
      if (!reviewer || typeof reviewer !== "object") return "";
      const value = reviewer as { name?: unknown; email?: unknown };
      return [value.name, value.email].filter(Boolean).join(" / ");
    },
  },
];

function csvValue(value: unknown): string {
  let text = "";
  if (Array.isArray(value)) text = value.join(" | ");
  else if (value === true) text = "Yes";
  else if (value === false) text = "No";
  else if (value != null) text = String(value);

  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const requestedStatus = request.nextUrl.searchParams.get("status");
  const status: ListingStatus | "all" = LISTING_STATUSES.includes(
    requestedStatus as ListingStatus,
  )
    ? (requestedStatus as ListingStatus)
    : "all";
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 100);
  const rows = await exportApplications({ status, search });
  const csv = [
    columns.map((column) => csvValue(column.heading)).join(","),
    ...rows.map((row) =>
      columns.map((column) => csvValue(column.value(row))).join(","),
    ),
  ].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="directory-applications-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
