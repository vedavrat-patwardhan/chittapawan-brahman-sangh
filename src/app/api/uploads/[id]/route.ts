import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { isUploadPublic } from "@/lib/directory-queries";
import { getMemberUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const [session, publicUpload] = await Promise.all([
    getSession(),
    isUploadPublic(id).catch(() => false),
  ]);
  if (!session && !publicUpload) {
    return new NextResponse("Not found", { status: 404 });
  }
  const file = await getMemberUpload(id);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const safeName = file.filename.replace(/[\r\n"]/g, "_");
  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": session
        ? "private, max-age=3600"
        : "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
