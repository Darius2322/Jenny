import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "You're offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo size={44} />
      <WifiOff size={36} className="text-muted" aria-hidden="true" />
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-muted">
        Jenny needs an internet connection to load posts and messages. Nothing you were
        writing has been sent. Reconnect and try again.
      </p>
      <a href="/" className="btn btn-primary">Try again</a>
    </main>
  );
}
