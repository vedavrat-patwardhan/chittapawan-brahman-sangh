import { Binary } from "mongodb";

import { parseObjectId, uploadsCollection } from "@/lib/mongodb";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadFolder = "profiles" | "portfolio" | "cards";

export type MemberUploadFile = {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
};

export function storagePublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/")
  ) {
    return path;
  }
  return `/api/uploads/${encodeURIComponent(path)}`;
}

export async function uploadMemberFile(
  file: File,
  folder: UploadFolder,
): Promise<{ path: string; error: string | null }> {
  if (file.size > MAX_BYTES) {
    return { path: "", error: "Each file must be 5 MB or smaller." };
  }
  const contentType = file.type || "application/octet-stream";
  if (
    !ALLOWED_TYPES.has(contentType) ||
    (folder !== "cards" && !IMAGE_TYPES.has(contentType))
  ) {
    return { path: "", error: "Use a JPEG, PNG, WebP, or PDF file." };
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-120);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesFileSignature(buffer, contentType)) {
    return { path: "", error: "That file does not match its declared format." };
  }
  let storedBuffer = buffer;
  let storedType = contentType;
  let storedName = safeName || "upload";
  if (IMAGE_TYPES.has(contentType)) {
    try {
      const sharp = (await import("sharp")).default;
      storedBuffer = await sharp(buffer)
        .rotate()
        .resize({
          width: folder === "profiles" ? 900 : 1_600,
          height: folder === "profiles" ? 900 : 1_600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
      storedType = "image/webp";
      storedName = `${storedName.replace(/\.[^.]+$/, "") || "upload"}.webp`;
    } catch (error) {
      console.error("[uploadMemberFile] Image processing failed", error);
      return { path: "", error: "That image could not be processed." };
    }
  }
  try {
    const uploads = await uploadsCollection();
    const result = await uploads.insertOne({
      filename: storedName,
      contentType: storedType,
      folder,
      data: new Binary(storedBuffer),
      created_at: new Date(),
    });
    return { path: result.insertedId.toString(), error: null };
  } catch (e: unknown) {
    console.error("[uploadMemberFile]", e);
    return {
      path: "",
      error: "Could not upload that file right now.",
    };
  }
}

function matchesFileSignature(buffer: Buffer, contentType: string): boolean {
  if (contentType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (contentType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (contentType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (contentType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  return false;
}

export async function deleteMemberUploads(ids: string[]): Promise<void> {
  const objectIds = ids.map(parseObjectId).filter((id) => id !== null);
  if (objectIds.length === 0) return;
  const uploads = await uploadsCollection();
  await uploads.deleteMany({ _id: { $in: objectIds } });
}

export async function getMemberUpload(
  id: string,
): Promise<MemberUploadFile | null> {
  const oid = parseObjectId(id);
  if (!oid) return null;
  const uploads = await uploadsCollection();
  const doc = await uploads.findOne({ _id: oid });
  if (!doc) return null;
  return {
    filename: doc.filename,
    contentType: doc.contentType,
    bytes: Uint8Array.from(doc.data.value()),
  };
}
