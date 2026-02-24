"use client";

import { useT } from "@/components/I18nProvider";

export function CourtsHeaderClient() {
  const t = useT();

  return (
    <>
      {/* ambient stage light */}
      <div
        className="pointer-events-none absolute left-1/2 top-6 h-28 w-[72%] -translate-x-1/2 rounded-full"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 50%, color-mix(in oklab, var(--accent-500) 24%, transparent), color-mix(in oklab, var(--accent-400) 18%, transparent) 45%, transparent 70%)",
          animation: "hb-ambient 10s ease-in-out infinite",
          filter: "blur(48px)",
        }}
      />

      <div className="relative inline-flex flex-col items-center z-10">
        <h2
          className="text-3xl md:text-[32px] font-semibold tracking-tight t-anim"
          style={{ animation: "adminTitlePulse 6s ease-in-out infinite" }}
          aria-label={t("home.courts.label")}
        >
          <span className="text-accent-gradient">{t("home.courts.title")}</span>
        </h2>
        <div
          className="mt-2 h-[3px] w-28 md:w-32 lg:w-36 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent-500), transparent)",
            boxShadow:
              "0 0 18px color-mix(in oklab, var(--accent-500), transparent 70%)",
          }}
        />
      </div>
    </>
  );
}