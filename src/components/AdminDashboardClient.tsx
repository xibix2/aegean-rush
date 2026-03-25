// src/components/AdminDashboardClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MonthCalendar from "@/components/MonthCalendar";
import { format } from "date-fns";
import { readUiPrefsFromDocument } from "@/lib/ui-prefs-client";

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

type DayGroup = {
  activityId: string;
  activityName: string;
  mode: string;
  totalCapacity: number;
  totalPaid: number;
  totalPending: number;
  totalRemaining: number;
  slots: DaySlot[];
};

export default function AdminDashboardClient({
  initialDate,
  tenantSlug,
}: {
  initialDate?: string;
  tenantSlug?: string;
}) {
  const base = tenantSlug ? `/${tenantSlug}` : "";
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(initialDate || todayIso);
  const [monthStr, setMonthStr] = useState((initialDate || todayIso).slice(0, 7));

  const [year, month] = useMemo(
    () => monthStr.split("-").map(Number) as [number, number],
    [monthStr]
  );

  const [heat, setHeat] = useState<Record<string, HeatDay>>({});
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const monthAbort = useRef<AbortController | null>(null);
  const dayAbort = useRef<AbortController | null>(null);

  const [currency, setCurrency] = useState<string>("€");

  useEffect(() => {
    const prefs = readUiPrefsFromDocument();
    setCurrency(prefs.currency || "€");
  }, []);

  const money = (cents: number | null | undefined) => {
    const n = (cents ?? 0) / 100;
    return `${currency}${n.toFixed(2)}`;
  };

  const modeLabel = (mode: string) => {
    if (mode === "FIXED_SEAT_EVENT") return "Fixed event";
    if (mode === "DYNAMIC_RENTAL") return "Rental";
    if (mode === "HYBRID_UNIT_BOOKING") return "Hybrid";
    return mode;
  };

  async function loadMonth() {
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
    } catch {}
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
    } catch {
      setGroups([]);
    } finally {
      setLoadingDay(false);
    }
  }

  useEffect(() => {
    loadMonth();
    return () => monthAbort.current?.abort();
  }, [monthStr, tenantSlug]);

  useEffect(() => {
    loadDay(selectedDate);
    return () => dayAbort.current?.abort();
  }, [selectedDate, tenantSlug]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setMonthStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="space-y-8">
      <MonthCalendar
        year={year}
        month={month}
        data={heat}
        onPick={(iso) => setSelectedDate(iso)}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">
          {format(new Date(`${selectedDate}T00:00:00`), "eeee, d MMM yyyy")}
        </h2>

        <input
          type="date"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {groups.length === 0 && !loadingDay && (
        <div className="rounded-xl border border-white/10 p-6 text-center text-sm text-white/70">
          No activity for this day
        </div>
      )}

      <div className="grid gap-6">
        {groups.map((g) => {
          return (
            <section
              key={g.activityId}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-white">{g.activityName}</div>
                    <span className="mode-badge">{modeLabel(g.mode)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="chip">{g.slots.length} slots</span>
                    <span className="chip">Cap {g.totalCapacity}</span>
                    <span className="chip">Paid {g.totalPaid}</span>
                    <span className="chip">Pending {g.totalPending}</span>
                    <span className="chip-accent">{g.totalRemaining} left</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`${base}/admin/slots?date=${selectedDate}&activityId=${g.activityId}`}
                    className="btn-accent px-4 py-2 text-sm"
                  >
                    Manage day
                  </a>
                </div>
              </div>

              <div className="grid gap-3 p-4">
                {g.slots.map((s) => {
                  const start = new Date(s.startAt);
                  const end = s.endAt ? new Date(s.endAt) : null;

                  return (
                    <div
                      key={s.id}
                      className="grid gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center"
                    >
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {format(start, "HH:mm")}
                          {end ? `–${format(end, "HH:mm")}` : ""}
                        </div>
                        <div className="text-xs text-white/60">
                          {modeLabel(g.mode)} slot
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="chip">Cap {s.capacity}</span>
                        <span className="chip">Paid {s.paid}</span>
                        <span className="chip">Pending {s.pendingFresh}</span>
                        <span className="chip-accent">{s.remaining} left</span>
                      </div>

                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <div className="text-sm text-white/70">{money(s.priceCents)} / person</div>

                        <a
                          href={`${base}/admin/slots/${s.id}`}
                          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                        >
                          Open slot
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <style jsx>{`
        .chip {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.92);
        }
        .chip-accent {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(236, 72, 153, 0.15);
          border: 1px solid rgba(236, 72, 153, 0.3);
          color: white;
        }
        .mode-badge {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.78);
          font-size: 12px;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}