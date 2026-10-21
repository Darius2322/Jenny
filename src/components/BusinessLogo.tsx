import Image from "next/image";
import { logoUrl } from "@/lib/media";

export function BusinessLogo({ name, path, size = 48 }: { name: string; path?: string | null; size?: number }) {
  const url = logoUrl(path);
  if (url) return <Image src={url} alt="" width={size} height={size} className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />;
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand/15 font-bold text-brand-dark dark:text-brand" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
