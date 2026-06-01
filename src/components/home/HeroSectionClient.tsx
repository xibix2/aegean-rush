// src/components/home/HeroSectionClient.tsx
"use client";

import Link from "next/link";
import {
  CalendarDays,
  ShieldCheck,
  CircleDot,
  MapPin,
  Sparkles,
  Clock3,
  Zap,
  TimerReset,
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
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: HeroSectionClientProps) {
  const t = useT();

  const base = `/${tenantSlug}`;
  const defaultActivitiesHref = `${base}/activities`;

  const resolvedPrimaryCtaLabel = primaryCtaLabel || "View activities";
  const resolvedPrimaryCtaHref = primaryCtaHref || defaultActivitiesHref;
  const resolvedSecondaryCtaLabel = secondaryCtaLabel || "Find our location";
  const resolvedSecondaryCtaHref = secondaryCtaHref || "#meeting-point";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#050816] px-3 py-4 text-white shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)] sm:rounded-[2rem] sm:px-8 sm:py-8 md:px-10 md:py-10">
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(236,72,153,0.25),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(56,189,248,0.22),transparent_30%),linear-gradient(180deg,#07111f_0%,#050816_58%,#03050d_100%)]" />

        <div
          className="hero-anim absolute -left-24 top-[-7rem] h-[18rem] w-[18rem] rounded-full blur-3xl sm:-left-20 sm:top-[-6rem] sm:h-[22rem] sm:w-[22rem]"
          style={{
            background:
              "radial-gradient(circle, rgba(236,72,153,0.26) 0%, rgba(236,72,153,0.08) 45%, transparent 72%)",
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

        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 via-slate-950/35 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/35 shadow-[0_28px_110px_-55px_rgba(0,0,0,0.95)] backdrop-blur-xl md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative px-5 py-7 text-center sm:px-8 md:px-10 md:py-10 md:text-left">
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-pink-300/25 bg-pink-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-pink-100 sm:text-xs">
              <TimerReset className="size-3.5 shrink-0" />
              <span className="truncate">Skip the queue — book online</span>
            </div>

            <h1 className="text-[3.05rem] font-black uppercase leading-[0.82] tracking-[-0.075em] text-white sm:text-7xl md:text-8xl">
              <span className="block">Save</span>
              <span className="block bg-gradient-to-r from-pink-400 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
                Time
              </span>
            </h1>

            <div className="mt-3 inline-block -rotate-1 bg-cyan-300 px-4 py-1.5 text-2xl font-black uppercase tracking-tight text-[#06101c] shadow-[0_14px_45px_-22px_rgba(34,211,238,0.9)] sm:text-4xl">
              Book Before You Arrive
            </div>

            <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap md:justify-start">
              <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/85">
                <Sparkles className="size-4 text-pink-300" />
                Secure your spot
                <span className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 font-black tracking-[0.12em] text-cyan-100">
                  ONLINE
                </span>
              </div>

              <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/85">
                <Clock3 className="size-4 text-cyan-300" />
                Skip the line
              </div>
            </div>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/70 md:mx-0 md:text-base">
              Reserve your activity online before you arrive. Skip the queue,
              secure your spot, and spend more time on the water.
            </p>

            <div className="mt-6 grid gap-2.5 sm:flex md:justify-start">
              <Link
                href={resolvedPrimaryCtaHref}
                className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-7 text-sm font-bold text-white shadow-[0_18px_55px_-18px_rgba(236,72,153,0.9)] transition hover:scale-[1.03]"
              >
                <span
                  className="hero-anim absolute inset-0 opacity-40"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                    animation: "heroShimmer 3.8s linear infinite",
                  }}
                />
                <CircleDot className="relative mr-2 size-4" />
                <span className="relative">{resolvedPrimaryCtaLabel}</span>
              </Link>

              <a
                href={resolvedSecondaryCtaHref}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.08] px-7 text-sm font-bold text-white/88 transition hover:bg-white/12"
              >
                <MapPin className="mr-2 size-4" />
                {resolvedSecondaryCtaLabel}
              </a>
            </div>

            <p className="mt-4 text-xs text-white/45">
              Online booking gives you real-time availability, secure checkout,
              and instant confirmation.
            </p>
          </div>

          <div className="relative hidden min-h-[430px] overflow-hidden md:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(236,72,153,0.36),transparent_28%),radial-gradient(circle_at_45%_55%,rgba(34,211,238,0.28),transparent_34%),linear-gradient(135deg,#07111f,#04101d_55%,#021827)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-500/25 to-transparent" />

            <div className="absolute right-8 top-10 rounded-full border border-pink-300/25 bg-black/35 px-7 py-6 text-center shadow-[0_0_45px_rgba(236,72,153,0.25)]">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-pink-200">
                Skip
              </div>
              <div className="text-5xl font-black tracking-[-0.08em] text-white">
                The
              </div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-pink-200">
                Queue
              </div>
            </div>

            <div className="absolute bottom-12 right-10 h-48 w-72 rotate-[-8deg] rounded-[3rem] border border-cyan-200/20 bg-gradient-to-br from-cyan-300/35 via-sky-500/20 to-black/20 shadow-[0_35px_90px_-35px_rgba(34,211,238,0.9)]" />
            <div className="absolute bottom-20 right-24 h-20 w-28 rotate-[-8deg] rounded-full bg-black/45 blur-sm" />
            <div className="absolute bottom-24 right-28 text-7xl drop-shadow-[0_0_25px_rgba(34,211,238,0.45)]">
              🌊
            </div>
            <div className="absolute bottom-32 right-36 text-7xl drop-shadow-[0_0_25px_rgba(236,72,153,0.35)]">
              🏄
            </div>

            <div className="absolute bottom-8 left-8 right-8 grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <div className="text-center">
                <CalendarDays className="mx-auto size-5 text-cyan-300" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">
                  Real-time
                </p>
              </div>
              <div className="text-center">
                <ShieldCheck className="mx-auto size-5 text-pink-300" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">
                  Secure
                </p>
              </div>
              <div className="text-center">
                <Zap className="mx-auto size-5 text-cyan-200" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">
                  Instant
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 hidden flex-wrap items-center justify-center gap-2 sm:mt-5 md:flex">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur-xl sm:px-3.5 sm:text-xs">
            <CalendarDays className="size-3.5 text-cyan-300" />
            {t("home.trust.realTime")}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur-xl sm:px-3.5 sm:text-xs">
            <ShieldCheck className="size-3.5 text-pink-300" />
            {t("home.trust.secureCheckout")}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur-xl sm:px-3.5 sm:text-xs">
            <Zap className="size-3.5 text-cyan-200" />
            Instant confirmation
          </div>
        </div>
      </div>
    </section>
  );
}