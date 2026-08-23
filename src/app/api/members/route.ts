import { NextResponse, type NextRequest } from "next/server";

import { listMembers } from "@/lib/directory-queries";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page") ?? "1");
  try {
    const result = await listMembers({
      search: sp.get("search") ?? undefined,
      category: sp.get("category") ?? "",
      city: sp.get("city") ?? undefined,
      business_type: sp.get("business_type") ?? "",
      page: Number.isFinite(page) ? page : 1,
    });
    return NextResponse.json(result);
  } catch (e: unknown) {
    console.error(
      "[api/members] MongoDB query failed:",
      e instanceof Error ? e.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Directory data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
