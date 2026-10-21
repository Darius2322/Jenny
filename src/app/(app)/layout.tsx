import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);

  return (
    <div className="min-h-dvh">
      <AppNav unread={count ?? 0} />
      <main id="main" className="mx-auto min-h-dvh w-full max-w-xl border-line pb-24 dark:border-white/10 md:ml-64 md:max-w-none md:pb-0 md:[&>*]:mx-auto md:[&>*]:max-w-xl">
        {children}
      </main>
    </div>
  );
}
