// src/components/admin/AdminStatsClient.tsx
"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { readUiPrefsFromDocument } from "@/lib/ui-prefs-client";
import { useT } from "@/components/I18nProvider";

/* --------- Types ---------- */
type Daily = {
  date: string;
  bookings: number;
  seats: number;
  capacity: number;
  revenueCents: number;
  refundsCents: number;
  paidBookings: number;
};

type ActivityAgg = {
  activityId: string;
  name: string;
  seats: number;
  revenueCents: number;
  bookings: number;
};

type Summary = {
  revenue: number; // euros
  refunds: number; // euros
  seats: number;
  utilization: number; // 0..1
  conversion: number; // 0..1
  paidBookings: number;
  bookings: number;
};

/** Map UI currency symbol → ISO code for Intl */
const SYMBOL_TO_CODE: Record<string, "EUR" | "USD" | "GBP"> = {
  "€": "EUR",
  "$": "USD",
  "£": "GBP",
};

export default function AdminStatsClient({
  rangeLabel,
  daily,
  activities,
  summary,
}: {
  rangeLabel: string;
  daily: Daily[];
  activities: ActivityAgg[];
  summary: Summary;
}) {
  const t = useT();

  // UI currency from cookie
  const [currencySymbol, setCurrencySymbol] = React.useState("€");
  React.useEffect(() => {
    const prefs = readUiPrefsFromDocument();
    if (prefs.currency) setCurrencySymbol(prefs.currency);
  }, []);

  const currencyCode = React.useMemo(
    () => SYMBOL_TO_CODE[currencySymbol] ?? "EUR",
    [currencySymbol]
  );

  // ⚠️ Hydration-safe: avoid locale formatting until after mount
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const money = React.useCallback(
    (v: number) => {
      if (!mounted) return "—"; // same on server + first client render → no mismatch
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
      }).format(v);
    },
    [currencyCode, mounted]
  );

  const revenueData = React.useMemo(
    () =>
      daily.map((d) => ({
        date: d.date.slice(5), // MM-DD
        revenue: d.revenueCents / 100,
      })),
    [daily]
  );

  const seatsData = React.useMemo(
    () =>
      daily.map((d) => ({
        date: d.date.slice(5),
        seats: d.seats,
      })),
    [daily]
  );

  const topActivities = React.useMemo(
    () =>
      activities.map((a) => ({
        name: a.name,
        revenue: a.revenueCents / 100,
      })),
    [activities]
  );

  const pct = (v: number) => `${Math.round(v * 100)}%`;

  const netRevenue = Math.max(0, summary.revenue - summary.refunds);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title={t("admin.stats.revenue")}
          hint={rangeLabel}
          value={money(summary.revenue)}
        />
        <StatCard
          title={t("admin.stats.refunds")}
          hint={rangeLabel}
          value={money(summary.refunds)}
        />
        <StatCard
          title={t("admin.stats.net")}
          hint={t("admin.stats.netHint")}
          value={money(netRevenue)}
        />
        <StatCard
          title={t("admin.stats.seatsSold")}
          hint={t("admin.stats.totalSeats")}
          value={String(summary.seats)}
        />
        <StatCard
          title={t("admin.stats.utilization")}
          hint={t("admin.stats.utilizationHint")}
          value={pct(summary.utilization)}
        />
        <StatCard
          title={t("admin.stats.paidBookings")}
          hint={rangeLabel}
          value={String(summary.paidBookings)}
        />
        <StatCard
          title={t("admin.stats.allBookings")}
          hint={rangeLabel}
          value={String(summary.bookings)}
        />
        <StatCard
          title={t("admin.stats.conversion")}
          hint={t("admin.stats.conversionHint")}
          value={pct(summary.conversion)}
        />
      </div>

      {/* Revenue by day */}
      <ChartCard title={t("admin.stats.charts.revenueByDay")}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={revenueData}
            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              stroke="rgba(255,255,255,0.16)"
              strokeDasharray="3 6"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              tickFormatter={(v) => money(Number(v))}
              width={64}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
              contentStyle={{
                background: "rgba(20,20,30,0.9)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                color: "white",
              }}
              formatter={(v: number) => [
                money(v),
                t("admin.stats.labels.revenue"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--accent-500)"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 5, fill: "var(--accent-400)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Seats by day */}
      <ChartCard title={t("admin.stats.charts.seatsByDay")}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={seatsData}
            margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              stroke="rgba(255,255,255,0.16)"
              strokeDasharray="3 6"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              width={36}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
              contentStyle={{
                background: "rgba(20,20,30,0.9)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                color: "white",
              }}
              formatter={(v: number) => [
                v,
                t("admin.stats.labels.seats"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="seats"
              stroke="var(--accent-500)"
              strokeWidth={2.4}
              dot={false}
              activeDot={{
                r: 5,
                fill: "color-mix(in_oklab,var(--accent-400),white_25%)",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Top activities */}
      <ChartCard title={t("admin.stats.charts.topActivitiesByRevenue")}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={topActivities}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              horizontal
              stroke="rgba(255,255,255,0.16)"
              strokeDasharray="3 6"
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              interval={0}
              height={50}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              tickFormatter={(v) => money(Number(v))}
              width={64}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(20,20,30,0.9)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                color: "white",
              }}
              formatter={(v: number) => [
                money(v),
                t("admin.stats.labels.revenue"),
              ]}
            />
            <Bar
              dataKey="revenue"
              radius={[10, 10, 0, 0]}
              fill="var(--accent-500)"
              stroke="color-mix(in_oklab,var(--accent-600),white_20%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

/* -------------------- Subcomponents -------------------- */
function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.05] to-white/[0.03]
                 p-4 shadow-[0_0_30px_-18px_color-mix(in_oklab,var(--accent-500),transparent_60%)]"
    >
      <div className="text-xs opacity-70">{title}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-60">{hint}</div>}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border border-white/10 bg-[--color-card]/70 backdrop-blur-md p-4 sm:p-5
                 shadow-[0_0_40px_-20px_color-mix(in_oklab,var(--accent-500),transparent_60%)]"
    >
      <div className="text-sm font-medium opacity-85 mb-3">{title}</div>
      {children}
    </section>
  );
}