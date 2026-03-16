"use client";

import { useT } from "@/components/I18nProvider";
import AdminStatsChart from "@/components/AdminStatsClient"; // your existing chart component

type RangeKey = "7" | "30" | "90";

type Props = {
  days: number;
  rangeTabs: Array<{ key: RangeKey; label: string }>;
  byDay: {
    date: string;
    bookings: number;
    seats: number;
    capacity: number;
    revenueCents: number;
    refundsCents: number;
    paidBookings: number;
  }[];
  byActivity: {
    activityId: string;
    name: string;
    seats: number;
    revenueCents: number;
    bookings: number;
  }[];
  totals: {
    revenueCents: number;
    refundsCents: number;
    seats: number;
    capacity: number;
    paidBookings: number;
    bookings: number;
  };
  utilization: number;
  conversion: number;
};

export default function AdminStatsClient({
  days,
  rangeTabs,
  byDay,
  byActivity,
  totals,
  utilization,
  conversion,
}: Props) {
  const t = useT();

  const rangeLabel = t("stats.range.lastNDays").replace("{n}", String(days));

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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-accent-gradient">{t("stats.title")}</span>
          </h1>
          <div
            className="mt-2 h-[3px] w-30 rounded-full accent-line"
            style={{ animation: "adminGlowLine 3.2s ease-in-out infinite" } as any}
          />
        </div>

        {/* Range toggles */}
        <div className="flex gap-2">
          {rangeTabs.map(({ key }) => {
            const active = String(days) === key;
            const qs = new URLSearchParams({ range: key }).toString();
            const label = t(`stats.range.${key}d`);

            return (
              <a
                key={key}
                href={`/admin/stats?${qs}`}
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
        </div>
      </header>

      {/* Chart and summary section */}
      <AdminStatsChart
        rangeLabel={rangeLabel}
        daily={byDay}
        activities={byActivity}
        summary={{
          revenue: totals.revenueCents / 100,
          refunds: totals.refundsCents / 100,
          seats: totals.seats,
          utilization,
          conversion,
          paidBookings: totals.paidBookings,
          bookings: totals.bookings,
        }}
      />
    </main>
  );
}