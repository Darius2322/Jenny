import { SiteHeader, SiteFooter } from "./SiteHeader";

/** Honest stand-in for pages whose real content (especially legal text) still needs to be written and reviewed. */
export function PlaceholderPage({ title, summary }: { title: string; summary: string }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-4 text-muted">{summary}</p>
        <p role="note" className="mt-6 rounded-xl bg-surface p-4 text-sm dark:bg-white/10">
          This page is still being written and has not been legally reviewed. The final text will be published before Jenny launches.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
