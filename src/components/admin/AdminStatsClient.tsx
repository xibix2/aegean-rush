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
    <main className="admin-page max-w-6xl">
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
      <header className="admin-page-header">
        <div className="relative z-10">
          <div className="admin-page-kicker">Performance insights</div>
          <h1 className="admin-page-title">{t("stats.title")}</h1>
          <p className="admin-page-subtitle">
            Understand bookings, income and demand across your activities.
          </p>
        </div>

        {/* Range toggles */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
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
