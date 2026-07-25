"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { readUiPrefsFromDocument } from "@/lib/ui-prefs-client";
import { useT } from "@/components/I18nProvider";
import type {
  ActivityStats,
  AdminStats,
  StatsBucket,
  WeekdayStats,
} from "@/lib/admin-stats";

const CHART_COLORS = {
  online: "#38bdf8",
  walkIn: "#a78bfa",
  refunds: "#fb7185",
  paid: "#34d399",
  pending: "#fbbf24",
  cancelled: "#94a3b8",
  guests: "#22d3ee",
};

const SYMBOL_TO_CODE: Record<string, "EUR" | "USD" | "GBP"> = {
  "€": "EUR",
  "$": "USD",
  "£": "GBP",
};

type Props = {
  rangeLabel: string;
  bucketUnit: "day" | "month";
  periods: StatsBucket[];
  activities: ActivityStats[];
  weekdays: WeekdayStats[];
  summary: AdminStats["totals"];
};

export default function AdminStatsClient({
  rangeLabel,
  bucketUnit,
  periods,
  activities,
  weekdays,
  summary,
}: Props) {
  const t = useT();
  const [currencySymbol, setCurrencySymbol] = React.useState("€");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const prefs = readUiPrefsFromDocument();
    if (prefs.currency) setCurrencySymbol(prefs.currency);
    setMounted(true);
  }, []);

  const currencyCode = SYMBOL_TO_CODE[currencySymbol] ?? "EUR";
  const money = React.useCallback(
    (value: number) => {
      if (!mounted) return "€—";
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 2,
      }).format(value);
    },
    [currencyCode, mounted]
  );

  const percent = (value: number) =>
    `${new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1,
    }).format(value * 100)}%`;

  const revenueTrend = periods.map((period) => ({
    label: period.label,
    online: period.onlineRevenueCents / 100,
    walkIn: period.walkInRevenueCents / 100,
    refunds: period.refundsCents / 100,
  }));

  const bookingTrend = periods.map((period) => ({
    label: period.label,
    bookings: period.bookings,
    guests: period.seats,
  }));

  const activityData = activities.map((activity) => ({
    name: activity.name,
    online: activity.onlineRevenueCents / 100,
    walkIn: activity.walkInRevenueCents / 100,
  }));

  const sourceData = [
    {
      name: t("admin.stats.sources.online"),
      value: summary.onlineNetRevenueCents / 100,
      color: CHART_COLORS.online,
    },
    {
      name: t("admin.stats.sources.walkIn"),
      value: summary.walkInNetRevenueCents / 100,
      color: CHART_COLORS.walkIn,
    },
  ].filter((item) => item.value > 0);

  const statusData = [
    {
      name: t("admin.stats.status.paid"),
      value: summary.paidBookings,
      color: CHART_COLORS.paid,
    },
    {
      name: t("admin.stats.status.pending"),
      value: summary.pendingBookings,
      color: CHART_COLORS.pending,
    },
    {
      name: t("admin.stats.status.cancelled"),
      value: summary.cancelledBookings,
      color: CHART_COLORS.cancelled,
    },
    {
      name: t("admin.stats.status.refunded"),
      value: summary.refundedBookings,
      color: CHART_COLORS.refunds,
    },
  ].filter((item) => item.value > 0);

  const tooltipStyle = {
    background: "rgba(16,18,28,0.96)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    color: "white",
  };

  const tick = { fill: "rgba(255,255,255,0.68)", fontSize: 11 };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("admin.stats.net")}
          hint={rangeLabel}
          value={money(summary.netRevenueCents / 100)}
        />
        <StatCard
          title={t("admin.stats.onlineRevenue")}
          hint={`${summary.onlineBookings} ${t("admin.stats.completedBookings")}`}
          value={money(summary.onlineNetRevenueCents / 100)}
          accent={CHART_COLORS.online}
        />
        <StatCard
          title={t("admin.stats.walkInRevenue")}
          hint={`${summary.walkInBookings} ${t("admin.stats.completedBookings")}`}
          value={money(summary.walkInNetRevenueCents / 100)}
          accent={CHART_COLORS.walkIn}
        />
        <StatCard
          title={t("admin.stats.averageBooking")}
          hint={t("admin.stats.averageBookingHint")}
          value={money(summary.averageBookingValueCents / 100)}
        />
        <StatCard
          title={t("admin.stats.paidBookings")}
          hint={rangeLabel}
          value={String(summary.paidBookings)}
        />
        <StatCard
          title={t("admin.stats.seatsSold")}
          hint={t("admin.stats.totalSeats")}
          value={String(summary.seats)}
        />
        <StatCard
          title={t("admin.stats.utilization")}
          hint={t("admin.stats.utilizationHint")}
          value={percent(summary.utilization)}
        />
        <StatCard
          title={t("admin.stats.refundRate")}
          hint={`${money(summary.refundsCents / 100)} ${t("admin.stats.refunded")}`}
          value={percent(summary.refundRate)}
          accent={CHART_COLORS.refunds}
        />
      </section>

      <ChartCard
        title={t("admin.stats.charts.revenueBySource")}
        subtitle={
          bucketUnit === "month"
            ? t("admin.stats.groupedMonthly")
            : t("admin.stats.groupedDaily")
        }
      >
        <ResponsiveContainer width="100%" height={310}>
          <AreaChart data={revenueTrend} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="onlineRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.online} stopOpacity={0.5} />
                <stop offset="95%" stopColor={CHART_COLORS.online} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="walkInRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.walkIn} stopOpacity={0.5} />
                <stop offset="95%" stopColor={CHART_COLORS.walkIn} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="3 6" />
            <XAxis dataKey="label" tick={tick} minTickGap={26} />
            <YAxis tick={tick} tickFormatter={(value) => money(Number(value))} width={72} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [
                money(Number(value)),
                name === "online"
                  ? t("admin.stats.sources.online")
                  : name === "walkIn"
                    ? t("admin.stats.sources.walkIn")
                    : t("admin.stats.refunds"),
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "online"
                  ? t("admin.stats.sources.online")
                  : value === "walkIn"
                    ? t("admin.stats.sources.walkIn")
                    : t("admin.stats.refunds")
              }
            />
            <Area
              type="monotone"
              dataKey="online"
              stackId="revenue"
              stroke={CHART_COLORS.online}
              fill="url(#onlineRevenue)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="walkIn"
              stackId="revenue"
              stroke={CHART_COLORS.walkIn}
              fill="url(#walkInRevenue)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="refunds"
              stroke={CHART_COLORS.refunds}
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title={t("admin.stats.charts.revenueMix")}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={sourceData}
                dataKey="value"
                nameKey="name"
                innerRadius={66}
                outerRadius={96}
                paddingAngle={3}
              >
                {sourceData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => money(Number(value))}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin.stats.charts.bookingStatus")}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={66}
                outerRadius={96}
                paddingAngle={3}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title={t("admin.stats.charts.bookingsAndGuests")}>
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={bookingTrend} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="3 6" />
            <XAxis dataKey="label" tick={tick} minTickGap={26} />
            <YAxis tick={tick} width={38} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              formatter={(value) =>
                value === "bookings"
                  ? t("admin.stats.allBookings")
                  : t("admin.stats.labels.guests")
              }
            />
            <Bar dataKey="bookings" fill="var(--accent-500)" radius={[7, 7, 0, 0]} />
            <Bar dataKey="guests" fill={CHART_COLORS.guests} radius={[7, 7, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("admin.stats.charts.topActivitiesByRevenue")}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={activityData} margin={{ top: 10, right: 12, left: 4, bottom: 18 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="3 6" />
            <XAxis
              dataKey="name"
              tick={tick}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={74}
            />
            <YAxis tick={tick} tickFormatter={(value) => money(Number(value))} width={72} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [
                money(Number(value)),
                name === "online"
                  ? t("admin.stats.sources.online")
                  : t("admin.stats.sources.walkIn"),
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "online"
                  ? t("admin.stats.sources.online")
                  : t("admin.stats.sources.walkIn")
              }
            />
            <Bar dataKey="online" stackId="source" fill={CHART_COLORS.online} />
            <Bar
              dataKey="walkIn"
              stackId="source"
              fill={CHART_COLORS.walkIn}
              radius={[7, 7, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t("admin.stats.charts.busiestWeekdays")}>
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={weekdays} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.12)" strokeDasharray="3 6" />
            <XAxis dataKey="label" tick={tick} />
            <YAxis tick={tick} width={38} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="bookings"
              name={t("admin.stats.allBookings")}
              fill="var(--accent-500)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.05] to-white/[0.03] p-4 shadow-[0_0_30px_-18px_color-mix(in_oklab,var(--accent-500),transparent_60%)]"
      style={accent ? { borderColor: `${accent}55` } : undefined}
    >
      <div className="text-xs opacity-70">{title}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-60">{hint}</div>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[--color-card]/70 p-4 shadow-[0_0_40px_-20px_color-mix(in_oklab,var(--accent-500),transparent_60%)] backdrop-blur-md sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="text-sm font-medium opacity-90">{title}</div>
        {subtitle && <div className="text-xs opacity-55">{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}
