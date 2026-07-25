"use client";

import { useT } from "@/components/I18nProvider";
import AdminStatsChart from "@/components/AdminStatsClient";
import type {
  ActivityStats,
  AdminStats,
  StatsBucket,
  StatsRangeKey,
  WeekdayStats,
} from "@/lib/admin-stats";

type Props = {
  range: StatsRangeKey;
  rangeTabs: StatsRangeKey[];
  basePath: string;
  reportPath: string;
  bucketUnit: "day" | "month";
  byPeriod: StatsBucket[];
  byActivity: ActivityStats[];
  byWeekday: WeekdayStats[];
  totals: AdminStats["totals"];
};

export default function AdminStatsClient({
  range,
  rangeTabs,
  basePath,
  reportPath,
  bucketUnit,
  byPeriod,
  byActivity,
  byWeekday,
  totals,
}: Props) {
  const t = useT();

  const rangeLabel =
    range === "all"
      ? t("stats.range.allTime")
      : t("stats.range.lastNDays").replace("{n}", range);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes adminGlowLine { 
  0%,100%{opacity:.55; transform:scaleX(.9)} 
  50%{opacity:.95; transform:scaleX(1)} 
}
          `.trim(),
        }}
      />

      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-accent-gradient">{t("stats.title")}</span>
          </h1>
          <div
            className="mt-2 h-[3px] w-30 rounded-full accent-line"
            style={{ animation: "adminGlowLine 3.2s ease-in-out infinite" }}
          />
        </div>

        {/* Range toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {rangeTabs.map((key) => {
            const active = range === key;
            const qs = new URLSearchParams({ range: key }).toString();
            const label =
              key === "all"
                ? t("stats.range.all")
                : t(`stats.range.${key}d`);

            return (
              <a
                key={key}
                href={`${basePath}?${qs}`}
                className={[
                  "rounded-xl px-3 py-1.5 text-sm transition",
                  active
                    ? "pill-active"
                    : "u-border u-surface-2 hover:u-surface",
                ].join(" ")}
              >
                {label}
              </a>
            );
          })}
          <a
            href={`${reportPath}?range=${range}`}
            className="rounded-xl px-3 py-1.5 text-sm u-border u-surface-2 transition hover:u-surface"
          >
            {t("admin.stats.exportPdf")}
          </a>
        </div>
      </header>

      <AdminStatsChart
        rangeLabel={rangeLabel}
        bucketUnit={bucketUnit}
        periods={byPeriod}
        activities={byActivity}
        weekdays={byWeekday}
        summary={totals}
      />
    </main>
  );
}
