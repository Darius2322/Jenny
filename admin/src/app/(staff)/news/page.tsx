import { requireStaff, MODERATION } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { reviewNews } from "@/lib/admin-actions";

export const metadata = { title: "News review" };

type N = { id: string; title: string; summary: string; source_url: string | null; label: string; created_at: string };

export default async function NewsReviewPage() {
  await requireStaff(MODERATION);
  const { data } = await createServiceClient().from("news_submissions").select("id, title, summary, source_url, label, created_at").eq("status", "pending").order("created_at", { ascending: true }).limit(50);
  const items = (data ?? []) as N[];
  return (
    <>
      <h1 className="text-2xl font-bold">News review</h1>
      <p className="mt-1 text-sm text-muted">
        Never publish an unverified accusation about an identifiable person, private information, or a dangerous claim. A story may only be labelled “sourced news” if it links a real source.
      </p>
      {items.length === 0 && <p className="mt-8 text-muted">Nothing waiting.</p>}
      <ul className="mt-6 space-y-4">
        {items.map((n) => (
          <li key={n.id} className="rounded-xl border border-line p-4 dark:border-white/10">
            <h2 className="font-semibold">{n.title}</h2>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{n.summary}</p>
            <p className="mt-2 text-sm text-muted">
              Source: {n.source_url ? <a href={n.source_url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{n.source_url}</a> : "none provided"}
            </p>
            <form action={reviewNews} className="mt-3 space-y-2">
              <input type="hidden" name="submissionId" value={n.id} />
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor={`l-${n.id}`} className="label">Label if published</label>
                  <select id={`l-${n.id}`} name="label" defaultValue={n.source_url ? "sourced_news" : "unverified_submission"} className="field">
                    <option value="sourced_news">Sourced news (needs a source link)</option>
                    <option value="opinion">Opinion</option>
                    <option value="rumor_unverified">Rumour / unverified</option>
                    <option value="unverified_submission">Unverified community submission</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`n-${n.id}`} className="label">Internal note</label>
                  <input id={`n-${n.id}`} name="note" maxLength={500} className="field" />
                </div>
              </div>
              <div className="flex gap-2">
                <button name="action" value="publish" className="btn btn-primary !min-h-[40px]">Publish</button>
                <button name="action" value="reject" className="btn btn-secondary !min-h-[40px]">Reject</button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
