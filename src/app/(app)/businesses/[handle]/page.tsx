import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, MapPin, Globe, Mail, Phone, Flag } from "lucide-react";
import { createClient, getUserCached } from "@/lib/supabase/server";
import { reportContent } from "@/lib/actions";
import type { Business, Listing } from "@/lib/business";
import { EnquiryForm } from "@/components/EnquiryForm";
import { BusinessLogo } from "@/components/BusinessLogo";

export const metadata: Metadata = { title: "Business", robots: { index: false } };

export default async function BusinessPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: { user } } = await getUserCached();
  if (!user) return null;

  // RLS: only active businesses (or ones you manage) are returned.
  const { data } = await supabase.from("businesses")
    .select("id, handle, name, description, category, location_text, logo_path, website, public_email, public_phone, verification_status, status, created_at")
    .eq("handle", handle.toLowerCase()).maybeSingle();
  const b = data as Business | null;
  if (!b) notFound();

  const [{ data: listingRows }, { data: member }] = await Promise.all([
    supabase.from("business_listings").select("id, business_id, title, description, price_text, kind, status").eq("business_id", b.id).eq("status", "published").order("created_at", { ascending: false }).limit(50),
    supabase.from("business_members").select("role").eq("business_id", b.id).eq("user_id", user.id).maybeSingle(),
  ]);
  const listings = (listingRows ?? []) as Listing[];
  const isMember = !!member;

  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-2 py-2 dark:border-white/10">
        <Link href="/businesses" aria-label="Back to businesses" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <p className="text-sm text-muted">Businesses</p>
      </div>

      <section className="border-b border-line px-4 py-6 dark:border-white/10">
        {b.status !== "active" && <p role="status" className="mb-4 rounded-xl bg-surface p-3 text-sm dark:bg-white/10">Only you and your team can see this page until it has been reviewed.</p>}
        <BusinessLogo name={b.name} path={b.logo_path} size={72} />
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          {b.name}
          {b.verification_status === "verified" && <BadgeCheck size={22} className="text-brand-dark dark:text-brand" aria-label="Verified business" />}
        </h1>
        <p className="mt-1 text-muted">{b.category} · @{b.handle}</p>
        {b.description && <p className="mt-4 whitespace-pre-wrap break-words">{b.description}</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {b.location_text && <li className="flex items-center gap-2"><MapPin size={16} className="text-muted" aria-hidden="true" />{b.location_text}</li>}
          {b.website && <li className="flex items-center gap-2"><Globe size={16} className="text-muted" aria-hidden="true" /><a href={b.website} target="_blank" rel="noopener noreferrer nofollow" className="underline">{b.website.replace(/^https?:\/\//, "")}</a></li>}
          {b.public_email && <li className="flex items-center gap-2"><Mail size={16} className="text-muted" aria-hidden="true" /><a href={`mailto:${b.public_email}`} className="underline">{b.public_email}</a></li>}
          {b.public_phone && <li className="flex items-center gap-2"><Phone size={16} className="text-muted" aria-hidden="true" /><a href={`tel:${b.public_phone.replace(/[^+0-9]/g, "")}`} className="underline">{b.public_phone}</a></li>}
        </ul>
        {isMember && <Link href="/business" className="btn btn-secondary mt-5">Manage business</Link>}
      </section>

      <section aria-labelledby="listings-heading" className="border-b border-line px-4 py-6 dark:border-white/10">
        <h2 id="listings-heading" className="text-lg font-bold">Products and services</h2>
        {listings.length === 0 && <p className="mt-2 text-sm text-muted">Nothing listed yet.</p>}
        <ul className="mt-3 space-y-3">
          {listings.map((l) => (
            <li key={l.id} className="rounded-xl border border-line p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{l.title}</h3>
                {l.price_text && <span className="shrink-0 text-sm font-semibold text-brand-dark dark:text-brand">{l.price_text}</span>}
              </div>
              <p className="text-xs uppercase tracking-wide text-muted">{l.kind}</p>
              {l.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{l.description}</p>}
              {!isMember && b.status === "active" && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-dark dark:text-brand">Ask about this</summary>
                  <div className="mt-3"><EnquiryForm businessId={b.id} listingId={l.id} businessName={b.name} /></div>
                </details>
              )}
            </li>
          ))}
        </ul>
      </section>

      {!isMember && b.status === "active" && (
        <section aria-labelledby="contact-heading" className="px-4 py-6">
          <h2 id="contact-heading" className="text-lg font-bold">Send an enquiry</h2>
          <div className="mt-3"><EnquiryForm businessId={b.id} businessName={b.name} /></div>
          <form action={reportContent} className="mt-6">
            <input type="hidden" name="targetType" value="business" />
            <input type="hidden" name="targetId" value={b.id} />
            <input type="hidden" name="reason" value="fraud" />
            <button type="submit" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted underline"><Flag size={14} aria-hidden="true" /> Report this business as misleading or fraudulent</button>
          </form>
        </section>
      )}
    </>
  );
}
