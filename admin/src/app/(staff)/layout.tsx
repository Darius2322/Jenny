import { requireStaff, ADMINS } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase-service";
import { staffLogout } from "@/lib/auth-actions";
import { AdminShell, type NavGroup } from "@/components/AdminShell";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const isAdmin = ADMINS.includes(staff.role);
  const svc = createServiceClient();
  const head = { count: "exact" as const, head: true };
  const [rep, biz, news, del] = await Promise.all([
    svc.from("content_reports").select("id", head).in("status", ["open", "reviewing"]),
    svc.from("businesses").select("id", head).eq("status", "pending_review"),
    svc.from("news_submissions").select("id", head).eq("status", "pending"),
    isAdmin ? svc.from("account_deletion_requests").select("id", head).eq("status", "requested") : Promise.resolve({ count: 0 }),
  ]);
  const groups: NavGroup[] = [
    { title: "Dashboard", items: [{ href: "/", label: "Overview", icon: "overview" }] },
    { title: "Moderation", items: [
      { href: "/reports", label: "Reports", icon: "reports", badge: rep.count ?? 0 },
      { href: "/posts", label: "Posts", icon: "posts" },
      { href: "/gossip", label: "Gossip", icon: "gossip" },
    ] },
    { title: "Community", items: [
      { href: "/users", label: "Users", icon: "users" },
      { href: "/businesses", label: "Businesses", icon: "businesses", badge: biz.count ?? 0 },
      { href: "/news", label: "News", icon: "news", badge: news.count ?? 0 },
      { href: "/dating", label: "Dating", icon: "dating" },
    ] },
    ...(isAdmin ? [{ title: "Administration", items: [
      { href: "/deletions", label: "Deletions", icon: "deletions" as const, badge: del.count ?? 0 },
      { href: "/audit", label: "Audit log", icon: "audit" as const },
      { href: "/staff", label: "Staff", icon: "staff" as const },
    ] }] : []),
  ];
  return <AdminShell groups={groups} email={staff.email ?? "staff"} role={staff.role} logout={staffLogout}>{children}</AdminShell>;
}
