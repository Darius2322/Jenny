import { staffLogout } from "@/lib/auth-actions";

export const metadata = { title: "Access denied" };

export default function DeniedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 text-center">
      <h1 className="text-xl font-bold">Access denied</h1>
      <p className="mt-2 text-muted">Your account doesn&apos;t have permission to use this area. This attempt may be logged.</p>
      <form action={staffLogout} className="mt-6"><button type="submit" className="btn btn-secondary">Sign out</button></form>
    </main>
  );
}
