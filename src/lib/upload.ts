import type { SupabaseClient } from "@supabase/supabase-js";

/** Identify the real image type from its first bytes. The browser-supplied MIME type and filename are never trusted. */
function sniff(b: Uint8Array): { mime: string; ext: string } | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { mime: "image/webp", ext: "webp" };
  return null;
}

export type UploadResult = { path: string; mime: string } | { error: string };

/** Uploads to `<bucket>/<userId>/<random>.<ext>`: a generated path, never user-controlled. Storage policies re-check ownership. */
export async function uploadImage(
  supabase: SupabaseClient, bucket: "avatars" | "covers" | "post-media", userId: string, file: File, maxBytes: number,
): Promise<UploadResult> {
  if (file.size === 0) return { error: "Choose an image first." };
  if (file.size > maxBytes) return { error: `Image is too large (max ${Math.round(maxBytes / 1048576)} MB).` };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return { error: "Only JPEG, PNG or WebP images are allowed." };
  const path = `${userId}/${crypto.randomUUID()}.${kind.ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: kind.mime, upsert: false });
  if (error) return { error: "Upload failed. Please try again." };
  return { path, mime: kind.mime };
}

export function publicUrl(bucket: string, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
