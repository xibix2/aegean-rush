// src/components/home/HeroSectionClient.tsx
"use client";

import Link from "next/link";
import { CalendarDays, ShieldCheck, CircleDot } from "lucide-react";
import { useT } from "@/components/I18nProvider";

export function HeroSectionClient({ tenantSlug }: { tenantSlug: string }) {
  const t = useT();

  // Tenant slug is guaranteed by the parent page (app/[club]/page.tsx -> params.club)
  // Build a stable href from props only (no window/path peeking to avoid hydration issues)
  const base = `/${tenantSlug}`;
  const activitiesHref = `${base}/activities`;

  return (
    <section
      className="
        group relative overflow-hidden rounded-3xl
        border border-[--color-border]/40
        bg-[radial-gradient(900px_420px_at_50%_-10%,color-mix(in_oklab,var(--accent-600),transparent_70%),transparent_65%),linear-gradient(180deg,rgba(255,255,255,0.03),color-mix(in_oklab,var(--accent-500),transparent_82%)_40%,rgba(255,255,255,0.02)_100%)]
        shadow-[0_12px_60px_-40px_rgba(0,0,0,0.5)]
        px-6 sm:px-10 py-14 md:py-18 text-center
      "
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes hb-float { 0%{transform:translateY(0)} 50%{transform:translateY(-6px)} 100%{transform:translateY(0)} }
@keyframes hb-drift { from{transform:translateX(-3%) rotate(0)} to{transform:translateX(3%) rotate(1deg)} }
@keyframes hb-orbit { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes hb-pulseSoft { 0%,95%,100%{transform:scale(1)} 50%{transform:scale(1.015)} }
@keyframes hb-glowLine { 0%,100%{opacity:.5; transform:translateX(-50%) scaleX(.9)} 50%{opacity:.95; transform:translateX(-50%) scaleX(1)} }
@keyframes hb-twinkle { 0%,100%{opacity:.08} 50%{opacity:.16} }
@keyframes hb-ambient { 0%,100%{opacity:.12; filter:blur(44px)} 50%{opacity:.2; filter:blur(54px)} }
@keyframes goldenPulse { 0%,100%{opacity:.8} 50%{opacity:1} }
@media (prefers-reduced-motion: reduce){
  .hb-anim, .hb-orbit, .hb-float, .hb-drift, .hb-ambient, .hb-pulse { animation: none !important; }
}
          `.trim(),
        }}
      />

      {/* Floating visuals */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay hb-anim"
          style={{
            animation: "hb-twinkle 6s ease-in-out infinite",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.35'/%3E%3Ccircle cx='20' cy='14' r='1' fill='%23ffffff' fill-opacity='0.3'/%3E%3Ccircle cx='12' cy='26' r='1' fill='%23ffffff' fill-opacity='0.28'/%3E%3Ccircle cx='30' cy='32' r='1' fill='%23ffffff' fill-opacity='0.28'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          className="absolute inset-0 hb-anim"
          style={{ animation: "hb-drift 12s ease-in-out infinite alternate" }}
        >
          {[
            { left: "12%", top: "18%", size: 110, mix: "var(--accent-400)" },
            { left: "78%", top: "24%", size: 140, mix: "var(--accent-300)" },
            { left: "50%", top: "8%", size: 95, mix: "var(--accent-200)" },
            { left: "30%", top: "55%", size: 120, mix: "var(--accent-500)" },
          ].map((p, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle at 30% 30%, color-mix(in oklab, ${p.mix}, transparent 85%), transparent 70%)`,
                animation: `hb-float ${8 + i * 2}s ease-in-out infinite`,
                filter: "blur(6px)",
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-0 right-0 bottom-0 h-20 -z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.35) 60%, rgba(0,0,0,.6) 100%)",
          maskImage: "linear-gradient(180deg, transparent 0%, black 100%)",
        }}
        aria-hidden="true"
      />

      {/* Hero text */}
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.15] transition-transform duration-300 group-hover:-translate-y-[2px]">
        {t("home.hero.title")}
      </h1>
      <p className="mt-3 max-w-2xl mx-auto text-base md:text-lg opacity-85">
        {t("home.hero.subtitle")}
      </p>

      {/* CTA — tenant-aware, SSR-stable */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href={activitiesHref}
          className="btn-accent relative inline-flex h-11 items-center gap-2 px-6 overflow-hidden"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[12px] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,215,130,0.35), rgba(255,200,80,0.1), transparent 70%)",
              filter: "blur(14px)",
              zIndex: 0,
              opacity: 0.85,
              animation: "goldenPulse 6s ease-in-out infinite",
            }}
          />
          <CircleDot className="size-5 relative z-10" />
          <span className="relative z-10">{t("home.hero.cta")}</span>
        </Link>
      </div>

      {/* Trust cues */}
      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm opacity-80">
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="size-4" />
          {t("home.trust.realTime")}
        </div>
        <span className="hidden sm:inline opacity-40">•</span>
        <div className="inline-flex items-center gap-2">
          <ShieldCheck className="size-4" />
          {t("home.trust.secureCheckout")}
        </div>
      </div>
    </section>
  );
}