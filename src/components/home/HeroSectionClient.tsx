// src/components/home/HeroSectionClient.tsx
"use client";

import Link from "next/link";
import {
  CalendarDays,
  ShieldCheck,
  CircleDot,
  MapPin,
  Sparkles,
  TicketPercent,
  Clock3,
} from "lucide-react";
import { useT } from "@/components/I18nProvider";

type HeroSectionClientProps = {
  tenantSlug: string;
  badgeText?: string | null;
  title?: string | null;
  highlightTitle?: string | null;
  subtitle?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  microText?: string | null;
};

export function HeroSectionClient({
  tenantSlug,
  badgeText,
  title,
  highlightTitle,
  subtitle,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  microText,
}: HeroSectionClientProps) {
  const t = useT();

  const base = `/${tenantSlug}`;
  const defaultActivitiesHref = `${base}/activities`;

  const resolvedPrimaryCtaLabel = primaryCtaLabel || "Book now";
  const resolvedPrimaryCtaHref = primaryCtaHref || defaultActivitiesHref;
  const resolvedSecondaryCtaLabel = secondaryCtaLabel || "Find us";
  const resolvedSecondaryCtaHref = secondaryCtaHref || "#meeting-point";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#050816] px-4 py-7 text-white shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)] sm:rounded-[2rem] sm:px-10 sm:py-10 md:px-14 md:py-14">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes heroDrift {
  0% { transform: translateX(0px) translateY(0px) scale(1) }
  50% { transform: translateX(20px) translateY(-12px) scale(1.04) }
  100% { transform: translateX(-10px) translateY(8px) scale(0.98) }
}
@keyframes heroPulse {
  0%,100% { opacity: .45; transform: scale(1) }
  50% { opacity: .8; transform: scale(1.08) }
}
@keyframes heroShimmer {
  0% { transform: translateX(-120%) }
  100% { transform: translateX(120%) }
}
@media (prefers-reduced-motion: reduce), (max-width: 768px) {
  .hero-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.24),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(56,189,248,0.18),transparent_28%),linear-gradient(180deg,#07111f_0%,#050816_58%,#03050d_100%)]" />

        <div
          className="hero-anim absolute -left-24 top-[-7rem] h-[18rem] w-[18rem] rounded-full blur-3xl sm:-left-20 sm:top-[-6rem] sm:h-[22rem] sm:w-[22rem]"
          style={{
            background:
              "radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(236,72,153,0.08) 45%, transparent 72%)",
            animation: "heroDrift 14s ease-in-out infinite",
          }}
        />

        <div
          className="hero-anim absolute right-[-7rem] top-[1rem] h-[16rem] w-[16rem] rounded-full blur-3xl sm:right-[-5rem] sm:top-[2rem] sm:h-[20rem] sm:w-[20rem]"
          style={{
            background:
              "radial-gradient(circle, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0.06) 45%, transparent 72%)",
            animation: "heroPulse 11s ease-in-out infinite",
          }}
        />

        <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-t from-black/55 via-slate-950/25 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.055] px-4 py-6 shadow-[0_24px_90px_-55px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:px-8 sm:py-8 md:px-10 md:py-10">
          <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100 backdrop-blur-xl sm:mb-5 sm:px-4 sm:text-xs">
            <TicketPercent className="size-3.5 shrink-0 text-emerald-200" />
            <span className="truncate">May online offer</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-[2.45rem] font-black uppercase leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="block">10% OFF</span>
            <span className="mt-1 block bg-gradient-to-r from-emerald-200 via-cyan-100 to-pink-200 bg-clip-text text-transparent">
              Online Bookings
            </span>
          </h1>

          <div className="mx-auto mt-5 flex max-w-xl flex-col items-center justify-center gap-2 sm:mt-6 sm:flex-row">
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white/82 sm:w-auto">
              <Sparkles className="size-4 text-pink-300" />
              Use code
              <span className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 font-bold tracking-[0.12em] text-emerald-100">
                MAY10
              </span>
            </div>

            <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white/82 sm:w-auto">
              <Clock3 className="size-4 text-cyan-300" />
              Skip the waiting line
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/72 sm:text-base md:text-lg">
            Book online, secure your spot before you arrive, and spend more time
            enjoying the sea instead of waiting.
          </p>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <Link
              href={resolvedPrimaryCtaHref}
              className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-xl border border-pink-300/20 bg-gradient-to-r from-pink-500 to-fuchsia-500 px-5 text-sm font-medium text-white shadow-[0_10px_40px_-12px_rgba(236,72,153,0.75)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_18px_60px_-16px_rgba(236,72,153,0.85)] sm:h-11 sm:w-auto sm:px-6 sm:text-base"
            >
              <span
                className="hero-anim absolute inset-0 opacity-40"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                  animation: "heroShimmer 3.8s linear infinite",
                }}
              />
              <CircleDot className="relative z-10 mr-2 size-4" />
              <span className="relative z-10">{resolvedPrimaryCtaLabel}</span>
            </Link>

            <a
              href={resolvedSecondaryCtaHref}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/12 bg-white/6 px-5 text-sm font-medium text-white/88 backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:bg-white/10 sm:h-11 sm:w-auto sm:px-6 sm:text-base"
            >
              <MapPin className="mr-2 size-4" />
              {resolvedSecondaryCtaLabel}
            </a>
          </div>

          <p className="mt-3 text-xs text-white/50">
            Offer valid for online bookings during May.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur-xl sm:px-3.5 sm:text-xs">
            <CalendarDays className="size-3.5 text-cyan-300" />
            {t("home.trust.realTime")}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur-xl sm:px-3.5 sm:text-xs">
            <ShieldCheck className="size-3.5 text-pink-300" />
            {t("home.trust.secureCheckout")}
          </div>
        </div>
      </div>
    </section>
  );
}