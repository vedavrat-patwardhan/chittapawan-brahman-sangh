import { createSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "member-uploads";

export function storagePublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const supabase = createSupabaseAdmin();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadMemberFile(
  file: File,
  folder: string,
): Promise<{ path: string; error: string | null }> {
  const supabase = createSupabaseAdmin();
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-120);
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return { path: "", error: error.message };
  return { path, error: null };
}
