// src/app/[club]/timetable/TimetableClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, addMonths, subMonths, parse } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";
import MonthCalendar from "@/components/MonthCalendar";
import AvailabilityTimeline from "@/components/booking/AvailabilityTimeline";
import { useT } from "@/components/I18nProvider";

type DayBucket = "none" | "low" | "medium" | "high" | "full";
type DayInfo = { capacity: number; paid: number; remaining: number; bucket: DayBucket };

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type DurationOption = {
  id: string;
  label: string | null;
  durationMin: number;
  priceCents: number;
};

type ActivityInfo = {
  id: string;
  name: string;
  mode: ActivityMode;
  slotIntervalMin: number | null;
  guestsPerUnit: number | null;
  maxUnitsPerBooking: number | null;
  durationOptions: DurationOption[];
};

type FixedSlot = {
  id: string;
  kind: "fixed";
  start: string;
  end: string | null;
  capacity: number;
  remaining: number;
  canFit: boolean;
  unitPrice: number;
  totalPrice: number;
  requestedPartySize: number;
  errors?: string[];
};

type RentalOrHybridSlot = {
  id: string;
  kind: "rental" | "hybrid";
  start: string;
  end: string | null;
  capacity: number;
  availableWindowStart: string;
  availableWindowEnd: string | null;
  durationOptions?: DurationOption[];
  requiresStartTimeSelection?: boolean;
  requiresDurationSelection?: boolean;

  bookingStartAt?: string;
  bookingEndAt?: string;

  remainingUnits?: number;
  canFit?: boolean;

  reservedUnits?: number;
  requiredUnits?: number | null;
  requestedGuests?: number | null;

  durationMin?: number | null;
  pricingLabel?: string | null;
  unitPrice?: number;
  totalPrice?: number;

  bookedRanges?: Array<{
    start: string;
    end: string;
    usedUnits?: number;
  }>;

  errors?: string[];
};

type AvailabilityResponse = {
  activity?: ActivityInfo;
  slots?: Array<FixedSlot | RentalOrHybridSlot>;
};

type TimeOption = {
  label: string;
  value: string;
  startIso: string;
  endIso: string;
  availableUnits: number;
  canFit: boolean;
};

const TIMEZONE = "Europe/Athens";

function detectTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  const seg = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  if (!seg || ["api", "privacy", "terms", "contact"].includes(seg)) return null;
  return seg;
}

function calcBucket(remaining: number, capacity: number): DayBucket {
  if (capacity <= 0) return "none";
  if (remaining <= 0) return "full";
  const ratio = remaining / capacity;
  if (ratio >= 0.67) return "high";
  if (ratio >= 0.34) return "medium";
  return "low";
}

function formatMoney(cents: number) {
  return (cents / 100).toFixed(2);
}

function combineDateAndTime(dateYmd: string, timeHm: string) {
  return new Date(`${dateYmd}T${timeHm}:00`).toISOString();
}

function ceilDiv(a: number, b: number) {
  return Math.ceil(a / b);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function sameMinute(date: Date, hm: string) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}` === hm;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getIntervalMinutes(activity: ActivityInfo | null) {
  return Math.max(5, activity?.slotIntervalMin ?? 30);
}

function getRequestedUnits(
  mode: ActivityMode,
  units: number,
  guests: number,
  activity: ActivityInfo | null,
) {
  if (mode === "DYNAMIC_RENTAL") return Math.max(1, units);
  if (mode === "HYBRID_UNIT_BOOKING") {
    const minRequired = ceilDiv(
      Math.max(1, guests),
      Math.max(1, activity?.guestsPerUnit ?? 1),
    );
    return Math.max(minRequired, units);
  }
  return 1;
}

function buildTimeOptions(args: {
  slot: RentalOrHybridSlot;
  safeDate: string;
  durationMin: number | null;
  stepMin: number;
  requestedUnits: number;
}) {
  const { slot, safeDate, durationMin, stepMin, requestedUnits } = args;
  if (!durationMin || !slot.availableWindowEnd) return [];

  const windowStart = new Date(slot.availableWindowStart);
  const windowEnd = new Date(slot.availableWindowEnd);

  if (Number.isNaN(windowStart.getTime()) || Number.isNaN(windowEnd.getTime())) {
    return [];
  }

  const options: TimeOption[] = [];
  const bookedRanges = slot.bookedRanges ?? [];

  for (
    let current = new Date(windowStart);
    addMinutes(current, durationMin) <= windowEnd;
    current = addMinutes(current, stepMin)
  ) {
    const bookingEnd = addMinutes(current, durationMin);

    let usedUnits = 0;
    for (const range of bookedRanges) {
      const bStart = new Date(range.start);
      const bEnd = new Date(range.end);
      if (Number.isNaN(bStart.getTime()) || Number.isNaN(bEnd.getTime())) continue;
      if (overlaps(current, bookingEnd, bStart, bEnd)) {
        usedUnits += Math.max(1, range.usedUnits ?? 1);
      }
    }

    const availableUnits = Math.max(0, slot.capacity - usedUnits);
    const hm = format(current, "HH:mm");

    options.push({
      label: hm,
      value: hm,
      startIso: combineDateAndTime(safeDate, hm),
      endIso: bookingEnd.toISOString(),
      availableUnits,
      canFit: availableUnits >= requestedUnits,
    });
  }

  return options;
}

export default function TimetableClient() {
  const t = useT();

  const params = useSearchParams();
  const router = useRouter();

  const activityId = params.get("activityId") ?? "";
  const date = params.get("date") ?? "";

  const [partySize, setPartySize] = useState<number>(Number(params.get("partySize") ?? 1));
  const [units, setUnits] = useState<number>(Number(params.get("units") ?? 1));
  const [guests, setGuests] = useState<number>(Number(params.get("guests") ?? 1));
  const [selectedTime, setSelectedTime] = useState<string>(params.get("startTime") ?? "");
  const [selectedDurationId, setSelectedDurationId] = useState<string>(
    params.get("durationOptionId") ?? "",
  );

  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<ActivityInfo | null>(null);
  const [slots, setSlots] = useState<Array<FixedSlot | RentalOrHybridSlot>>([]);

  const tenantSlug = useMemo(() => detectTenantSlug(), []);
  const base = tenantSlug ? `/${tenantSlug}` : "";

  const minBookable = useMemo(
    () => formatInTimeZone(addDays(new Date(), 1), TIMEZONE, "yyyy-MM-dd"),
    [],
  );

  const safeDate = date || minBookable;

  const [month, setMonth] = useState(() => Number(safeDate.slice(5, 7)));
  const [year, setYear] = useState(() => Number(safeDate.slice(0, 4)));
  const [heat, setHeat] = useState<Record<string, DayInfo>>({});

  const safeParamsCopy = () => new URLSearchParams(Array.from(params.entries()));
  const ymd = (d: Date) => format(d, "yyyy-MM-dd");
  const ym = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const clampToMin = (s: string) => (s < minBookable ? minBookable : s);

  const setQuery = (
    updates: Partial<{
      date: string;
      partySize: number;
      units: number;
      guests: number;
      startTime: string;
      durationOptionId: string;
    }>,
  ) => {
    const q = safeParamsCopy();

    if (updates.date) q.set("date", clampToMin(updates.date));
    if (updates.partySize != null) q.set("partySize", String(updates.partySize));
    if (updates.units != null) q.set("units", String(updates.units));
    if (updates.guests != null) q.set("guests", String(updates.guests));

    if (typeof updates.startTime === "string") {
      if (updates.startTime) q.set("startTime", updates.startTime);
      else q.delete("startTime");
    }

    if (typeof updates.durationOptionId === "string") {
      if (updates.durationOptionId) q.set("durationOptionId", updates.durationOptionId);
      else q.delete("durationOptionId");
    }

    if (!q.get("activityId")) q.set("activityId", activityId);

    router.replace(`${base}/timetable?${q.toString()}`, { scroll: false });
  };

  const normalizeDays = (raw: unknown): Record<string, DayInfo> => {
    const out: Record<string, DayInfo> = {};
    if (!raw || typeof raw !== "object") return out;

    for (const [iso, val] of Object.entries(raw as Record<string, unknown>)) {
      if (val && typeof val === "object" && "capacity" in val && "remaining" in val) {
        const cap = Number((val as any).capacity) || 0;
        const rem = Number((val as any).remaining) || 0;
        const paid = Number((val as any).paid) || Math.max(cap - rem, 0);
        const bucket =
          (val as any).bucket && typeof (val as any).bucket === "string"
            ? ((val as any).bucket as DayBucket)
            : calcBucket(rem, cap);
        out[iso] = { capacity: cap, remaining: rem, paid, bucket };
        continue;
      }
      if (typeof val === "number") {
        const n = Number(val) || 0;
        out[iso] = { capacity: n, remaining: n, paid: 0, bucket: calcBucket(n, n) };
        continue;
      }
      out[iso] = { capacity: 0, remaining: 0, paid: 0, bucket: "none" };
    }
    return out;
  };

  const commonFetchInit = useMemo<RequestInit>(() => {
    const headers = new Headers();
    headers.set("cache-control", "no-store");
    if (tenantSlug) headers.set("x-tenant-slug", tenantSlug);
    return { headers, cache: "no-store" as RequestCache };
  }, [tenantSlug]);

  const fetchMonth = async (y: number, m: number) => {
    if (!activityId) return;
    try {
      const qs = new URLSearchParams({ activityId, month: ym(y, m) }).toString();
      const url = `/api/availability/month?${qs}`;
      const res = await fetch(url, commonFetchInit);
      if (!res.ok) {
        setHeat({});
        return;
      }
      const json = await res.json();
      const daysBlock =
        json && typeof json === "object" && "days" in (json as any)
          ? (json as any).days
          : json;
      setHeat(normalizeDays(daysBlock));
    } catch {
      setHeat({});
    }
  };

  const fetchAvailability = async (nextPartySize: number) => {
    if (!activityId || !safeDate) return;

    setLoading(true);
    try {
      const qs = new URLSearchParams({
        activityId,
        date: safeDate,
        partySize: String(nextPartySize),
      });

      if (units > 0) qs.set("units", String(units));
      if (guests > 0) qs.set("guests", String(guests));
      if (selectedTime) qs.set("startTime", combineDateAndTime(safeDate, selectedTime));
      if (selectedDurationId) qs.set("durationOptionId", selectedDurationId);

      const url = `/api/availability/day?${qs.toString()}`;
      const res = await fetch(url, commonFetchInit);
      const json = (await res.json().catch(() => ({}))) as AvailabilityResponse;

      if (!res.ok) throw new Error((json as any)?.error || t("timetable.errors.loadAvailability"));

      setActivity(json.activity ?? null);
      setSlots(Array.isArray(json.slots) ? json.slots : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("timetable.errors.generic");
      toast.error(msg);
      setActivity(null);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseSlot = async (slotId: string) => {
    try {
      setLoading(true);

      const payload: Record<string, unknown> = {
        activityId,
        slotId,
      };

      if (activity?.mode === "FIXED_SEAT_EVENT") {
        payload.partySize = partySize;
      } else if (activity?.mode === "DYNAMIC_RENTAL") {
        payload.partySize = 1;
        payload.units = units;
        payload.startTime = combineDateAndTime(safeDate, selectedTime);
        payload.durationOptionId = selectedDurationId;
      } else if (activity?.mode === "HYBRID_UNIT_BOOKING") {
        payload.partySize = guests;
        payload.guests = guests;
        payload.units = units;
        payload.startTime = combineDateAndTime(safeDate, selectedTime);
        payload.durationOptionId = selectedDurationId;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("timetable.errors.checkoutFailed"));
      window.location.href = json.url;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("timetable.errors.checkoutGeneric");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activityId) return;
    if (!date || date < minBookable) {
      const q = safeParamsCopy();
      q.set("date", date ? clampToMin(date) : minBookable);
      if (!q.get("activityId")) q.set("activityId", activityId);
      router.replace(`${base}/timetable?${q.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activityId || !safeDate) return;
    fetchAvailability(partySize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, safeDate, tenantSlug, selectedDurationId, selectedTime, units, guests]);

  useEffect(() => {
    if (!activityId) return;
    fetchMonth(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, month, year, tenantSlug]);

  useEffect(() => {
    setQuery({
      partySize,
      units,
      guests,
      startTime: selectedTime,
      durationOptionId: selectedDurationId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partySize, units, guests, selectedTime, selectedDurationId]);

  useEffect(() => {
    if (!activity || activity.mode !== "HYBRID_UNIT_BOOKING") return;
    const gpu = Math.max(1, activity.guestsPerUnit ?? 1);
    const required = ceilDiv(Math.max(1, guests), gpu);
    if (units < required) {
      setUnits(required);
    }
  }, [activity, guests, units]);

  const onPartyChange = (n: number) => {
    const v = Math.max(1, Math.min(20, Number.isFinite(n) ? n : 1));
    setPartySize(v);
    if (activity?.mode === "FIXED_SEAT_EVENT") {
      fetchAvailability(v);
    }
  };

  const onUnitsChange = (n: number) => {
    const max = Math.max(1, activity?.maxUnitsPerBooking ?? 20);
    const v = Math.max(1, Math.min(max, Number.isFinite(n) ? n : 1));
    setUnits(v);
  };

  const onGuestsChange = (n: number) => {
    const v = Math.max(1, Math.min(50, Number.isFinite(n) ? n : 1));
    setGuests(v);
  };

  const onDateInputChange = (s: string) => {
    if (s) {
      setSelectedTime("");
      setQuery({ date: s, startTime: "" });
    }
  };

  const goPrevDay = () => {
    const d = parse(`${safeDate}`, "yyyy-MM-dd", new Date());
    setSelectedTime("");
    setQuery({ date: ymd(addDays(d, -1)), startTime: "" });
  };

  const goNextDay = () => {
    const d = parse(`${safeDate}`, "yyyy-MM-dd", new Date());
    setSelectedTime("");
    setQuery({ date: ymd(addDays(d, +1)), startTime: "" });
  };

  const onPickDay = (iso: string) => {
    setSelectedTime("");
    setQuery({ date: iso, startTime: "" });
  };

  const prevMonth = () => {
    const d = subMonths(new Date(year, month - 1, 1), 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const nextMonth = () => {
    const d = addMonths(new Date(year, month - 1, 1), 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const pretty = format(parse(safeDate, "yyyy-MM-dd", new Date()), "eeee, d MMM yyyy");
  const isAtMin = safeDate <= minBookable;

  const mode = activity?.mode ?? "FIXED_SEAT_EVENT";
  const selectedDuration =
    activity?.durationOptions.find((d) => d.id === selectedDurationId) ?? null;
  const hybridMinUnits =
    mode === "HYBRID_UNIT_BOOKING"
      ? ceilDiv(Math.max(1, guests), Math.max(1, activity?.guestsPerUnit ?? 1))
      : 1;

  const requestedUnits = getRequestedUnits(mode, units, guests, activity);
  const stepMin = getIntervalMinutes(activity);

  return (
    <main className="mx-auto max-w-5xl px-0 sm:px-6 py-3 sm:py-6 space-y-8">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.no-spin::-webkit-outer-spin-button, .no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spin { -moz-appearance: textfield; appearance: textfield; }
@keyframes tFade {0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:none}}
@keyframes tShimmer {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes tGlowLine {0%,100%{opacity:.5;transform:scaleX(.9)}50%{opacity:.95;transform:scaleX(1)}}
@keyframes tPulseSoft {0%,100%{opacity:1;transform:none} 50%{opacity:.96; transform:translateY(-1px)}}
@media (prefers-reduced-motion: reduce){ .t-anim{animation:none!important} }
          `.trim(),
        }}
      />

      <div className="text-center mb-8 mt-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,200,80,0.25)]">
          {t("timetable.title")}
        </h1>
        <div className="mx-auto mt-2 h-[3px] w-32 rounded-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-[pulse_7s_ease-in-out_infinite]" />
        <p className="mt-3 text-sm text-muted-foreground opacity-80">
          {t("timetable.subtitle2")}
        </p>
      </div>

      <section
        className="relative rounded-2xl overflow-hidden t-anim"
        style={{ animation: "tFade .35s ease-out" }}
      >
        <div className="-mx-4 px-2 py-4 sm:mx-0 sm:p-6">
          <MonthCalendar
            year={year}
            month={month}
            data={heat}
            onPick={onPickDay}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            minDate={minBookable}
            selectedDate={safeDate}
          />
        </div>
      </section>

      <div className="mx-auto max-w-5xl">
        <div className="relative rounded-2xl">
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            aria-hidden
            style={{
              background:
                "linear-gradient(90deg, rgba(147,51,234,.45), rgba(255,210,80,.4), rgba(176,136,248,.45))",
              padding: 1,
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          <div
            className="relative rounded-[calc(theme(borderRadius.2xl)-1px)] px-3 py-2 border border-[--color-border]"
            style={{
              background:
                "radial-gradient(120% 140% at 10% -40%, rgba(147,51,234,.16), transparent 55%), radial-gradient(120% 140% at 90% 140%, rgba(255,210,80,.12), transparent 55%), linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02))",
            }}
          >
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goPrevDay}
                disabled={loading || isAtMin}
                className="rounded-lg px-3 py-1.5 text-sm border border-white/10 bg-black/30 hover:bg-black/40 disabled:opacity-40 transition"
              >
                ‹
              </button>

              <input
                type="date"
                value={safeDate}
                min={minBookable}
                onChange={(e) => onDateInputChange(e.target.value)}
                className="rounded-lg px-3 py-1.5 text-sm border border-white/10 bg-black/25 outline-none focus:ring-2 focus:ring-amber-400/40"
              />

              <button
                type="button"
                onClick={goNextDay}
                disabled={loading}
                className="rounded-lg px-3 py-1.5 text-sm border border-white/10 bg-black/30 hover:bg-black/40 disabled:opacity-40 transition"
              >
                ›
              </button>

              {mode === "FIXED_SEAT_EVENT" && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm opacity-70">{t("timetable.controls.party")}</span>
                  <div className="flex items-center rounded-lg border border-white/10 bg-black/25">
                    <button
                      className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                      onClick={() => onPartyChange(partySize - 1)}
                      disabled={loading}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={partySize}
                      onChange={(e) => onPartyChange(Number(e.target.value))}
                      className="no-spin w-16 bg-transparent px-2 py-1.5 text-center outline-none"
                    />
                    <button
                      className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                      onClick={() => onPartyChange(partySize + 1)}
                      disabled={loading}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {mode !== "FIXED_SEAT_EVENT" && (
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <select
                    value={selectedDurationId}
                    onChange={(e) => {
                      setSelectedTime("");
                      setSelectedDurationId(e.target.value);
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm border border-white/10 bg-black/25 outline-none"
                  >
                    <option value="">{t("timetable.chooseTime")}</option>
                    {activity?.durationOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label || `${d.durationMin} min`} — €{formatMoney(d.priceCents)}
                      </option>
                    ))}
                  </select>

                  {mode === "DYNAMIC_RENTAL" && (
                    <div className="flex items-center rounded-lg border border-white/10 bg-black/25">
                      <button
                        className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                        onClick={() => onUnitsChange(units - 1)}
                        disabled={loading}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={activity?.maxUnitsPerBooking ?? 20}
                        value={units}
                        onChange={(e) => onUnitsChange(Number(e.target.value))}
                        className="no-spin w-16 bg-transparent px-2 py-1.5 text-center outline-none"
                      />
                      <button
                        className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                        onClick={() => onUnitsChange(units + 1)}
                        disabled={loading}
                      >
                        +
                      </button>
                    </div>
                  )}

                  {mode === "HYBRID_UNIT_BOOKING" && (
                    <>
                      <div className="flex items-center rounded-lg border border-white/10 bg-black/25">
                        <button
                          className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                          onClick={() => onGuestsChange(guests - 1)}
                          disabled={loading}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={guests}
                          onChange={(e) => onGuestsChange(Number(e.target.value))}
                          className="no-spin w-16 bg-transparent px-2 py-1.5 text-center outline-none"
                        />
                        <button
                          className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                          onClick={() => onGuestsChange(guests + 1)}
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center rounded-lg border border-white/10 bg-black/25">
                        <button
                          className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                          onClick={() => onUnitsChange(units - 1)}
                          disabled={loading}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={hybridMinUnits}
                          max={activity?.maxUnitsPerBooking ?? 20}
                          value={units}
                          onChange={(e) => onUnitsChange(Number(e.target.value))}
                          className="no-spin w-16 bg-transparent px-2 py-1.5 text-center outline-none"
                        />
                        <button
                          className="px-3 py-1.5 text-sm hover:bg-black/30 transition"
                          onClick={() => onUnitsChange(units + 1)}
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs opacity-60">
          {t("timetable.timezonePrefix")} <strong>{TIMEZONE}</strong>.
        </p>
      </div>

      <div className="mx-auto max-w-5xl pt-2 text-center">
        <div className="inline-block">
          <h1
            className="text-2xl md:text-[28px] font-semibold tracking-tight t-anim"
            style={{ animation: "tPulseSoft 6.5s ease-in-out infinite" }}
          >
            <span className="bg-gradient-to-r from-white via-amber-200 to-violet-200 bg-clip-text text-transparent">
              {t("timetable.chooseTime")}
            </span>
          </h1>
        </div>
        <div
          className="mt-2 h-[3px] w-36 mx-auto rounded-full bg-gradient-to-r from-transparent via-amber-400/85 to-transparent"
          style={{ animation: "tGlowLine 3s ease-in-out infinite" }}
        />
        <p className="mt-2 text-sm text-muted-foreground">{pretty}</p>
      </div>

      {mode !== "FIXED_SEAT_EVENT" && (
        <div className="rounded-2xl border border-[--color-border] p-4 text-sm opacity-80">
          <div>{mode === "DYNAMIC_RENTAL" ? "Rental booking" : "Hybrid booking"}</div>
          <div className="mt-1 opacity-70">
            {selectedTime ? `Start: ${selectedTime}` : "Choose one of the available start times below"} ·{" "}
            {selectedDuration
              ? `Duration: ${selectedDuration.label || `${selectedDuration.durationMin} min`}`
              : "Choose a duration"}
            {mode === "DYNAMIC_RENTAL" && ` · Units: ${units}`}
            {mode === "HYBRID_UNIT_BOOKING" &&
              ` · Guests: ${guests} · Units: ${units} (min ${hybridMinUnits})`}
            {activity?.slotIntervalMin ? ` · Step: ${activity.slotIntervalMin} min` : ""}
          </div>
        </div>
      )}

      <section className="grid gap-5">
        {loading && (
          <div className="rounded-2xl border border-[--color-border] p-5">
            <div
              className="h-4 w-40 rounded bg-[linear-gradient(90deg,#1f1f1f,#2a2a2a,#1f1f1f)] bg-[length:200%_100%]"
              style={{ animation: "tShimmer 1.2s ease-in-out infinite" }}
            />
            <div
              className="mt-4 h-12 rounded bg-[linear-gradient(90deg,#1f1f1f,#2a2a2a,#1f1f1f)] bg-[length:200%_100%]"
              style={{ animation: "tShimmer 1.2s ease-in-out infinite" }}
            />
          </div>
        )}

        {!loading && slots.length === 0 && (
          <div className="rounded-2xl border border-[--color-border] p-6 text-sm text-center opacity-80">
            {t("timetable.noSlots")}
          </div>
        )}

        {!loading &&
          slots.map((s) => {
            if (s.kind === "fixed") {
              const disabled = !s.canFit;
              const start = new Date(s.start);
              const end = s.end ? new Date(s.end) : null;

              return (
                <div
                  key={s.id}
                  className="relative overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-card] p-5 sm:p-6"
                >
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">
                        {format(start, "HH:mm")}
                        {end ? `–${format(end, "HH:mm")}` : ""}
                      </div>
                      <div className="mt-1 text-xs opacity-70">
                        {t("timetable.remaining")}: {s.remaining}
                      </div>
                    </div>

                    <div className="flex items-end gap-6 sm:items-center">
                      <div className="text-right">
                        <div className="text-xs opacity-70">
                          €{formatMoney(s.unitPrice)} {t("timetable.perPerson")}
                        </div>
                        <div className="text-xl font-semibold">
                          €{formatMoney(s.totalPrice)} {t("timetable.total")}
                        </div>
                      </div>

                      <button
                        disabled={disabled || loading}
                        onClick={() => handleChooseSlot(s.id)}
                        className={`inline-flex h-11 items-center rounded-[12px] px-5 text-sm font-medium text-white border border-white/10 ${
                          disabled || loading
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:scale-[1.02]"
                        } transition-transform duration-300`}
                        style={{
                          backgroundColor:
                            "color-mix(in oklab, var(--accent-500) 95%, black)",
                        }}
                      >
                        {disabled ? t("timetable.notEnough") : t("timetable.choose")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            const timeOptions = buildTimeOptions({
              slot: s,
              safeDate,
              durationMin: selectedDuration?.durationMin ?? null,
              stepMin,
              requestedUnits,
            });

            const activeOption =
              selectedTime && timeOptions.find((opt) => opt.value === selectedTime) ? selectedTime : "";

            const disabled =
              !selectedDuration ||
              !activeOption ||
              !s.canFit;

            const windowStart = new Date(s.availableWindowStart);
            const windowEnd = s.availableWindowEnd ? new Date(s.availableWindowEnd) : null;

            return (
              <div
                key={s.id}
                className="relative overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-card] p-5 sm:p-6"
              >
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">
                        {format(windowStart, "HH:mm")}
                        {windowEnd ? `–${format(windowEnd, "HH:mm")}` : ""}
                      </div>

                      <div className="mt-1 text-xs opacity-70">
                        {!selectedDuration ? (
                          <>Choose a duration to unlock valid start times</>
                        ) : activeOption && s.bookingStartAt && s.bookingEndAt ? (
                          <>
                            {format(new Date(s.bookingStartAt), "HH:mm")}–{format(
                              new Date(s.bookingEndAt),
                              "HH:mm",
                            )}
                          </>
                        ) : (
                          <>Choose one of the valid start times below</>
                        )}
                      </div>

                      {selectedDuration && (
                        <div className="mt-3">
                          <div className="mb-2 text-xs font-medium text-white/80">
                            Available start times
                          </div>
                          {timeOptions.length === 0 ? (
                            <div className="text-xs text-amber-300">
                              No valid start times for the selected duration.
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {timeOptions.map((opt) => {
                                const chipActive = activeOption === opt.value;
                                return (
                                  <button
                                    key={`${s.id}-${opt.value}`}
                                    type="button"
                                    disabled={!opt.canFit || loading}
                                    onClick={() => setSelectedTime(opt.value)}
                                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                                      chipActive
                                        ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.12)]"
                                        : opt.canFit
                                        ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                                        : "border-white/5 bg-white/[0.03] text-white/30 cursor-not-allowed"
                                    }`}
                                    title={
                                      opt.canFit
                                        ? `${opt.label} • ${opt.availableUnits} units free`
                                        : `${opt.label} • not enough units`
                                    }
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {!selectedDuration && (
                        <div className="mt-2 text-xs opacity-60">
                          Pick duration first, then choose a suggested start time.
                        </div>
                      )}

                      {selectedDuration && activeOption && (
                        <div className="mt-3 text-xs opacity-70">
                          Remaining units: {s.remainingUnits ?? 0}
                          {typeof s.requiredUnits === "number" && s.requiredUnits > 0 && (
                            <span className="ml-2">Required units: {s.requiredUnits}</span>
                          )}
                        </div>
                      )}

                      {!!s.errors?.length && (
                        <div className="mt-2 text-xs text-amber-300">{s.errors[0]}</div>
                      )}
                    </div>

                    <div className="flex items-end gap-6 sm:items-center">
                      <div className="text-right">
                        <div className="text-xs opacity-70">
                          €{formatMoney(s.unitPrice ?? 0)} / unit
                        </div>
                        <div className="text-xl font-semibold">
                          €{formatMoney(s.totalPrice ?? 0)} {t("timetable.total")}
                        </div>
                        {s.pricingLabel && (
                          <div className="mt-1 text-xs opacity-60">{s.pricingLabel}</div>
                        )}
                      </div>

                      <button
                        disabled={disabled || loading}
                        onClick={() => handleChooseSlot(s.id)}
                        className={`inline-flex h-11 items-center rounded-[12px] px-5 text-sm font-medium text-white border border-white/10 ${
                          disabled || loading
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:scale-[1.02]"
                        } transition-transform duration-300`}
                        style={{
                          backgroundColor:
                            "color-mix(in oklab, var(--accent-500) 95%, black)",
                        }}
                      >
                        {disabled ? t("timetable.notEnough") : t("timetable.choose")}
                      </button>
                    </div>
                  </div>

                  <AvailabilityTimeline
                    mode={mode}
                    windowStart={s.availableWindowStart}
                    windowEnd={s.availableWindowEnd}
                    selectedStart={s.bookingStartAt ?? null}
                    selectedEnd={s.bookingEndAt ?? null}
                    capacity={s.capacity}
                    remainingUnits={s.remainingUnits ?? null}
                    reservedUnits={s.reservedUnits ?? null}
                    requiredUnits={s.requiredUnits ?? null}
                    bookedRanges={s.bookedRanges ?? []}
                  />
                </div>
              </div>
            );
          })}
      </section>
    </main>
  );
}