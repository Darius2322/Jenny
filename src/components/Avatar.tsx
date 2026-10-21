import Image from "next/image";

export function avatarUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

export function Avatar({ name, path, size = 40 }: { name: string; path?: string | null; size?: number }) {
  const url = avatarUrl(path);
  if (url) {
    return <Image src={url} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand/15 font-bold text-brand-dark dark:text-brand" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </span>
  );
}
