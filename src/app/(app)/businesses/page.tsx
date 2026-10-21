import type { Metadata } from "next";
import Link from "next/link";
import { Search, MapPin, BadgeCheck, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_CATEGORIES, likeEscape, type Business } from "@/lib/business";
import { DiscoverTabs } from "@/components/DiscoverTabs";

export const metadata: Metadata = { title: "Businesses", robots: { index: false } };

export default async function BusinessesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 50);
  const category = (BUSINESS_CATEGORIES as readonly string[]).includes(sp.category ?? "") ? sp.category! : "";

  const supabase = await createClient();
  let query = supabase
    .from("businesses")
    .select("id, handle, name, description, category, location_text, verification_status")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);
  if (category) query = query.eq("category", category);
  if (q.length >= 2) query = query.ilike("name", `%${likeEscape(q)}%`);
  const { data, error } = await query;
  const list = (data ?? []) as Pick<Business, "id" | "handle" | "name" | "description" | "category" | "location_text" | "verification_status">[];

  return (
    <>
      <h1 className="px-4 pt-5 text-xl font-bold">Discover</h1>
      <DiscoverTabs active="businesses" />
      <form action="/businesses" role="search" className="flex flex-col gap-2 border-b border-line px-4 py-4 dark:border-white/10">
        <div className="flex gap-2">
          <label htmlFor="bq" className="sr-only">Search businesses by name</label>
          <input id="bq" name="q" type="search" defaultValue={q} placeholder="Search businesses" className="field" autoComplete="off" />
          <button type="submit" className="btn btn-primary" aria-label="Search"><Search size={18} aria-hidden="true" /></button>
        </div>
        <label htmlFor="bc" className="sr-only">Category</label>
        <select id="bc" name="category" defaultValue={category} className="field">
          <option value="">All categories</option>
          {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </form>

      {error && <p role="alert" className="p-4 text-sm text-red-600">Couldn&apos;t load businesses. Please try again.</p>}
      {!error && list.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Store size={32} className="mx-auto text-muted" aria-hidden="true" />
          <p className="mt-3 font-semibold">No businesses found</p>
          <p className="mt-1 text-muted">Business profiles appear here once they&apos;ve been reviewed. Own a business?</p>
          <Link href="/business" className="btn btn-primary mt-4">Set up your business</Link>
        </div>
      )}
      <ul>
        {list.map((b) => (
          <li key={b.id} className="border-b border-line dark:border-white/10">
            <Link href={`/businesses/${b.handle}`} className="block px-4 py-4 hover:bg-surface dark:hover:bg-white/5">
              <span className="flex items-center gap-2 font-semibold">
                {b.name}
                {b.verification_status === "verified" && <BadgeCheck size={16} className="text-brand-dark dark:text-brand" aria-label="Verified business" />}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                <span>{b.category}</span>
                {b.location_text && <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{b.location_text}</span>}
              </span>
              {b.description && <span className="mt-1.5 line-clamp-2 block text-sm">{b.description}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
