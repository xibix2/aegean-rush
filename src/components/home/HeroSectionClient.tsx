// src/components/home/HeroSectionClient.tsx
"use client";

import Link from "next/link";
import {
  CalendarDays,
  ShieldCheck,
  CircleDot,
  MapPin,
  Sparkles,
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

  const resolvedBadgeText = badgeText || "Aegean thrill experiences";
  const resolvedTitle = title || "Book your next Aegean experience in seconds.";
  const resolvedHighlightTitle = highlightTitle || "Ride the sea. Feel the rush.";
  const resolvedSubtitle =
    subtitle || "Real-time availability. Secure booking. Instant confirmation.";
  const resolvedPrimaryCtaLabel = primaryCtaLabel || "Explore experiences";
  const resolvedPrimaryCtaHref = primaryCtaHref || defaultActivitiesHref;
  const resolvedSecondaryCtaLabel = secondaryCtaLabel || "Find us";
  const resolvedSecondaryCtaHref = secondaryCtaHref || "#meeting-point";
  const resolvedMicroText = microText || "No calls. No waiting. Book instantly.";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050816] px-6 py-10 text-white shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)] sm:px-10 md:px-14 md:py-14">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes heroFloat {
  0%,100% { transform: translateY(0px) }
  50% { transform: translateY(-10px) }
}
@keyframes heroDrift {
  0% { transform: translateX(0px) translateY(0px) scale(1) }
  50% { transform: translateX(20px) translateY(-12px) scale(1.04) }
  100% { transform: translateX(-10px) translateY(8px) scale(0.98) }
}
@keyframes heroPulse {
  0%,100% { opacity: .45; transform: scale(1) }
  50% { opacity: .8; transform: scale(1.08) }
}
@keyframes heroBeam {
  0%,100% { opacity: .18; transform: translateX(0) }
  50% { opacity: .3; transform: translateX(18px) }
}
@keyframes heroShimmer {
  0% { transform: translateX(-120%) }
  100% { transform: translateX(120%) }
}
@keyframes heroWave {
  0%,100% { transform: translateX(0) translateY(0) }
  50% { transform: translateX(-18px) translateY(8px) }
}
@keyframes heroSpinSlow {
  from { transform: rotate(0deg) }
  to { transform: rotate(360deg) }
}
@media (prefers-reduced-motion: reduce) {
  .hero-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.22),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,#07111f_0%,#050816_58%,#03050d_100%)]" />

        <div
          className="hero-anim absolute -left-20 top-[-6rem] h-[22rem] w-[22rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(236,72,153,0.24) 0%, rgba(236,72,153,0.08) 45%, transparent 72%)",
            animation: "heroDrift 14s ease-in-out infinite",
          }}
        />

        <div
          className="hero-anim absolute right-[-5rem] top-[2rem] h-[20rem] w-[20rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0.06) 45%, transparent 72%)",
            animation: "heroPulse 11s ease-in-out infinite",
          }}
        />

        <div
          className="hero-anim absolute inset-x-0 bottom-0 h-[34%] opacity-70"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(18,35,62,0.18) 20%, rgba(12,26,49,0.42) 50%, rgba(7,13,24,0.92) 100%)",
            animation: "heroWave 10s ease-in-out infinite",
            clipPath:
              "polygon(0 60%, 8% 56%, 16% 61%, 24% 55%, 32% 60%, 40% 54%, 48% 59%, 56% 53%, 64% 58%, 72% 54%, 80% 60%, 88% 55%, 100% 61%, 100% 100%, 0 100%)",
          }}
        />

        <div
          className="hero-anim absolute left-1/2 top-0 h-full w-[120%] -translate-x-1/2 opacity-20 blur-2xl"
          style={{
            background:
              "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.12) 45%, transparent 70%)",
            animation: "heroBeam 8s ease-in-out infinite",
          }}
        />

        <div className="absolute inset-0 opacity-[0.09] mix-blend-screen">
          <div
            className="hero-anim absolute inset-0"
            style={{
              animation: "heroSpinSlow 80s linear infinite",
              backgroundImage:
                "radial-gradient(circle at 20% 25%, white 0 1px, transparent 1.5px), radial-gradient(circle at 72% 32%, white 0 1px, transparent 1.5px), radial-gradient(circle at 40% 68%, white 0 1px, transparent 1.5px), radial-gradient(circle at 82% 72%, white 0 1px, transparent 1.5px), radial-gradient(circle at 58% 18%, white 0 1px, transparent 1.5px)",
            }}
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur-xl">
          <Sparkles className="size-3.5 text-pink-300" />
          {resolvedBadgeText}
        </div>

        <h1 className="text-3xl font-semibold leading-[1.03] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          <span className="block">{resolvedTitle}</span>
          <span className="mt-1.5 block bg-gradient-to-r from-cyan-200 via-white to-pink-300 bg-clip-text text-transparent">
            {resolvedHighlightTitle}
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72 md:text-base">
          {resolvedSubtitle}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={resolvedPrimaryCtaHref}
            className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl border border-pink-300/20 bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 font-medium text-white shadow-[0_10px_40px_-12px_rgba(236,72,153,0.75)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_18px_60px_-16px_rgba(236,72,153,0.85)]"
          >
            <span
              className="absolute inset-0 opacity-40"
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
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/12 bg-white/6 px-6 font-medium text-white/88 backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:bg-white/10"
          >
            <MapPin className="mr-2 size-4" />
            {resolvedSecondaryCtaLabel}
          </a>
        </div>

        <p className="mt-2 text-xs text-white/50">{resolvedMicroText}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-xs text-white/80 backdrop-blur-xl">
            <CalendarDays className="size-3.5 text-cyan-300" />
            {t("home.trust.realTime")}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-xs text-white/80 backdrop-blur-xl">
            <ShieldCheck className="size-3.5 text-pink-300" />
            {t("home.trust.secureCheckout")}
          </div>
        </div>
      </div>
    </section>
  );
}