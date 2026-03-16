"use client";

import { useT } from "@/components/I18nProvider";

export function ActivitiesStatsClient({
  total,
  active,
  inactive,
  avgDuration,
  avgCapacity,
}: {
  total: number;
  active: number;
  inactive: number;
  avgDuration: number;
  avgCapacity: number;
}) {
  const t = useT();

  const stats = [
    { label: t("admin.activities.stats.total"), value: total },
    { label: t("admin.activities.stats.active"), value: active },
    { label: t("admin.activities.stats.inactive"), value: inactive },
    { label: t("admin.activities.stats.avgDuration"), value: `${avgDuration} ${t("admin.activities.stats.min")}` },
  ];

  return (
    <div className="relative mt-16">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl u-border u-surface p-5 transition"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-30 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle at 50% 120%, rgb(var(--accent-glow) / 0.45), color-mix(in oklab, var(--accent-600), transparent 55%) 40%, transparent 70%)",
              }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)" }}
            />

            <div className="relative z-10">
              <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
              <div className="text-[11px] uppercase opacity-70 mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-2 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 50%, rgb(var(--accent-glow) / 0.28), color-mix(in oklab, var(--accent-600), transparent 70%) 45%, transparent 70%)",
        }}
      />
    </div>
  );
}