/** Public URLs for files in Supabase Storage public buckets. Safe to import from server and client code. */
function base(bucket: string, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
export const coverUrl = (path: string | null | undefined) => (path ? base("covers", path) : null);
export const logoUrl = (path: string | null | undefined) => (path ? base("business-logos", path) : null);
