"use client";

import { ArrowRight, Sparkles } from "lucide-react";

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
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0b0d14] px-5 py-12 backdrop-blur-xl sm:px-6 md:px-8 md:py-16">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes finalCtaGlowA {
  0%,100% { opacity: .22; transform: scale(1); }
  50% { opacity: .38; transform: scale(1.06); }
}
@keyframes finalCtaGlowB {
  0%,100% { opacity: .18; transform: translateY(0px); }
  50% { opacity: .28; transform: translateY(-12px); }
}
@keyframes finalCtaFloat {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
@media (prefers-reduced-motion: reduce) {
  .finalcta-anim {
    animation: none !important;
    transition: none !important;
  }
}
          `.trim(),
        }}
      />

      <div
        className="finalcta-anim pointer-events-none absolute left-1/2 top-0 h-56 w-[72%] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.20) 0%, rgba(168,85,247,0.16) 36%, rgba(56,189,248,0.12) 58%, transparent 75%)",
          animation: "finalCtaGlowA 9s ease-in-out infinite",
        }}
      />
      <div
        className="finalcta-anim pointer-events-none absolute left-[6%] top-[18%] h-40 w-40 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 72%)",
          animation: "finalCtaGlowB 11s ease-in-out infinite",
        }}
      />
      <div
        className="finalcta-anim pointer-events-none absolute right-[6%] bottom-[10%] h-44 w-44 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 72%)",
          animation: "finalCtaGlowB 13s ease-in-out infinite",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_40%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
          <Sparkles className="size-3.5 text-pink-300" />
          Ready when you are
        </div>

        <h2 className="mx-auto max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
          {title || "Ready to book your next Aegean experience?"}
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/68 md:text-base">
          {subtitle ||
            "Clear availability, instant booking, and a smoother guest experience from the very first click."}
        </p>

        {body ? (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/54 md:text-base">
            {body}
          </p>
        ) : (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/54 md:text-base">
            Pick your activity, choose your preferred time, and secure your place in just a few steps.
          </p>
        )}

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a
            href={resolvedPrimaryHref}
            className="finalcta-anim inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-sm font-medium text-white shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] transition hover:scale-[1.02] hover:shadow-[0_22px_65px_-18px_rgba(236,72,153,0.9)]"
            style={{ animation: "finalCtaFloat 4.5s ease-in-out infinite" }}
          >
            <span>{resolvedPrimaryLabel}</span>
            <ArrowRight className="size-4" />
          </a>

          {secondaryCtaLabel ? (
            <a
              href={resolvedSecondaryHref}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 text-sm font-medium text-white/88 transition hover:bg-white/[0.08]"
            >
              {resolvedSecondaryLabel}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}