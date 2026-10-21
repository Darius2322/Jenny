import Link from "next/link";
import { Users, Store, Newspaper, MessageCircle, ShieldCheck, Heart, Compass, Lock } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

const highlights = [
  { icon: Compass, title: "Discover people and communities", body: "Find people who share your interests and follow the conversations that matter to you." },
  { icon: Store, title: "Find local businesses", body: "Browse business profiles, see what they offer and send an enquiry directly." },
  { icon: Newspaper, title: "News and trending talk", body: "Follow community updates with clear labels that separate sourced news from opinion and rumour." },
  { icon: MessageCircle, title: "Private messages", body: "Talk one-to-one with people you choose, with block and report controls built in." },
];

const safety = [
  "You choose who sees your profile and posts.",
  "Block and report tools on every post, profile and conversation.",
  "Reports are reviewed by people, and decisions are recorded.",
  "We collect only the data Jenny needs. No contact-list uploads, no precise location by default.",
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:pt-20">
          <p className="mb-3 text-sm font-semibold tracking-wide text-brand-dark dark:text-brand">Connect. Discover. Belong.</p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Your people, your places, your conversations.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Jenny is a social network for Kenya where you can follow friends, discover communities
            and businesses, keep up with local news and message privately, all in one app.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary">Create account</Link>
            <Link href="/login" className="btn btn-secondary">Sign in</Link>
          </div>
        </section>

        <section aria-labelledby="discover-heading" className="border-y border-line bg-surface dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 id="discover-heading" className="text-2xl font-bold">Discover Jenny</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <Icon size={24} className="text-brand-dark dark:text-brand" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="dating-heading" className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-start gap-4 rounded-2xl border border-line p-6 dark:border-white/10">
            <Heart size={28} className="mt-1 shrink-0 text-brand-dark dark:text-brand" aria-hidden="true" />
            <div>
              <h2 id="dating-heading" className="text-xl font-bold">
                Dating, for adults only <span className="ml-2 rounded-full bg-surface px-2.5 py-0.5 align-middle text-xs font-semibold text-muted dark:bg-white/10">Coming soon</span>
              </h2>
              <p className="mt-2 max-w-2xl text-muted">
                We are planning an optional dating space for people aged 18 and over. It will not
                launch until age checks, privacy controls and moderation are in place and tested.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="safety-heading" className="border-t border-line dark:border-white/10">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2">
            <div>
              <ShieldCheck size={28} className="text-brand-dark dark:text-brand" aria-hidden="true" />
              <h2 id="safety-heading" className="mt-3 text-2xl font-bold">Safety and privacy come first</h2>
              <p className="mt-2 text-muted">Jenny is designed so you stay in control of your information.</p>
            </div>
            <ul className="space-y-3">
              {safety.map((s) => (
                <li key={s} className="flex gap-3 text-sm">
                  <Lock size={18} className="mt-0.5 shrink-0 text-brand-dark dark:text-brand" aria-hidden="true" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-ink p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users size={28} className="text-brand" aria-hidden="true" />
              <p className="text-lg font-semibold">Ready to find your people?</p>
            </div>
            <Link href="/register" className="btn btn-primary">Create account</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
