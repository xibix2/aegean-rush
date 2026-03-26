"use client";

import { ArrowRight, Sparkles, Waves, Star } from "lucide-react";

type FinalCtaSectionClientProps = {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
};

export function FinalCtaSectionClient({
  title,
  subtitle,
  body,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: FinalCtaSectionClientProps) {
  const resolvedPrimaryLabel = primaryCtaLabel || "Explore experiences";
  const resolvedPrimaryHref = primaryCtaHref || "#courts";

  const resolvedSecondaryLabel = secondaryCtaLabel || "Find meeting point";
  const resolvedSecondaryHref = secondaryCtaHref || "#meeting-point";

  return (
    <section className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[#070b16] px-5 py-14 backdrop-blur-xl sm:px-6 md:px-8 md:py-20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes ctaGlowMain {
  0%,100% { opacity: .26; transform: scale(1) translateY(0px); }
  50% { opacity: .46; transform: scale(1.08) translateY(-8px); }
}
@keyframes ctaGlowFloat {
  0%,100% { opacity: .16; transform: translateY(0px); }
  50% { opacity: .3; transform: translateY(-14px); }
}
@keyframes ctaLineMove {
  0% { transform: translateX(-8px); opacity: .12; }
  50% { transform: translateX(8px); opacity: .22; }
  100% { transform: translateX(-8px); opacity: .12; }
}
@keyframes ctaButtonFloat {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
@keyframes ctaShimmer {
  0% { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
  20% { opacity: .08; }
  50% { opacity: .16; }
  100% { transform: translateX(140%) skewX(-18deg); opacity: 0; }
}
@keyframes ctaOrbPulse {
  0%,100% { transform: scale(1); opacity: .8; }
  50% { transform: scale(1.14); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .cta-anim {
    animation: none !important;
    transition: none !important;
  }
}
          `.trim(),
        }}
      />

      <div
        className="cta-anim pointer-events-none absolute left-1/2 top-0 h-64 w-[78%] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.24) 0%, rgba(168,85,247,0.18) 32%, rgba(56,189,248,0.16) 56%, transparent 76%)",
          animation: "ctaGlowMain 9s ease-in-out infinite",
        }}
      />
      <div
        className="cta-anim pointer-events-none absolute left-[4%] top-[18%] h-44 w-44 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.16) 0%, transparent 72%)",
          animation: "ctaGlowFloat 12s ease-in-out infinite",
        }}
      />
      <div
        className="cta-anim pointer-events-none absolute right-[4%] bottom-[12%] h-48 w-48 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.16) 0%, transparent 72%)",
          animation: "ctaGlowFloat 14s ease-in-out infinite",
        }}
      />
      <div
        className="cta-anim pointer-events-none absolute left-[22%] bottom-[8%] h-36 w-36 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 72%)",
          animation: "ctaGlowFloat 13s ease-in-out infinite",
        }}
      />

      <div
        className="cta-anim pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background:
            "repeating-linear-gradient(115deg, transparent 0px, transparent 26px, rgba(255,255,255,0.05) 27px, transparent 28px)",
          animation: "ctaLineMove 10s ease-in-out infinite",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_46%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_40%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/72 shadow-[0_12px_34px_-18px_rgba(236,72,153,0.45)] backdrop-blur-xl">
          <Sparkles className="size-3.5 text-pink-300" />
          Ready when you are
        </div>

        <div className="mx-auto mb-6 flex max-w-sm items-center justify-center gap-4 text-white/45">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-400/35 to-transparent" />
          <div className="cta-anim inline-flex items-center gap-2" style={{ animation: "ctaOrbPulse 4s ease-in-out infinite" }}>
            <Waves className="size-4 text-sky-300" />
            <Star className="size-3.5 text-fuchsia-300" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-400/35 to-transparent" />
        </div>

        <h2 className="mx-auto max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-6xl">
          {title || "Ready to book your experience?"}
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/70 md:text-lg">
          {subtitle ||
            "Choose your activity and secure your spot in seconds."}
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/56 md:text-base">
          {body ||
            "Pick your activity, choose your preferred time, and secure your place in just a few steps."}
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a
            href={resolvedPrimaryHref}
            className="cta-anim group relative inline-flex h-13 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-7 text-sm font-medium text-white shadow-[0_22px_65px_-22px_rgba(236,72,153,0.85)] transition hover:scale-[1.03] hover:shadow-[0_28px_80px_-22px_rgba(236,72,153,0.95)] md:h-14 md:px-8 md:text-base"
            style={{ animation: "ctaButtonFloat 4.8s ease-in-out infinite" }}
          >
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(120deg, transparent 18%, rgba(255,255,255,0.18) 50%, transparent 82%)",
                animation: "ctaShimmer 4s linear infinite",
              }}
            />
            <span className="relative">{resolvedPrimaryLabel}</span>
            <ArrowRight className="relative size-4 transition group-hover:translate-x-0.5" />
          </a>

          {secondaryCtaLabel ? (
            <a
              href={resolvedSecondaryHref}
              className="inline-flex h-13 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] px-7 text-sm font-medium text-white/88 shadow-[0_16px_40px_-30px_rgba(56,189,248,0.55)] transition hover:-translate-y-0.5 hover:bg-white/[0.08] md:h-14 md:px-8 md:text-base"
            >
              {resolvedSecondaryLabel}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}