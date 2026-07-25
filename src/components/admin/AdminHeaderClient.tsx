"use client";

import { useT } from "@/components/I18nProvider";

export function AdminHeaderClient() {
  const t = useT();

  return (
    <header className="admin-page-header">
      <div className="relative z-10">
        <div className="admin-page-kicker">Business overview</div>
      <h1
        className="admin-page-title t-anim"
        style={{ animation: "adminTitlePulse 6s ease-in-out infinite" }}
      >
        {t("admin.dashboard.title")}
      </h1>
      <p className="admin-page-subtitle">
        {t("admin.dashboard.subtitle")}
      </p>
      </div>
      <div className="relative z-10 hidden rounded-2xl border border-[color-mix(in_oklab,var(--accent-500),transparent_70%)] bg-[color-mix(in_oklab,var(--accent-500),transparent_90%)] px-4 py-3 text-right sm:block">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-50">
          Workspace
        </div>
        <div className="mt-0.5 text-sm font-semibold text-[var(--accent-400)]">
          Live operations
        </div>
      </div>
    </header>
  );
}
