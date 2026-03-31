"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays, addMonths, subMonths, parse } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";
import MonthCalendar from "@/components/MonthCalendar";
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

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getBookingStepMinutes(activity: ActivityInfo | null) {
  if (!activity) return 5;
  if (activity.mode === "FIXED_SEAT_EVENT") {
    return Math.max(5, activity.slotIntervalMin ?? 30);
  }
  return 5;
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

function modeLabel(mode: ActivityMode) {
  if (mode === "FIXED_SEAT_EVENT") return "Guided experience";
  if (mode === "DYNAMIC_RENTAL") return "Flexible rental";
  return "Hybrid booking";
}

function cardClass() {
  return "rounded-[1.6rem] border border-white/10 bg-[#070b16] p-4 sm:p-5 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.95)]";
}

function fieldClass() {
  return "rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3";
}

function chunkTimeOptions(options: TimeOption[], size = 24) {
  if (options.length <= size) return options;

  const result: TimeOption[] = [];
  const step = options.length / size;

  for (let i = 0; i < size; i++) {
    const index = Math.min(options.length - 1, Math.floor(i * step));
    result.push(options[index]);
  }

  return result;
}

function availabilityTone(opt: TimeOption, requestedUnits: number) {
  if (!opt.canFit) return "bg-white/10";
  if (opt.availableUnits >= requestedUnits + 2) return "bg-emerald-400/85";
  if (opt.availableUnits >= requestedUnits + 1) return "bg-emerald-300/70";
  return "bg-amber-300/75";
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
    if (!s) return;
    const clamped = clampToMin(s);
    const d = parse(clamped, "yyyy-MM-dd", new Date());
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
    setSelectedTime("");
    setQuery({ date: clamped, startTime: "" });
  };

  const goPrevDay = () => {
    const d = parse(`${safeDate}`, "yyyy-MM-dd", new Date());
    const next = ymd(addDays(d, -1));
    const clamped = clampToMin(next);
    const parsed = parse(clamped, "yyyy-MM-dd", new Date());
    setMonth(parsed.getMonth() + 1);
    setYear(parsed.getFullYear());
    setSelectedTime("");
    setQuery({ date: clamped, startTime: "" });
  };

  const goNextDay = () => {
    const d = parse(`${safeDate}`, "yyyy-MM-dd", new Date());
    const next = ymd(addDays(d, +1));
    const parsed = parse(next, "yyyy-MM-dd", new Date());
    setMonth(parsed.getMonth() + 1);
    setYear(parsed.getFullYear());
    setSelectedTime("");
    setQuery({ date: next, startTime: "" });
  };

  const onPickDay = (iso: string) => {
    const clamped = clampToMin(iso);
    const parsed = parse(clamped, "yyyy-MM-dd", new Date());
    setMonth(parsed.getMonth() + 1);
    setYear(parsed.getFullYear());
    setSelectedTime("");
    setQuery({ date: clamped, startTime: "" });
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
  const stepMin = getBookingStepMinutes(activity);

  const summaryBits: string[] = [];
  if (mode === "FIXED_SEAT_EVENT") summaryBits.push(`${partySize} guest${partySize === 1 ? "" : "s"}`);
  if (mode === "DYNAMIC_RENTAL") {
    if (selectedDuration) summaryBits.push(selectedDuration.label || `${selectedDuration.durationMin} min`);
    summaryBits.push(`${units} unit${units === 1 ? "" : "s"}`);
    if (selectedTime) summaryBits.push(`Start ${selectedTime}`);
  }
  if (mode === "HYBRID_UNIT_BOOKING") {
    summaryBits.push(`${guests} guest${guests === 1 ? "" : "s"}`);
    summaryBits.push(`${units} unit${units === 1 ? "" : "s"}`);
    if (selectedDuration) summaryBits.push(selectedDuration.label || `${selectedDuration.durationMin} min`);
    if (selectedTime) summaryBits.push(`Start ${selectedTime}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b16] px-5 py-7 sm:px-7 md:px-8 md:py-8">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(900px 320px at 50% -10%, rgba(56,189,248,0.14), transparent 60%), radial-gradient(700px 260px at 85% 10%, rgba(236,72,153,0.10), transparent 55%)",
          }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/72 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.65)]" />
            Booking flow
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {t("timetable.title")}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/64 sm:text-base">
            Choose your date and time, then continue to secure checkout.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
              {modeLabel(mode)}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78">
              {pretty}
            </span>
            {summaryBits.slice(0, 3).map((bit) => (
              <span
                key={bit}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78"
              >
                {bit}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5">
        <div className={cardClass()}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">Step 1</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Choose your date</h2>
            </div>

            <div className="text-xs text-white/48">
              All times in <span className="text-white/72">{TIMEZONE}</span>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-2 sm:p-3">
            <MonthCalendar
              key={`${year}-${month}-${safeDate}`}
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

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goPrevDay}
              disabled={loading || isAtMin}
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm text-white/90 transition hover:bg-white/[0.08] disabled:opacity-40"
            >
              ‹ Previous day
            </button>

            <input
              type="date"
              value={safeDate}
              min={minBookable}
              onChange={(e) => onDateInputChange(e.target.value)}
              className="inline-flex h-10 rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm text-white/90 outline-none focus:ring-2 focus:ring-fuchsia-400/25"
            />

            <button
              type="button"
              onClick={goNextDay}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-4 text-sm text-white/90 transition hover:bg-white/[0.08] disabled:opacity-40"
            >
              Next day ›
            </button>
          </div>
        </div>

        <div className={cardClass()}>
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">Step 2</p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {mode === "FIXED_SEAT_EVENT"
                ? "Choose your party size"
                : mode === "DYNAMIC_RENTAL"
                ? "Set your booking details"
                : "Set guests, units and duration"}
            </h2>
          </div>

          {mode === "FIXED_SEAT_EVENT" && (
            <div className={fieldClass()}>
              <div className="mb-2 text-sm font-medium text-white/88">Guests</div>
              <div className="flex items-center rounded-2xl border border-white/10 bg-black/20">
                <button
                  className="px-4 py-3 text-base text-white/80 transition hover:bg-white/5"
                  onClick={() => onPartyChange(partySize - 1)}
                  disabled={loading}
                  type="button"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={partySize}
                  onChange={(e) => onPartyChange(Number(e.target.value))}
                  className="no-spin w-20 bg-transparent px-2 py-3 text-center text-white outline-none"
                />
                <button
                  className="px-4 py-3 text-base text-white/80 transition hover:bg-white/5"
                  onClick={() => onPartyChange(partySize + 1)}
                  disabled={loading}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {mode === "DYNAMIC_RENTAL" && (
            <div className="grid gap-3">
              <div className={fieldClass()}>
                <div className="mb-2 text-sm font-medium text-white/88">Duration</div>
                <select
                  value={selectedDurationId}
                  onChange={(e) => {
                    setSelectedTime("");
                    setSelectedDurationId(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Choose duration</option>
                  {activity?.durationOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label || `${d.durationMin} min`} — €{formatMoney(d.priceCents)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={fieldClass()}>
                <div className="mb-2 text-sm font-medium text-white/88">Units</div>
                <div className="flex items-center rounded-2xl border border-white/10 bg-black/20">
                  <button
                    className="px-4 py-3 text-base text-white/80 transition hover:bg-white/5"
                    onClick={() => onUnitsChange(units - 1)}
                    disabled={loading}
                    type="button"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={activity?.maxUnitsPerBooking ?? 20}
                    value={units}
                    onChange={(e) => onUnitsChange(Number(e.target.value))}
                    className="no-spin w-20 bg-transparent px-2 py-3 text-center text-white outline-none"
                  />
                  <button
                    className="px-4 py-3 text-base text-white/80 transition hover:bg-white/5"
                    onClick={() => onUnitsChange(units + 1)}
                    disabled={loading}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "HYBRID_UNIT_BOOKING" && (
            <div className="grid gap-3">
              <div className={fieldClass()}>
                <div className="mb-2 text-sm font-medium text-white/88">Guests</div>
                <div className="flex items-center rounded-2xl border border-white/10 bg-black/20">
                  <button
                    className="px-4 py-3 text-base text-white/80 transition hover:bg-white/5"
                    onClick={() => onGuestsChange(guests - 1)}
                    disabled={loading}
                    type="button"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={guests}
                    onChange={(e) => onGuestsChange(Number(e.target.value))}
                    className="no-spin w-20 bg-transparent px-2 py-3 text-center text-white outline-none"
                  />
                  <button
                    className="px-4 py-3 text-base text-white/80 transition hover:bg-white/5"
                    onClick={() => onGuestsChange(guests + 1)}
                    disabled={loading}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={fieldClass()}>
                <div className="mb-2 text-sm font-medium text-white/88">Units</div>
                <div className="flex items-center rounded-2xl border border-white/10 bg-black/20">
                  <button
                    className="px-4 py-3 text-base text-white/80 transition hover:bg-white/5"
                    onClick={() => onUnitsChange(units - 1)}
                    disabled={loading}
                    type="button"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={hybridMinUnits}
                    max={activity?.maxUnitsPerBooking ?? 20}
                    value={units}
                    onChange={(e) => onUnitsChange(Number(e.target.value))}
                    className="no-spin w-20 bg-transparent px-2 py-3 text-center text-white outline-none"
                  />
                  <button
                    className="px-4 py-3 text-base text-white/80 transition hover:bg-white/5"
                    onClick={() => onUnitsChange(units + 1)}
                    disabled={loading}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <p className="mt-2 text-xs text-white/48">Minimum units needed: {hybridMinUnits}</p>
              </div>

              <div className={fieldClass()}>
                <div className="mb-2 text-sm font-medium text-white/88">Duration</div>
                <select
                  value={selectedDurationId}
                  onChange={(e) => {
                    setSelectedTime("");
                    setSelectedDurationId(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Choose duration</option>
                  {activity?.durationOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label || `${d.durationMin} min`} — €{formatMoney(d.priceCents)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className={cardClass()}>
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">Step 3</p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {mode === "FIXED_SEAT_EVENT" ? "Choose a time slot" : "Choose your start time"}
            </h2>
            <p className="mt-2 text-sm text-white/56">{pretty}</p>
          </div>

          {mode !== "FIXED_SEAT_EVENT" && !selectedDuration && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/62">
              Pick a duration first to unlock the available start times.
            </div>
          )}

          <div className="grid gap-4">
            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-14 animate-pulse rounded-2xl bg-white/10" />
              </div>
            )}

            {!loading && slots.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/62">
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
                    <div key={s.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xl font-semibold text-white">
                            {format(start, "HH:mm")}
                            {end ? `–${format(end, "HH:mm")}` : ""}
                          </div>
                          <div className="mt-1 text-sm text-white/56">
                            {s.remaining} spot{s.remaining === 1 ? "" : "s"} left
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:items-end">
                          <div className="text-right">
                            <div className="text-xs uppercase tracking-[0.18em] text-white/40">Total</div>
                            <div className="mt-1 text-2xl font-semibold text-white">
                              €{formatMoney(s.totalPrice)}
                            </div>
                            <div className="mt-1 text-xs text-white/50">
                              €{formatMoney(s.unitPrice)} {t("timetable.perPerson")}
                            </div>
                          </div>

                          <button
                            disabled={disabled || loading}
                            onClick={() => handleChooseSlot(s.id)}
                            className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-white transition ${
                              disabled || loading
                                ? "cursor-not-allowed border border-white/10 bg-white/10 opacity-40"
                                : "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] hover:scale-[1.02]"
                            }`}
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

                const validOptions = timeOptions.filter((opt) => opt.canFit);
                const activeOption =
                  selectedTime && validOptions.find((opt) => opt.value === selectedTime)
                    ? selectedTime
                    : "";
                const quickOptions = validOptions.slice(0, 10);
                const disabled = !selectedDuration || !activeOption || !s.canFit;

                return (
                  <div key={s.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-xl font-semibold text-white">
                            {format(new Date(s.availableWindowStart), "HH:mm")}
                            {s.availableWindowEnd ? `–${format(new Date(s.availableWindowEnd), "HH:mm")}` : ""}
                          </div>
                          <div className="mt-1 text-sm text-white/56">
                            {validOptions.length > 0
                              ? `${validOptions.length} available start time${validOptions.length === 1 ? "" : "s"}`
                              : "No start times available with the current setup"}
                          </div>
                          {!!s.errors?.length && (
                            <div className="mt-2 text-xs text-amber-300">{s.errors[0]}</div>
                          )}
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-xs uppercase tracking-[0.18em] text-white/40">Total</div>
                          <div className="mt-1 text-2xl font-semibold text-white">
                            €{formatMoney(s.totalPrice ?? 0)}
                          </div>
                          <div className="mt-1 text-xs text-white/50">
                            €{formatMoney(s.unitPrice ?? 0)} / unit
                          </div>
                        </div>
                      </div>

                      {selectedDuration && (
                        <>
                          <div>
                            <div className="mb-3 text-sm font-medium text-white/88">Quick start times</div>
                            <div className="flex flex-wrap gap-2">
                              {quickOptions.length > 0 ? (
                                quickOptions.map((opt) => {
                                  const active = activeOption === opt.value;
                                  return (
                                    <button
                                      key={`${s.id}-quick-${opt.value}`}
                                      type="button"
                                      onClick={() => setSelectedTime(opt.value)}
                                      disabled={loading}
                                      className={`rounded-full border px-3 py-2 text-xs transition ${
                                        active
                                          ? "border-fuchsia-300/50 bg-fuchsia-400/15 text-fuchsia-100"
                                          : "border-white/10 bg-white/5 text-white/78 hover:bg-white/10"
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="text-sm text-white/52">No valid quick times available.</div>
                              )}
                            </div>
                          </div>

                          {validOptions.length > 0 && (
                            <div className={fieldClass()}>
                              <div className="mb-2 text-sm font-medium text-white/88">Or choose any available start time</div>
                              <select
                                value={activeOption}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                disabled={loading}
                                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                              >
                                <option value="">Choose start time</option>
                                {validOptions.map((opt) => (
                                  <option key={`${s.id}-${opt.value}`} value={opt.value}>
                                    {opt.label} · {opt.availableUnits} free
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {activeOption && (
                            <div className="text-sm text-white/58">
                              Selected start time: <span className="text-white/82">{activeOption}</span>
                              {typeof s.requiredUnits === "number" && s.requiredUnits > 0 && (
                                <span className="ml-2">
                                  · Required units: <span className="text-white/82">{s.requiredUnits}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {validOptions.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-white/88">Availability across the window</div>
                              <div className="mt-1 text-xs text-white/50">
                                Darker bars mean less availability. Highlighted bar = selected start time.
                              </div>
                            </div>

                            <div className="text-xs text-white/48">
                              {validOptions[0]?.label} – {validOptions[validOptions.length - 1]?.label}
                            </div>
                          </div>

                          <div className="mt-4 flex items-end gap-1">
                            {chunkTimeOptions(validOptions, 28).map((opt) => {
                              const isActive = activeOption === opt.value;
                              const barHeight = Math.max(
                                14,
                                Math.min(42, 14 + opt.availableUnits * 6)
                              );

                              return (
                                <button
                                  key={`${s.id}-availability-${opt.value}`}
                                  type="button"
                                  onClick={() => setSelectedTime(opt.value)}
                                  disabled={loading}
                                  title={`${opt.label} · ${opt.availableUnits} free`}
                                  className={`group relative flex-1 rounded-full transition ${
                                    isActive ? "ring-2 ring-fuchsia-300/70" : ""
                                  }`}
                                >
                                  <div
                                    className={`w-full rounded-full transition group-hover:opacity-90 ${availabilityTone(
                                      opt,
                                      requestedUnits
                                    )}`}
                                    style={{ height: `${barHeight}px` }}
                                  />
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-white/42">
                            <span>Lower availability</span>
                            <span>Higher availability</span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-4">
                        <div className="text-center text-sm text-white/54">
                          {selectedDuration
                            ? "Choose a valid start time, then continue."
                            : "Pick a duration above to continue."}
                        </div>

                        <button
                          disabled={disabled || loading}
                          onClick={() => handleChooseSlot(s.id)}
                          className={`inline-flex h-11 min-w-[180px] items-center justify-center rounded-full px-6 text-sm font-medium text-white transition ${
                            disabled || loading
                              ? "cursor-not-allowed border border-white/10 bg-white/10 opacity-40"
                              : "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] hover:scale-[1.02]"
                          }`}
                        >
                          {disabled ? t("timetable.notEnough") : t("timetable.choose")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>
    </main>
  );
}