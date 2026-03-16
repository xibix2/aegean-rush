"use client";

import { useT } from "@/components/I18nProvider";

export function AdminHeaderClient() {
  const t = useT();

  return (
    <header className="relative flex flex-col items-center text-center">
      <h1
        className="text-3xl md:text-[32px] font-semibold tracking-tight t-anim"
        style={{ animation: "adminTitlePulse 6s ease-in-out infinite" }}
      >
        <span className="text-accent-gradient">
          {t("admin.dashboard.title")}
        </span>
      </h1>

      {/* animated accent underline */}
      <div
        className="mt-2 h-[3px] w-40 rounded-full accent-line"
        style={{ animation: "adminGlowLine 4s ease-in-out infinite" }}
      />

      <p className="mt-3 text-sm opacity-75 max-w-md">
        {t("admin.dashboard.subtitle")}
      </p>
    </header>
  );
}