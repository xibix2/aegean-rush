// src/components/booking/AvailabilityTimeline.tsx
"use client";

import { format } from "date-fns";

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type BookedRange = {
  start: string;
  end: string;
  usedUnits?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pctBetween(point: Date, start: Date, end: Date) {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 0;
  const diff = point.getTime() - start.getTime();
  return clamp((diff / total) * 100, 0, 100);
}

export default function AvailabilityTimeline({
  mode,
  windowStart,
  windowEnd,
  selectedStart,
  selectedEnd,
  capacity,
  remainingUnits,
  reservedUnits,
  requiredUnits,
  bookedRanges = [],
}: {
  mode: ActivityMode;
  windowStart: string;
  windowEnd: string | null;
  selectedStart?: string | null;
  selectedEnd?: string | null;
  capacity: number;
  remainingUnits?: number | null;
  reservedUnits?: number | null;
  requiredUnits?: number | null;
  bookedRanges?: BookedRange[];
}) {
  const start = new Date(windowStart);
  const end = windowEnd ? new Date(windowEnd) : null;

  if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const selectedStartDate = selectedStart ? new Date(selectedStart) : null;
  const selectedEndDate = selectedEnd ? new Date(selectedEnd) : null;

  const hasSelectedRange =
    selectedStartDate &&
    selectedEndDate &&
    !Number.isNaN(selectedStartDate.getTime()) &&
    !Number.isNaN(selectedEndDate.getTime());

  const selectedLeft = hasSelectedRange
    ? pctBetween(selectedStartDate!, start, end)
    : 0;
  const selectedRight = hasSelectedRange
    ? pctBetween(selectedEndDate!, start, end)
    : 0;

  const selectedWidth = Math.max(0, selectedRight - selectedLeft);

  const usedUnits =
    typeof remainingUnits === "number" ? Math.max(0, capacity - remainingUnits) : null;

  const capacityPct =
    typeof remainingUnits === "number" && capacity > 0
      ? clamp((remainingUnits / capacity) * 100, 0, 100)
      : null;

  const modeLabel =
    mode === "DYNAMIC_RENTAL"
      ? "Rental window"
      : mode === "HYBRID_UNIT_BOOKING"
      ? "Hybrid window"
      : "Availability window";

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="font-medium text-white/90">{modeLabel}</div>
        <div className="text-white/60">
          {format(start, "HH:mm")} — {format(end, "HH:mm")}
        </div>
      </div>

      <div className="relative">
        <div className="relative h-4 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(168,85,247,0.14),rgba(250,204,21,0.14),rgba(168,85,247,0.14))]" />

          {bookedRanges.map((range, idx) => {
            const bStart = new Date(range.start);
            const bEnd = new Date(range.end);
            if (Number.isNaN(bStart.getTime()) || Number.isNaN(bEnd.getTime())) return null;

            const left = pctBetween(bStart, start, end);
            const right = pctBetween(bEnd, start, end);
            const width = Math.max(0, right - left);

            return (
              <div
                key={`${range.start}-${range.end}-${idx}`}
                className="absolute top-0 h-full rounded-full bg-rose-400/45 ring-1 ring-rose-300/30"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                }}
                title={`${format(bStart, "HH:mm")}–${format(bEnd, "HH:mm")}`}
              />
            );
          })}

          {hasSelectedRange && (
            <div
              className="absolute top-0 h-full rounded-full bg-emerald-400/70 shadow-[0_0_20px_rgba(52,211,153,0.35)] ring-1 ring-emerald-200/40"
              style={{
                left: `${selectedLeft}%`,
                width: `${selectedWidth}%`,
              }}
              title={`${format(selectedStartDate!, "HH:mm")}–${format(
                selectedEndDate!,
                "HH:mm",
              )}`}
            />
          )}
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-white/50">
          <span>{format(start, "HH:mm")}</span>
          <span>{format(end, "HH:mm")}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75">
          {hasSelectedRange ? (
            <>
              <span className="font-medium text-white/90">Selected range:</span>{" "}
              {format(selectedStartDate!, "HH:mm")}–{format(selectedEndDate!, "HH:mm")}
            </>
          ) : (
            <>
              <span className="font-medium text-white/90">Selected range:</span>{" "}
              choose start time and duration
            </>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75">
          <span className="font-medium text-white/90">Capacity:</span>{" "}
          {typeof remainingUnits === "number"
            ? `${remainingUnits} free / ${capacity} total`
            : `${capacity} total`}
          {typeof usedUnits === "number" && (
            <span className="ml-2 text-white/50">({usedUnits} in use)</span>
          )}
        </div>
      </div>

      {typeof capacityPct === "number" && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-white/50">
            <span>Availability</span>
            <span>{Math.round(capacityPct)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(234,179,8,.9),rgba(16,185,129,.9))]"
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>
      )}

      {(typeof reservedUnits === "number" || typeof requiredUnits === "number") && (
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {typeof reservedUnits === "number" && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/75">
              Reserved units: <span className="font-medium text-white/90">{reservedUnits}</span>
            </span>
          )}
          {typeof requiredUnits === "number" && requiredUnits > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/75">
              Required units: <span className="font-medium text-white/90">{requiredUnits}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}