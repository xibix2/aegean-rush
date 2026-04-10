// src/components/home/HeroSectionClient.tsx
"use client";

import Link from "next/link";
import { CalendarDays, ShieldCheck, CircleDot, MapPin } from "lucide-react";
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

  const resolvedTitle = title || "Book your next Aegean experience in seconds.";
  const resolvedHighlightTitle = highlightTitle || "Ride the sea. Feel the rush.";
  const resolvedSubtitle =
    subtitle || "Real-time availability. Secure booking. Instant confirmation.";
  const resolvedPrimaryCtaLabel = primaryCtaLabel || "Explore experiences";
  const resolvedPrimaryCtaHref = primaryCtaHref || defaultActivitiesHref;
  const resolvedSecondaryCtaLabel = secondaryCtaLabel || "Find us";
  const resolvedSecondaryCtaHref = secondaryCtaHref || "#meeting-point";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050816] px-6 py-8 text-white shadow-[0_30px_120px_-40px_rgba(0,0,0,0.8)] sm:px-10 md:px-14 md:py-10">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes heroDrift {
  0% { transform: translateX(0px) translateY(0px) scale(1) }
  50% { transform: translateX(16px) translateY(-8px) scale(1.03) }
  100% { transform: translateX(-8px) translateY(6px) scale(0.99) }
}
@keyframes heroPulse {
  0%,100% { opacity: .35; transform: scale(1) }
  50% { opacity: .6; transform: scale(1.05) }
}
@keyframes heroBeam {
  0%,100% { opacity: .12; transform: translateX(0) }
  50% { opacity: .22; transform: translateX(14px) }
}
@keyframes heroShimmer {
  0% { transform: translateX(-120%) }
  100% { transform: translateX(120%) }
}
@keyframes heroWave {
  0%,100% { transform: translateX(0) translateY(0) }
  50% { transform: translateX(-14px) translateY(6px) }
}
@media (prefers-reduced-motion: reduce) {
  .hero-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.12),transparent_26%),linear-gradient(180deg,#07111f_0%,#050816_58%,#03050d_100%)]" />

        <div
          className="hero-anim absolute -left-20 top-[-7rem] h-[18rem] w-[18rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(236,72,153,0.18) 0%, rgba(236,72,153,0.05) 45%, transparent 72%)",
            animation: "heroDrift 14s ease-in-out infinite",
          }}
        />

        <div
          className="hero-anim absolute right-[-4rem] top-[1rem] h-[16rem] w-[16rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(34,211,238,0.14) 0%, rgba(34,211,238,0.05) 45%, transparent 72%)",
            animation: "heroPulse 11s ease-in-out infinite",
          }}
        />

        <div
          className="hero-anim absolute inset-x-0 bottom-0 h-[28%] opacity-60"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(18,35,62,0.16) 20%, rgba(12,26,49,0.34) 50%, rgba(7,13,24,0.88) 100%)",
            animation: "heroWave 10s ease-in-out infinite",
            clipPath:
              "polygon(0 60%, 8% 56%, 16% 61%, 24% 55%, 32% 60%, 40% 54%, 48% 59%, 56% 53%, 64% 58%, 72% 54%, 80% 60%, 88% 55%, 100% 61%, 100% 100%, 0 100%)",
          }}
        />

        <div
          className="hero-anim absolute left-1/2 top-0 h-full w-[120%] -translate-x-1/2 opacity-20 blur-2xl"
          style={{
            background:
              "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.08) 45%, transparent 70%)",
            animation: "heroBeam 8s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold leading-[1.04] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          <span className="block">{resolvedTitle}</span>
          <span className="mt-1.5 block bg-gradient-to-r from-cyan-200 via-white to-pink-300 bg-clip-text text-transparent">
            {resolvedHighlightTitle}
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/72 md:text-base">
          {resolvedSubtitle}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={resolvedPrimaryCtaHref}
            className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl border border-pink-300/20 bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 font-medium text-white shadow-[0_10px_40px_-12px_rgba(236,72,153,0.75)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_18px_60px_-16px_rgba(236,72,153,0.85)]"
          >
            <span
              className="absolute inset-0 opacity-35"
              style={{
                background:
                  "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
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

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
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