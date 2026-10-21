import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { staffLogout } from "@/lib/auth-actions";
import { Logo } from "@/components/Logo";
import { MfaForm } from "./MfaForm";

export const metadata = { title: "Two-factor verification" };

export default async function MfaPage() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Only people who actually hold a staff role may even start enrolment.
  const { data: row } = await createServiceClient().from("admin_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (!row) redirect("/denied");
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <Logo size={40} />
      <h1 className="mt-6 text-xl font-bold">Two-factor verification</h1>
      <MfaForm />
      <form action={staffLogout} className="mt-6"><button type="submit" className="text-sm text-muted underline">Sign out</button></form>
    </main>
  );
}
