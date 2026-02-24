// src/components/admin/AdminDashboardClient.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import MonthCalendar from "@/components/MonthCalendar";
import { format } from "date-fns";
import { readUiPrefsFromDocument } from "@/lib/ui-prefs-client";
import { useT } from "@/components/I18nProvider";

type HeatDay = {
  capacity: number;
  paid: number;
  remaining: number;
  bucket: "none" | "low" | "medium" | "high" | "full";
};

type DaySlot = {
  id: string;
  startAt: string;
  endAt: string | null;
  capacity: number;
  priceCents: number;
  paid: number;
  pendingFresh: number;
  remaining: number;
};

type DayGroup = { activityId: string; activityName: string; slots: DaySlot[] };

export default function AdminDashboardClient({
  initialDate, // "YYYY-MM-DD"
  tenantSlug,  // 👈 optional; when present, scope API + links to /{tenantSlug}
}: {
  initialDate?: string;
  tenantSlug?: string;
}) {
  const t = useT();

  const base = tenantSlug ? `/${tenantSlug}` : "";
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(initialDate || todayIso);
  const [monthStr, setMonthStr] = useState((initialDate || todayIso).slice(0, 7)); // "YYYY-MM"

  const [year, month] = useMemo(
    () => monthStr.split("-").map(Number) as [number, number],
    [monthStr]
  );

  const [heat, setHeat] = useState<Record<string, HeatDay>>({});
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loadingHeat, setLoadingHeat] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);

  // Abort controllers to prevent late state updates
  const monthAbort = useRef<AbortController | null>(null);
  const dayAbort = useRef<AbortController | null>(null);

  // --- UI prefs (accent + currency symbol) ---
  const [currency, setCurrency] = useState<string>("€");
  useEffect(() => {
    const prefs = readUiPrefsFromDocument();
    setCurrency(prefs.currency || "€");
  }, []);

  // Helper to format cents with the chosen currency symbol (lightweight)
  const money = (cents: number | null | undefined) => {
    const n = (cents ?? 0) / 100;
    const num = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
    return `${currency}${num}`;
  };

  async function loadMonth() {
    setLoadingHeat(true);
    monthAbort.current?.abort();
    const ac = new AbortController();
    monthAbort.current = ac;

    try {
      const res = await fetch(`${base}/api/availability/month-all?month=${monthStr}`, {
        cache: "no-store",
        headers: tenantSlug ? { "x-tenant-slug": tenantSlug } : undefined,
        signal: ac.signal,
      });
      const j = res.ok ? await res.json() : { days: {} };
      setHeat(j.days || {});
    } catch (e: any) {
      if (e?.name !== "AbortError") setHeat({});
    } finally {
      setLoadingHeat(false);
    }
  }

  async function loadDay(iso: string) {
    setLoadingDay(true);
    dayAbort.current?.abort();
    const ac = new AbortController();
    dayAbort.current = ac;

    try {
      const res = await fetch(`${base}/api/admin/day?date=${iso}`, {
        cache: "no-store",
        headers: tenantSlug ? { "x-tenant-slug": tenantSlug } : undefined,
        signal: ac.signal,
      });
      const j = res.ok ? await res.json() : { activities: [] };
      setGroups(j.activities || []);
    } catch (e: any) {
      if (e?.name !== "AbortError") setGroups([]);
    } finally {
      setLoadingDay(false);
    }
  }

  useEffect(() => {
    loadMonth();
    return () => monthAbort.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStr, tenantSlug]);

  useEffect(() => {
    loadDay(selectedDate);
    return () => dayAbort.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, tenantSlug]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setMonthStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="space-y-8">
      {/* Local micro-styles; purely visual */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes adminFade { 0%{opacity:0; transform:translateY(6px)} 100%{opacity:1; transform:none} }
@keyframes adminShimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes adminGlowLine { 0%,100%{opacity:.55; transform:translateX(-50%) scaleX(.9)} 50%{opacity:.95; transform:translateX(-50%) scaleX(1)} }
@media (prefers-reduced-motion: reduce){ .adm-anim { animation: none !important; } }
          `.trim(),
        }}
      />

      {/* Header above the calendar (accent-aware) */}
      <div className="text-center adm-anim" style={{ animation: "adminFade .35s ease-out" }}>
        <div className="relative inline-flex flex-col items-center">
          <div className="relative inline-flex flex-col items-center z-10">
            <h2
              className="text-3xl md:text-[30px] font-semibold tracking-tight t-anim"
              style={{ animation: "adminTitlePulse 6s ease-in-out infinite" }}
            >
              <span className="text-accent-gradient">{t("admin.dashboard.scheduleTitle")}</span>
            </h2>
          </div>
          <div
            className="mt-2 ml-38 h-[3px] w-40 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0), var(--accent-600), var(--accent-500), var(--accent-600), rgba(0,0,0,0))",
              animation: "adminGlowLine 4s ease-in-out infinite",
            }}
          />
          {!!loadingHeat && (
            <p className="mt-2 text-xs opacity-70">{t("admin.dashboard.updatingMonth")}</p>
          )}
        </div>
      </div>

      {/* Calendar */}
      <MonthCalendar
        year={year}
        month={month}
        data={heat}
        onPick={(iso) => setSelectedDate(iso)}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
      />

      {/* Controls row for the selected date */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative inline-flex flex-col items-start">
          <div className="relative inline-flex flex-col items-center z-10">
            <h2
              className="text-3xl md:text-[24px] font-semibold tracking-tight t-anim"
              style={{ animation: "adminTitlePulse 6s ease-in-out infinite" }}
            >
              <span className="text-accent-gradient">
                {format(new Date(`${selectedDate}T00:00:00`), "eeee, d MMM yyyy")}
              </span>
            </h2>
          </div>
          <span
            className="mt-1 ml-2 inline-block h-[2px] w-54 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0), var(--accent-500), var(--accent-400), var(--accent-500), rgba(0,0,0,0))",
            }}
          />
        </div>

        <input
          type="date"
          aria-label={t("admin.dashboard.aria.datePicker")}
          className="rounded-lg border border-[--color-border] bg-black/20 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)]/50"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Day loading / empty state */}
      {loadingDay && (
        <div
          className="rounded-2xl border border-[--color-border] p-5 adm-anim"
          style={{ animation: "adminFade .25s ease-out" }}
        >
          <div
            className="h-4 w-40 rounded bg-[linear-gradient(90deg,#1f1f1f,#2a2a2a,#1f1f1f)] bg-[length:200%_100%]"
            style={{ animation: "adminShimmer 1.2s ease-in-out infinite" }}
          />
          <div
            className="mt-4 h-12 rounded bg-[linear-gradient(90deg,#1f1f1f,#2a2a2a,#1f1f1f)] bg-[length:200%_100%]"
            style={{ animation: "adminShimmer 1.2s ease-in-out infinite" }}
          />
        </div>
      )}

      {groups.length === 0 && !loadingDay && (
        <div className="rounded-2xl border border-[--color-border] p-6 text-sm text-center opacity-85">
          {t("admin.dashboard.noSlotsOnDate")}
        </div>
      )}

      {/* Groups / activities of the selected day */}
      <div className="grid gap-5">
        {groups.map((g, gi) => (
          <section
            key={g.activityId}
            className="relative overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-card] adm-anim"
            style={{ animation: `adminFade .4s ease-out ${gi * 0.03}s both` as any }}
          >
            {/* subtle accent edge (accent-aware) */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              aria-hidden
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in_oklab,var(--accent-600),transparent_65%), color-mix(in_oklab,var(--accent-500),transparent_70%), color-mix(in_oklab,var(--accent-600),transparent_65%))",
                padding: 1,
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            <header className="relative z-10 px-4 py-3 border-b border-[--color-border] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, var(--accent-400) 0%, var(--accent-600) 70%)",
                    boxShadow: "0 0 14px 1px color-mix(in_oklab,var(--accent-500),transparent 65%)",
                  }}
                />
                <div className="font-medium tracking-tight">{g.activityName}</div>
              </div>

              <a
                href={`${base}/admin/slots?date=${selectedDate}&activityId=${g.activityId}`}
                className="inline-flex h-11 items-center justify-center px-5 text-sm font-medium btn-accent"
              >
                {t("admin.dashboard.manageSlots")}
              </a>
            </header>

            <div className="relative z-10 p-4 grid gap-3">
              {g.slots.map((s) => {
                const start = new Date(s.startAt);
                const end = s.endAt ? new Date(s.endAt) : null;
                const unit = s.priceCents ?? 0;
                const soldOut = s.remaining === 0;

                return (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
                               rounded-xl border border-[--color-border] px-3 py-3
                               bg-white/[0.02] hover:bg-white/[0.03] transition"
                  >
                    <div>
                      <div className="mr-18 font-medium">
                        ▸ {format(start, "HH:mm")}
                        {end ? <>–{format(end, "HH:mm")}</> : null}
                      </div>
                      <div className="mt-1 text-xs opacity-70">
                        {t("admin.dashboard.cap")} {s.capacity} • {t("admin.dashboard.paid")} {s.paid} • {t("admin.dashboard.pendingFresh")} {s.pendingFresh}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs opacity-75">
                        {money(unit)} {t("admin.dashboard.perPerson")}
                      </div>
                      <div className={`text-sm font-medium ${soldOut ? "text-red-400" : "text-white"}`}>
                        {soldOut ? t("admin.dashboard.soldOut") : `${s.remaining} ${t("admin.dashboard.left")}`}
                      </div>

                      {/* Go to specific slot details page (tenant-aware) */}
                      <a
                        href={`${base}/admin/slots/${s.id}`}
                        title={t("admin.dashboard.edit")}
                        className="inline-flex h-10.5 items-center justify-center px-6 text-sm font-medium btn-accent"
                      >
                        {t("admin.dashboard.edit")}
                      </a>
                    </div>
                  </div>
                );
              })}

              {g.slots.length === 0 && (
                <div className="text-sm opacity-75">{t("admin.dashboard.noSlotsForActivity")}</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}