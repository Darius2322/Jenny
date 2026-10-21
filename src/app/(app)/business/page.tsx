import type { Metadata } from "next";
import Link from "next/link";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { setListingStatus, deleteListing, setEnquiryStatus } from "@/lib/business-actions";
import type { Business, Listing, Enquiry } from "@/lib/business";
import { BusinessForm } from "@/components/BusinessForm";
import { ListingForm } from "@/components/ListingForm";
import { timeAgo } from "@/lib/posts";

export const metadata: Metadata = { title: "Your business", robots: { index: false } };

const statusText: Record<string, string> = {
  pending_review: "Pending review. Only your team can see your profile until it is approved.",
  active: "Live. Your profile is visible to Jenny members.",
  suspended: "Suspended. Contact support to find out why.",
};

export default async function BusinessDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase.from("business_members").select("business_id").eq("user_id", user.id).limit(1);
  const businessId = (memberships ?? [])[0]?.business_id as string | undefined;

  if (!businessId) {
    return (
      <>
        <h1 className="px-4 pt-5 text-xl font-bold">Set up your business</h1>
        <p className="px-4 pt-2 text-sm text-muted">Create a public profile so customers can find you and send enquiries. New profiles are reviewed before they appear in Discover.</p>
        <div className="px-4 py-5"><BusinessForm /></div>
      </>
    );
  }

  const [{ data: bizRow }, { data: listingRows }, { data: enquiryRows }] = await Promise.all([
    supabase.from("businesses").select("id, handle, name, description, category, location_text, website, public_email, public_phone, verification_status, status, created_at").eq("id", businessId).single(),
    supabase.from("business_listings").select("id, business_id, title, description, price_text, kind, status").eq("business_id", businessId).order("created_at", { ascending: false }),
    supabase.from("business_enquiries").select("id, sender_id, listing_id, message, status, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(50),
  ]);
  const b = bizRow as Business | null;
  if (!b) return <p role="alert" className="p-4 text-red-600">Couldn&apos;t load your business.</p>;
  const listings = (listingRows ?? []) as Listing[];
  const enquiries = (enquiryRows ?? []) as Enquiry[];

  const senderIds = [...new Set(enquiries.map((e) => e.sender_id))];
  const senders = new Map<string, { username: string; display_name: string }>();
  if (senderIds.length) {
    const { data } = await supabase.from("profiles").select("id, username, display_name").in("id", senderIds);
    (data ?? []).forEach((p: { id: string; username: string; display_name: string }) => senders.set(p.id, p));
  }
  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <>
      <div className="px-4 pt-5">
        <h1 className="text-xl font-bold">{b.name}</h1>
        <p role="status" className="mt-2 rounded-xl bg-surface p-3 text-sm dark:bg-white/10">{statusText[b.status] ?? b.status}</p>
        <Link href={`/businesses/${b.handle}`} className="btn btn-secondary mt-3">Preview public profile</Link>
      </div>

      <section aria-labelledby="enq-heading" className="mt-6 border-t border-line px-4 py-5 dark:border-white/10">
        <h2 id="enq-heading" className="text-lg font-bold">Enquiries {newCount > 0 && <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-xs text-ink">{newCount} new</span>}</h2>
        {enquiries.length === 0 && <p className="mt-2 text-sm text-muted">No enquiries yet.</p>}
        <ul className="mt-3 space-y-3">
          {enquiries.map((e) => {
            const s = senders.get(e.sender_id);
            const about = listings.find((l) => l.id === e.listing_id);
            return (
              <li key={e.id} className={`rounded-xl border p-4 ${e.status === "new" ? "border-brand" : "border-line dark:border-white/10"}`}>
                <p className="text-sm">
                  {s ? <Link href={`/u/${s.username}`} className="font-semibold hover:underline">{s.display_name}</Link> : <span className="font-semibold text-muted">Unavailable user</span>}
                  <span className="text-muted"> · {timeAgo(e.created_at)} · {e.status}</span>
                </p>
                {about && <p className="text-xs text-muted">About: {about.title}</p>}
                <p className="mt-1 whitespace-pre-wrap break-words text-[15px]">{e.message}</p>
                {e.status !== "closed" && (
                  <div className="mt-3 flex gap-2">
                    {e.status === "new" && (
                      <form action={setEnquiryStatus}><input type="hidden" name="enquiryId" value={e.id} /><input type="hidden" name="status" value="read" /><button className="btn btn-secondary !min-h-[40px]">Mark read</button></form>
                    )}
                    <form action={setEnquiryStatus}><input type="hidden" name="enquiryId" value={e.id} /><input type="hidden" name="status" value="closed" /><button className="btn btn-secondary !min-h-[40px]">Close</button></form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="listings-heading" className="border-t border-line px-4 py-5 dark:border-white/10">
        <h2 id="listings-heading" className="text-lg font-bold">Products and services</h2>
        <ul className="mt-3 space-y-2">
          {listings.map((l) => (
            <li key={l.id} className="flex items-center gap-2 rounded-xl border border-line p-3 dark:border-white/10">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{l.title}</p>
                <p className="text-xs text-muted">{l.kind}{l.price_text ? ` · ${l.price_text}` : ""} · {l.status}</p>
              </div>
              <form action={setListingStatus}>
                <input type="hidden" name="listingId" value={l.id} />
                <input type="hidden" name="status" value={l.status === "published" ? "draft" : "published"} />
                <button type="submit" aria-label={l.status === "published" ? "Unpublish listing" : "Publish listing"} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10">
                  {l.status === "published" ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </form>
              <form action={deleteListing}>
                <input type="hidden" name="listingId" value={l.id} />
                <button type="submit" aria-label="Delete listing" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface dark:hover:bg-white/10"><Trash2 size={18} aria-hidden="true" /></button>
              </form>
            </li>
          ))}
        </ul>
        <div className="mt-4"><ListingForm businessId={b.id} /></div>
      </section>

      <section aria-labelledby="profile-heading" className="border-t border-line px-4 py-5 dark:border-white/10">
        <h2 id="profile-heading" className="mb-4 text-lg font-bold">Business profile</h2>
        <BusinessForm business={b} />
      </section>
    </>
  );
}
