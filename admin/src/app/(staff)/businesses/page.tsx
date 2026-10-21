import { requireStaff, MODERATION, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { setBusinessState } from "@/lib/admin-actions";

export const metadata = { title: "Businesses" };

type B = { id: string; handle: string; name: string; category: string; description: string | null; location_text: string | null; status: string; verification_status: string; created_at: string };

function Row({ b, isAdmin }: { b: B; isAdmin: boolean }) {
  const btn = (action: string, label: string) => (
    <form action={setBusinessState}><input type="hidden" name="businessId" value={b.id} /><button name="action" value={action} className="btn btn-secondary !min-h-[40px]">{label}</button></form>
  );
  return (
    <li className="rounded-xl border border-line p-4 dark:border-white/10">
      <p className="font-semibold">{b.name} <span className="font-normal text-muted">@{b.handle}</span></p>
      <p className="text-sm text-muted">{b.category}{b.location_text ? ` · ${b.location_text}` : ""} · {b.status.replace("_", " ")} · {b.verification_status}</p>
      {b.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{b.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {b.status === "pending_review" && btn("approve", "Approve")}
        {b.status === "active" && btn("suspend", "Suspend")}
        {b.status === "suspended" && btn("reinstate", "Reinstate")}
        {isAdmin && b.verification_status !== "verified" && b.status === "active" && btn("verify", "Mark verified")}
        {isAdmin && b.verification_status === "verified" && btn("unverify", "Remove verified badge")}
      </div>
    </li>
  );
}

export default async function BusinessesPage() {
  const staff = await requireStaff(MODERATION);
  const isAdmin = ADMINS.includes(staff.role);
  const svc = createServiceClient();
  const cols = "id, handle, name, category, description, location_text, status, verification_status, created_at";
  const [{ data: pending }, { data: others }] = await Promise.all([
    svc.from("businesses").select(cols).eq("status", "pending_review").order("created_at", { ascending: true }).limit(50),
    svc.from("businesses").select(cols).neq("status", "pending_review").order("created_at", { ascending: false }).limit(30),
  ]);
  return (
    <>
      <h1 className="text-2xl font-bold">Businesses</h1>
      <p className="mt-1 text-sm text-muted">Only mark a business verified after you have actually checked it. Never invent a badge.</p>
      <h2 className="mt-6 text-lg font-bold">Awaiting review</h2>
      {(pending ?? []).length === 0 && <p className="mt-2 text-muted">Nothing waiting.</p>}
      <ul className="mt-3 space-y-3">{((pending ?? []) as B[]).map((b) => <Row key={b.id} b={b} isAdmin={isAdmin} />)}</ul>
      <h2 className="mt-8 text-lg font-bold">Recent active and suspended</h2>
      <ul className="mt-3 space-y-3">{((others ?? []) as B[]).map((b) => <Row key={b.id} b={b} isAdmin={isAdmin} />)}</ul>
    </>
  );
}
