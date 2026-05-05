import { NextResponse, type NextRequest } from "next/server";

import { listMembers } from "@/lib/directory-queries";
import type { BUSINESS_CATEGORIES, BUSINESS_TYPES } from "@/lib/constants/form-options";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page") ?? "1");
  try {
    const result = await listMembers({
      search: sp.get("search") ?? undefined,
      category: (sp.get("category") as (typeof BUSINESS_CATEGORIES)[number] | "") || "",
      city: sp.get("city") ?? undefined,
      business_type: (sp.get("business_type") as (typeof BUSINESS_TYPES)[number] | "") || "",
      page: Number.isFinite(page) ? page : 1,
    });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
