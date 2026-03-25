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
  status: "open" | "closed";
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
  totalSlotCount: number;
  closedSlotCount: number;
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

  const [currency, setCurrency] = useState<string>("€");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<DayGroup | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [notifyCustomers, setNotifyCustomers] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");

  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<DayGroup | null>(null);
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState("");
  const [reopenSuccess, setReopenSuccess] = useState("");

  const monthAbort = useRef<AbortController | null>(null);
  const dayAbort = useRef<AbortController | null>(null);

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

  function openCancelModal(group: DayGroup) {
    setCancelTarget(group);
    setCancelReason("");
    setNotifyCustomers(true);
    setCancelError("");
    setCancelSuccess("");
    setCancelOpen(true);
  }

  function closeCancelModal() {
    if (cancelling) return;
    setCancelOpen(false);
    setCancelTarget(null);
    setCancelReason("");
    setCancelError("");
    setCancelSuccess("");
  }

  function openReopenModal(group: DayGroup) {
    setReopenTarget(group);
    setReopenError("");
    setReopenSuccess("");
    setReopenOpen(true);
  }

  function closeReopenModal() {
    if (reopening) return;
    setReopenOpen(false);
    setReopenTarget(null);
    setReopenError("");
    setReopenSuccess("");
  }

  async function submitCancelDay() {
    if (!cancelTarget) return;

    setCancelling(true);
    setCancelError("");
    setCancelSuccess("");

    try {
      const res = await fetch(`${base}/api/admin/cancel-day`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {}),
        },
        body: JSON.stringify({
          date: selectedDate,
          activityId: cancelTarget.activityId,
          reason: cancelReason,
          notifyCustomers,
        }),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(j?.error || "Failed to cancel day");
      }

      setCancelSuccess(
        `Closed ${j?.closedSlotCount ?? 0} slot(s) • cancelled ${j?.cancelledCount ?? 0} booking(s)${
          notifyCustomers ? ` • ${j?.customerCount ?? 0} customer email(s) found` : ""
        }`
      );

      await Promise.all([loadDay(selectedDate), loadMonth()]);

      setTimeout(() => {
        setCancelOpen(false);
        setCancelTarget(null);
        setCancelReason("");
        setCancelSuccess("");
      }, 900);
    } catch (e: any) {
      setCancelError(e?.message || "Failed to cancel day");
    } finally {
      setCancelling(false);
    }
  }

  async function submitReopenDay() {
    if (!reopenTarget) return;

    setReopening(true);
    setReopenError("");
    setReopenSuccess("");

    try {
      const res = await fetch(`${base}/api/admin/reopen-day`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {}),
        },
        body: JSON.stringify({
          date: selectedDate,
          activityId: reopenTarget.activityId,
        }),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(j?.error || "Failed to reopen day");
      }

      setReopenSuccess(`Reopened ${j?.reopenedCount ?? 0} slot(s).`);

      await Promise.all([loadDay(selectedDate), loadMonth()]);

      setTimeout(() => {
        setReopenOpen(false);
        setReopenTarget(null);
        setReopenSuccess("");
      }, 900);
    } catch (e: any) {
      setReopenError(e?.message || "Failed to reopen day");
    } finally {
      setReopening(false);
    }
  }

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
          const hasClosedSlots = g.closedSlotCount > 0;

          return (
            <section
              key={g.activityId}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-white">{g.activityName}</div>
                    <span className="mode-badge">{modeLabel(g.mode)}</span>
                    {hasClosedSlots && (
                      <span className="closed-badge">
                        {g.closedSlotCount} closed
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="chip">{g.totalSlotCount} slots</span>
                    <span className="chip">Cap {g.totalCapacity}</span>
                    <span className="chip">Paid {g.totalPaid}</span>
                    <span className="chip">Pending {g.totalPending}</span>
                    <span className="chip-accent">{g.totalRemaining} left</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`${base}/admin/slots?date=${selectedDate}&activityId=${g.activityId}`}
                    className="btn-accent px-4 py-2 text-sm"
                  >
                    Manage day
                  </a>

                  {hasClosedSlots ? (
                    <button
                      type="button"
                      onClick={() => openReopenModal(g)}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/15"
                    >
                      Reopen day
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCancelModal(g)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/15"
                    >
                      Cancel day
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 p-4">
                {g.slots.map((s) => {
                  const start = new Date(s.startAt);
                  const end = s.endAt ? new Date(s.endAt) : null;
                  const isClosed = s.status === "closed";

                  return (
                    <div
                      key={s.id}
                      className={`grid gap-4 rounded-xl border px-4 py-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center ${
                        isClosed
                          ? "border-red-500/20 bg-red-500/[0.06]"
                          : "border-white/10 bg-black/30"
                      }`}
                    >
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {format(start, "HH:mm")}
                          {end ? `–${format(end, "HH:mm")}` : ""}
                        </div>
                        <div className="text-xs text-white/60 flex items-center gap-2">
                          <span>{modeLabel(g.mode)} slot</span>
                          {isClosed && <span className="closed-badge">Closed</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="chip">Cap {s.capacity}</span>
                        <span className="chip">Paid {s.paid}</span>
                        <span className="chip">Pending {s.pendingFresh}</span>
                        {isClosed ? (
                          <span className="closed-badge">Unavailable</span>
                        ) : (
                          <span className="chip-accent">{s.remaining} left</span>
                        )}
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

      {cancelOpen && cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Cancel day bookings</h3>
                <p className="mt-1 text-sm text-white/70">
                  {cancelTarget.activityName} • {format(new Date(`${selectedDate}T00:00:00`), "d MMM yyyy")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCancelModal}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/8 p-3 text-sm text-red-100">
              This will close all slots and cancel all paid and pending bookings for this activity on the selected day.
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-white/85">Reason for customers</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                placeholder="Bad weather, strong wind, emergency, equipment issue..."
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/20"
              />
            </div>

            <label className="mt-4 flex items-center gap-3 text-sm text-white/85">
              <input
                type="checkbox"
                checked={notifyCustomers}
                onChange={(e) => setNotifyCustomers(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/30"
              />
              Notify customers
            </label>

            {cancelError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {cancelError}
              </div>
            )}

            {cancelSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {cancelSuccess}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelling}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                Keep bookings
              </button>

              <button
                type="button"
                onClick={submitCancelDay}
                disabled={cancelling}
                className="rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm cancel day"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reopenOpen && reopenTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Reopen day slots</h3>
                <p className="mt-1 text-sm text-white/70">
                  {reopenTarget.activityName} • {format(new Date(`${selectedDate}T00:00:00`), "d MMM yyyy")}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReopenModal}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              This will reopen the closed slots for this activity on the selected day. Cancelled bookings will stay cancelled.
            </div>

            {reopenError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {reopenError}
              </div>
            )}

            {reopenSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {reopenSuccess}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReopenModal}
                disabled={reopening}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                Keep closed
              </button>

              <button
                type="button"
                onClick={submitReopenDay}
                disabled={reopening}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {reopening ? "Reopening..." : "Confirm reopen day"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        .closed-badge {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.28);
          color: rgb(254, 202, 202);
          font-size: 12px;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}