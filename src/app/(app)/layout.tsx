import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);

  return (
    <div className="min-h-dvh bg-surface dark:bg-night">
      <AppNav unread={count ?? 0} />
      <main id="main" className="md:ml-64">
        <div className="mx-auto min-h-dvh w-full max-w-xl overflow-hidden bg-white pb-28 dark:bg-slate-900 md:my-6 md:min-h-0 md:rounded-4xl md:border md:border-line md:pb-4 md:shadow-soft md:dark:border-white/10">
          {children}
        </div>
      </main>
    </div>
  );
}
