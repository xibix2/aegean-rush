"use client";

import {
  ArrowUpRight,
  CalendarCheck,
  Car,
  Instagram,
  MessageCircle,
  Sparkles,
} from "lucide-react";

type SocialSectionClientProps = {
  clubSlug: string;
  clubName?: string | null;
};

const INSTAGRAM_HANDLE = "aegeanrush";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export function SocialSectionClient({
  clubSlug,
  clubName,
}: SocialSectionClientProps) {
  const displayName = clubName || "Aegean Rush";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07111c] px-4 py-9 shadow-[0_30px_90px_-55px_rgba(34,211,238,0.55)] backdrop-blur-xl sm:rounded-[2.2rem] sm:px-6 sm:py-12 md:px-8 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(236,72,153,0.18),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_44%,rgba(255,255,255,0.03))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />

      <div className="relative mx-auto grid max-w-6xl gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="text-center lg:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-300/25 bg-pink-400/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-pink-100 shadow-[0_14px_40px_-28px_rgba(236,72,153,0.9)] sm:text-[0.72rem]">
            <Instagram className="size-3.5" />
            Follow @{INSTAGRAM_HANDLE}
          </div>

          <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-normal text-white sm:text-5xl md:text-6xl">
            Deals, pickup help
            <span className="block bg-gradient-to-r from-cyan-200 via-white to-pink-300 bg-clip-text text-transparent">
              and holiday plans
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/70 sm:mt-5 sm:text-lg lg:mx-0">
            Follow us on Instagram and DM us for special offers, quick questions,
            and help arranging your free hotel transfer to and from{" "}
            {displayName}.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-400 px-6 text-sm font-bold text-white shadow-[0_22px_60px_-25px_rgba(236,72,153,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-25px_rgba(34,211,238,0.8)] sm:w-auto"
            >
              <Instagram className="size-4" />
              Open Instagram
              <ArrowUpRight className="size-4" />
            </a>

            <a
              href={`/${clubSlug}/contact`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-6 text-sm font-bold text-white/90 transition hover:-translate-y-0.5 hover:bg-white/[0.1] sm:w-auto"
            >
              <MessageCircle className="size-4 text-cyan-200" />
              Contact us
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-black/24 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-cyan-300/12 text-cyan-200">
              <Car className="size-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              Free transfer
            </p>
            <p className="mt-1 text-lg font-black text-white">
              Hotel pickup and return
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/24 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-pink-300/12 text-pink-200">
              <Sparkles className="size-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              Special deals
            </p>
            <p className="mt-1 text-lg font-black text-white">
              DM us before booking
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/24 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-violet-300/12 text-violet-200">
              <CalendarCheck className="size-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              Easy planning
            </p>
            <p className="mt-1 text-lg font-black text-white">
              Ask us for the best time
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
