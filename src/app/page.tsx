import Link from "next/link";
import { ArrowRight, BadgeCheck, Compass, Heart, Layers, Lock, MessageCircle, Newspaper, ShieldCheck, Store, Users } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { JennyEmblem } from "@/components/Logo";

const bullets = [
  "Follow people, communities and local businesses",
  "Private one-to-one messages you control",
  "News with clear labels, not rumours",
  "Block and report tools on everything",
];

const facts = [
  { icon: Layers, big: "One app", small: "People, businesses, news and chat together" },
  { icon: Lock, big: "Private by choice", small: "You decide who sees your profile" },
  { icon: ShieldCheck, big: "Reviewed by people", small: "Reports are checked and logged" },
  { icon: BadgeCheck, big: "Verified businesses", small: "Badges are given after review" },
];

const highlights = [
  { icon: Compass, title: "Discover people and communities", body: "Find people who share your interests and follow the conversations that matter to you." },
  { icon: Store, title: "Find local businesses", body: "Browse business profiles, see what they offer and send an enquiry directly." },
  { icon: Newspaper, title: "News and trending talk", body: "Community updates with clear labels that separate sourced news from opinion and rumour." },
  { icon: MessageCircle, title: "Private messages", body: "Talk one-to-one with people you choose, with block and report controls built in." },
];

const safety = [
  "You choose who sees your profile and posts.",
  "Block and report tools on every post, profile and conversation.",
  "Reports are reviewed by people, and decisions are recorded.",
  "We collect only the data Jenny needs. No contact-list uploads, no precise location by default.",
];

function PhoneMock() {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-[19rem] rounded-[2.2rem] border border-white/15 bg-white/10 p-2.5 shadow-2xl backdrop-blur">
      <div className="overflow-hidden rounded-[1.8rem] bg-white text-ink">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="flex items-center gap-1 text-sm font-extrabold tracking-tight"><JennyEmblem size={20} />enny</span>
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
        </div>
        {[
          ["Amina W.", "Nairobi", "Anyone know a good place for nyama choma near Westlands this weekend?"],
          ["Baraka Hardware", "Kisumu", "New stock in: 20L paint, all colours. Ask us for a quote."],
        ].map(([name, place, text]) => (
          <div key={name} className="border-b border-line px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-tint text-sm font-bold text-brand-dark">{name?.[0]}</span>
              <div className="leading-tight"><p className="text-sm font-semibold">{name}</p><p className="text-[11px] text-muted">{place}</p></div>
            </div>
            <p className="mt-2 text-[13px] leading-snug">{text}</p>
            <div className="mt-2.5 flex gap-4 text-[11px] text-muted"><span className="inline-flex items-center gap-1"><Heart size={13} /> Like</span><span className="inline-flex items-center gap-1"><MessageCircle size={13} /> Comment</span></div>
          </div>
        ))}
        <div className="grid grid-cols-5 px-2 py-2.5 text-center text-[10px] font-medium text-muted">
          {["Home", "Discover", "Create", "Chat", "You"].map((t, i) => <span key={t} className={i === 0 ? "font-bold text-brand-dark" : ""}>{t}</span>)}
        </div>
      </div>
      <p className="px-2 pb-1 pt-2 text-center text-[10px] text-white/60">Illustration: sample posts, not real people.</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <main id="main">
        <section className="relative overflow-hidden bg-night text-white">
          <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-52 -left-32 h-[30rem] w-[30rem] rounded-full bg-brand-dark/50 blur-3xl" />
          <SiteHeader dark />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:pt-44">
            <div>
              <p className="text-sm font-semibold text-brand">Connect. Discover. Belong.</p>
              <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] sm:text-6xl">
                Your people,<br />your places,<br />all in one app.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                Jenny is a social network for Kenya. Follow friends, discover communities and businesses,
                keep up with local news and message privately, from any phone.
              </p>
              <ul className="mt-8 space-y-3">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-base text-slate-100">
                    <BadgeCheck size={22} className="shrink-0 text-brand" aria-hidden="true" /> {b}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="btn btn-primary !bg-brand !text-ink hover:!bg-white">Get started <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link href="/login" className="btn btn-light">Sign in</Link>
              </div>
            </div>
            <PhoneMock />
          </div>
        </section>

        <section aria-label="Why Jenny" className="relative z-10 mx-auto -mt-10 max-w-6xl px-5">
          <ul className="card grid grid-cols-2 divide-line overflow-hidden lg:grid-cols-4 [&>li]:p-6">
            {facts.map(({ icon: Icon, big, small }) => (
              <li key={big} className="border-line [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0 [&:nth-child(odd)]:border-r lg:[&:not(:last-child)]:border-r dark:border-white/10">
                <span className="chip"><Icon size={22} aria-hidden="true" /></span>
                <p className="mt-4 text-xl font-extrabold tracking-tight">{big}</p>
                <p className="mt-1 text-sm text-muted">{small}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="discover-heading" className="mx-auto max-w-6xl px-5 py-24">
          <p className="eyebrow text-center">Take a look around</p>
          <h2 id="discover-heading" className="mx-auto mt-3 max-w-2xl text-center text-4xl font-extrabold leading-tight sm:text-5xl">Everything you need to belong, in one place.</h2>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2">
            {highlights.map(({ icon: Icon, title, body }) => (
              <li key={title} className="card p-7">
                <span className="chip"><Icon size={22} aria-hidden="true" /></span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="safety-heading" className="bg-white py-24 dark:bg-white/[0.03]">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
            <div>
              <p className="eyebrow">Safety and privacy</p>
              <h2 id="safety-heading" className="mt-3 text-4xl font-extrabold leading-tight">You stay in control of your information.</h2>
              <p className="mt-4 max-w-md text-lg text-muted">Jenny is designed with privacy and safety first, not added later.</p>
            </div>
            <ul className="card divide-y divide-line self-start dark:divide-white/10">
              {safety.map((s) => (
                <li key={s} className="flex gap-4 p-5">
                  <span className="chip !h-10 !w-10 shrink-0"><Lock size={18} aria-hidden="true" /></span>
                  <span className="self-center text-[15px] leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="dating-heading" className="mx-auto max-w-6xl px-5 py-20">
          <div className="card flex items-start gap-5 p-7">
            <span className="chip shrink-0"><Heart size={22} aria-hidden="true" /></span>
            <div>
              <h2 id="dating-heading" className="text-xl font-bold">
                Dating, for adults only <span className="ml-2 rounded-full bg-surface px-3 py-1 align-middle text-xs font-semibold text-muted dark:bg-white/10">Coming soon</span>
              </h2>
              <p className="mt-2 max-w-2xl leading-relaxed text-muted">
                We are planning an optional dating space for people aged 18 and over. It will not
                launch until age checks, privacy controls and moderation are in place and tested.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-4xl bg-night p-10 text-white sm:p-14">
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/30 blur-3xl" />
            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Users size={32} className="text-brand" aria-hidden="true" />
                <p className="text-2xl font-extrabold tracking-tight">Ready to find your people?</p>
              </div>
              <Link href="/register" className="btn btn-primary !bg-brand !text-ink hover:!bg-white">Create account <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
