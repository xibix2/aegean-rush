// src/components/home/FinalCtaSectionClient.tsx
"use client";

import type { ComponentType } from "react";
import {
  ArrowRight,
  Sparkles,
  Waves,
  Star,
  Phone,
  MapPin,
  ShieldCheck,
  Clock3,
  MessageCircle,
  Ticket,
} from "lucide-react";

type FinalCtaSectionClientProps = {
  clubSlug: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
};

type TrustItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const DEFAULT_TRUST_ITEMS: TrustItem[] = [
  { label: "Instant booking", icon: Clock3 },
  { label: "Secure checkout", icon: ShieldCheck },
  { label: "Premium experiences", icon: Star },
  { label: "Fast support", icon: MessageCircle },
];

function isContactHref(href: string | null | undefined) {
  if (!href) return false;

  return (
    href.startsWith("tel:") ||
    href.startsWith("mailto:") ||
    href.includes("wa.me") ||
    href.includes("whatsapp") ||
    href.includes("/contact") ||
    href.includes("#contact")
  );
}

function isHashHref(href: string | null | undefined) {
  return typeof href === "string" && href.startsWith("#");
}

function smoothScrollToId(id: string, offset = 120, duration = 1100) {
  const target = document.getElementById(id);
  if (!target) return;

  const startY = window.scrollY;
  const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
  const distance = targetY - startY;
  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    window.scrollTo({
      top: startY + distance * eased,
      behavior: "auto",
    });

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

export function FinalCtaSectionClient({
  clubSlug,
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

  const resolvedSecondaryLabel = secondaryCtaLabel || "View meeting point";
  const resolvedSecondaryHref = secondaryCtaHref || "#meeting-point";

  const derivedContactLabel = "Contact us";

  const derivedContactHref = isContactHref(secondaryCtaHref)
    ? secondaryCtaHref || `/${clubSlug}/contact`
    : `/${clubSlug}/contact`;

  const showSecondaryAsLocation = !isContactHref(secondaryCtaHref);

  const handleInternalJump = (href: string) => {
    const id = href.replace(/^#/, "");
    smoothScrollToId(id, 96, 900);
  };

  const primaryButtonClass =
    "cta-anim group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-sm font-medium text-white shadow-[0_22px_65px_-22px_rgba(236,72,153,0.85)] transition hover:scale-[1.03] hover:shadow-[0_28px_80px_-22px_rgba(236,72,153,0.95)] sm:w-auto md:h-14 md:px-8 md:text-base";

  const secondaryButtonClass =
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white/88 shadow-[0_16px_40px_-30px_rgba(56,189,248,0.55)] transition hover:-translate-y-0.5 hover:bg-white/[0.08] sm:w-auto md:h-14 md:px-8 md:text-base";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070b16] px-4 py-10 backdrop-blur-xl sm:rounded-[2.35rem] sm:px-6 sm:py-14 md:px-8 md:py-20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes ctaGlowMain {
  0%,100% { opacity: .28; transform: scale(1) translateY(0px); }
  50% { opacity: .5; transform: scale(1.08) translateY(-8px); }
}
@keyframes ctaGlowFloat {
  0%,100% { opacity: .16; transform: translateY(0px); }
  50% { opacity: .3; transform: translateY(-14px); }
}
@keyframes ctaLineMove {
  0% { transform: translateX(-10px); opacity: .12; }
  50% { transform: translateX(10px); opacity: .22; }
  100% { transform: translateX(-10px); opacity: .12; }
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
  0%,100% { transform: scale(1); opacity: .82; }
  50% { transform: scale(1.14); opacity: 1; }
}
@keyframes ctaChipIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ctaHelperGlow {
  0%,100% { opacity: .12; }
  50% { opacity: .24; }
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
        className="cta-anim pointer-events-none absolute left-1/2 top-0 h-44 w-[92%] -translate-x-1/2 blur-3xl sm:h-64 sm:w-[78%]"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.24) 0%, rgba(168,85,247,0.18) 32%, rgba(56,189,248,0.16) 56%, transparent 76%)",
          animation: "ctaGlowMain 9s ease-in-out infinite",
        }}
      />

      <div
        className="cta-anim pointer-events-none absolute left-[2%] top-[18%] h-32 w-32 rounded-full blur-3xl sm:left-[4%] sm:h-44 sm:w-44"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.16) 0%, transparent 72%)",
          animation: "ctaGlowFloat 12s ease-in-out infinite",
        }}
      />

      <div
        className="cta-anim pointer-events-none absolute right-[2%] bottom-[12%] h-36 w-36 rounded-full blur-3xl sm:right-[4%] sm:h-48 sm:w-48"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.16) 0%, transparent 72%)",
          animation: "ctaGlowFloat 14s ease-in-out infinite",
        }}
      />

      <div
        className="cta-anim pointer-events-none absolute left-[22%] bottom-[8%] h-28 w-28 rounded-full blur-3xl sm:h-36 sm:w-36"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 72%)",
          animation: "ctaGlowFloat 13s ease-in-out infinite",
        }}
      />

      <div
        className="cta-anim pointer-events-none absolute inset-0 opacity-[0.08] sm:opacity-[0.12]"
        style={{
          background:
            "repeating-linear-gradient(115deg, transparent 0px, transparent 26px, rgba(255,255,255,0.05) 27px, transparent 28px)",
          animation: "ctaLineMove 10s ease-in-out infinite",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_46%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_40%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white/72 shadow-[0_12px_34px_-18px_rgba(236,72,153,0.45)] backdrop-blur-xl sm:mb-5 sm:px-4 sm:text-xs sm:tracking-[0.18em]">
          <Sparkles className="size-3.5 shrink-0 text-pink-300" />
          <span className="truncate">Ready when you are</span>
        </div>

        <div className="mx-auto mb-5 flex max-w-xs items-center justify-center gap-3 text-white/45 sm:mb-6 sm:max-w-sm sm:gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-400/35 to-transparent" />
          <div
            className="cta-anim inline-flex items-center gap-2"
            style={{ animation: "ctaOrbPulse 4s ease-in-out infinite" }}
          >
            <Waves className="size-4 text-sky-300" />
            <Star className="size-3.5 text-fuchsia-300" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-400/35 to-transparent" />
        </div>

        <h2 className="mx-auto max-w-4xl text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-6xl">
          {title || "Ready to book your experience?"}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:mt-5 md:text-lg">
          {subtitle || "Choose your activity and secure your spot in seconds."}
        </p>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/56 sm:mt-4 md:text-base">
          {body ||
            "Pick your activity, choose your preferred time, and secure your place in just a few steps."}
        </p>

        <div className="mt-7 grid gap-2.5 sm:mt-9 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          {isHashHref(resolvedPrimaryHref) ? (
            <button
              type="button"
              onClick={() => handleInternalJump(resolvedPrimaryHref)}
              className={primaryButtonClass}
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
            </button>
          ) : (
            <a
              href={resolvedPrimaryHref}
              className={primaryButtonClass}
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
          )}

          {showSecondaryAsLocation ? (
            isHashHref(resolvedSecondaryHref) ? (
              <button
                type="button"
                onClick={() => handleInternalJump(resolvedSecondaryHref)}
                className={secondaryButtonClass}
              >
                <MapPin className="size-4 text-sky-300" />
                {resolvedSecondaryLabel}
              </button>
            ) : (
              <a href={resolvedSecondaryHref} className={secondaryButtonClass}>
                <MapPin className="size-4 text-sky-300" />
                {resolvedSecondaryLabel}
              </a>
            )
          ) : null}

          <a
            href={derivedContactHref}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white/88 shadow-[0_16px_40px_-30px_rgba(236,72,153,0.45)] transition hover:-translate-y-0.5 hover:bg-white/[0.08] sm:w-auto md:h-14 md:px-8 md:text-base"
          >
            <Phone className="size-4 text-pink-300" />
            {derivedContactLabel}
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-7 md:gap-4">
          {DEFAULT_TRUST_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="cta-anim inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white/66 backdrop-blur-xl sm:text-xs md:px-4"
                style={{
                  animation: `ctaChipIn 650ms cubic-bezier(0.22,1,0.36,1) ${
                    index * 90
                  }ms both`,
                }}
              >
                <Icon className="size-3.5 text-white/80" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="relative mx-auto mt-7 max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center backdrop-blur-xl sm:mt-8 sm:rounded-[1.6rem] sm:px-5 md:px-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-20 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(56,189,248,0.10) 0%, rgba(236,72,153,0.10) 48%, transparent 75%)",
              animation: "ctaHelperGlow 6s ease-in-out infinite",
            }}
          />

          <p className="relative text-sm font-medium text-white/88 md:text-base">
            Still unsure which experience fits you best?
          </p>
          <p className="relative mt-2 text-sm leading-relaxed text-white/58">
            Reach out and get help choosing the right activity, timing, or
            meeting point before you book.
          </p>

          <div className="relative mt-4 grid gap-2.5 sm:flex sm:items-center sm:justify-center sm:gap-3">
            <a
              href={derivedContactHref}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-5 text-sm font-medium text-white/85 transition hover:bg-white/[0.06] sm:w-auto"
            >
              <MessageCircle className="size-4 text-pink-300" />
              Talk to us
            </a>

            <a
              href={`/${clubSlug}/manage-booking`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-5 text-sm font-medium text-white/78 transition hover:bg-white/[0.06] sm:w-auto"
            >
              <Ticket className="size-4 text-sky-300" />
              Manage booking
            </a>

            <button
              type="button"
              onClick={() => handleInternalJump("#faq")}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-black/20 px-5 text-sm font-medium text-white/72 transition hover:bg-white/[0.06] sm:w-auto"
            >
              View FAQ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}