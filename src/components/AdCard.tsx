"use client";

import { useEffect } from "react";
import { Megaphone } from "lucide-react";
import { adEvent } from "@/lib/ads-actions";
import { publicUrl } from "@/lib/upload";

type Ad = { id: string; business_name: string; title: string; body: string; link_url: string; image_path: string | null };

export function AdCard({ ad }: { ad: Ad }) {
  useEffect(() => { void adEvent(ad.id, false); }, [ad.id]);
  return (
    <aside aria-label="Sponsored" className="mx-4 my-4 overflow-hidden rounded-3xl border border-line bg-surface dark:border-white/10 dark:bg-white/5">
      {ad.image_path && /* eslint-disable-next-line @next/next/no-img-element */ <img src={publicUrl("post-media", ad.image_path)} alt="" loading="lazy" className="max-h-56 w-full object-cover" />}
      <div className="p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted"><Megaphone size={12} aria-hidden="true" /> Sponsored · {ad.business_name}</p>
        <h3 className="mt-1 text-lg font-extrabold">{ad.title}</h3>
        <p className="mt-1 text-sm">{ad.body}</p>
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored nofollow" onClick={() => void adEvent(ad.id, true)} className="btn btn-primary mt-3 !min-h-[44px]">Learn more</a>
      </div>
    </aside>
  );
}
