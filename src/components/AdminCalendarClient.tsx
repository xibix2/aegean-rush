// src/components/admin/AdminCalendarClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MonthCalendar from "@/components/MonthCalendar";
import { useT } from "@/components/I18nProvider";

type DayInfo = {
  capacity: number;
  paid: number;
  remaining: number;
  bucket: "none" | "low" | "medium" | "high" | "full";
};

export default function AdminCalendarClient({
  activities,
  initialActivityId,
  initialMonth, // "YYYY-MM"
  tenantSlug, // 👈 optional, for multi-tenant paths
}: {
  activities: { id: string; name: string }[];
  initialActivityId?: string;
  initialMonth?: string;
  tenantSlug?: string;
}) {
  const t = useT();

  const base = tenantSlug ? `/${tenantSlug}` : "";
  const [activityId, setActivityId] = useState(
    initialActivityId || activities[0]?.id || "",
  );
  const [monthStr, setMonthStr] = useState(
    initialMonth || new Date().toISOString().slice(0, 7),
  ); // YYYY-MM

  const [year, month] = useMemo(
    () => monthStr.split("-").map(Number) as [number, number],
    [monthStr],
  );

  const [data, setData] = useState<Record<string, DayInfo>>({});
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  async function load() {
    if (!activityId || !monthStr) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    try {
      const qs = new URLSearchParams({
        activityId,
        month: monthStr,
      }).toString();

      const res = await fetch(`${base}/api/availability/month?${qs}`, {
        cache: "no-store",
        headers: tenantSlug ? { "x-tenant-slug": tenantSlug } : undefined,
        signal: ac.signal,
      });

      if (!res.ok) {
        setData({});
      } else {
        const json = await res.json();
        setData((json && json.days) || {});
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") setData({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, monthStr, tenantSlug]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setMonthStr(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls card */}
      <form
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-[--color-border] bg-[--color-card]/70 backdrop-blur-md p-4"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        aria-label={t("admin.calendar.controls")}
      >
        {/* Activity select */}
        <label className="text-sm flex items-center gap-2">
          <span className="opacity-80">{t("admin.calendar.activity")}</span>
          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="rounded-lg border border-[--color-border] bg-white/[0.05] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-500)]"
            aria-label={t("admin.calendar.activity")}
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        {/* Month picker */}
        <label className="text-sm flex items-center gap-2">
          <span className="opacity-80">{t("admin.calendar.month")}</span>
          <input
            type="month"
            value={monthStr}
            onChange={(e) => setMonthStr(e.target.value)}
            className="rounded-lg border border-[--color-border] bg-white/[0.05] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-500)]"
            aria-label={t("admin.calendar.month")}
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          {/* Go */}
          <button
            className="inline-flex items-center justify-center rounded-xl h-9 px-4 text-sm font-medium text-white
                       bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-600)]
                       shadow-[0_0_18px_-10px_var(--accent-500)] transition hover:scale-[1.02] disabled:opacity-60"
            disabled={loading}
            aria-disabled={loading}
          >
            {loading ? t("admin.calendar.loading") : t("admin.calendar.go")}
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="inline-flex items-center justify-center rounded-xl h-9 px-4 text-sm
                       border border-[--color-border] bg-white/[0.05] hover:bg-white/[0.08]
                       transition focus:outline-none focus:ring-1 focus:ring-[var(--accent-500)]"
            aria-label={t("admin.calendar.prevMonthAria")}
            title={t("admin.calendar.prevMonth")}
          >
            ◀ {t("admin.calendar.prev")}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="inline-flex items-center justify-center rounded-xl h-9 px-4 text-sm
                       border border-[--color-border] bg-white/[0.05] hover:bg-white/[0.08]
                       transition focus:outline-none focus:ring-1 focus:ring-[var(--accent-500)]"
            aria-label={t("admin.calendar.nextMonthAria")}
            title={t("admin.calendar.nextMonth")}
          >
            {t("admin.calendar.next")} ▶
          </button>
        </div>
      </form>

      {/* Subtle loading line under controls */}
      {loading && (
        <div
          aria-hidden
          className="h-[3px] w-40 rounded-full mx-1"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0), var(--accent-600), var(--accent-500), var(--accent-600), rgba(0,0,0,0))",
            animation: "adminGlowLine 3.2s ease-in-out infinite",
          }}
        />
      )}

      {/* ✅ MOBILE FIX: allow horizontal scroll + give calendar a min width */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 ">
        <div className="min-w-[820px] sm:min-w-0">
          <MonthCalendar
            year={year}
            month={month}
            data={data}
            onPick={(iso) => {
              // keep navigation inside tenant space
              const href = `${base}/admin/slots?date=${iso}${
                activityId ? `&activityId=${activityId}` : ""
              }`;
              window.location.href = href;
            }}
            onPrevMonth={() => shiftMonth(-1)}
            onNextMonth={() => shiftMonth(1)}
          />
        </div>
      </div>

      {/* tiny keyframes local to this component */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes adminGlowLine{
  0%,100%{opacity:.55; transform:scaleX(.9)}
  50%{opacity:.95; transform:scaleX(1)}
}
        `.trim(),
        }}
      />
    </div>
  );
}