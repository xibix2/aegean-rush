// src/components/MonthCalendar.tsx
"use client";

import React, { useCallback, useMemo } from "react";
import {
  endOfMonth,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfMonth,
} from "date-fns";
import { useT } from "@/components/I18nProvider";

type DayBucket = "none" | "low" | "medium" | "high" | "full";
export type DayInfo = {
  capacity: number;
  paid: number;
  remaining: number;
  bucket: DayBucket;
};

type Props = {
  year: number;
  month: number; // 1-12
  data: Record<string, DayInfo>;
  minDate?: string; // YYYY-MM-DD
  selectedDate?: string; // YYYY-MM-DD
  onPick?: (iso: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
};

function ymd(d: Date) {
  return format(d, "yyyy-MM-dd");
}
function clsx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const BUCKET_STYLES: Record<DayBucket, string> = {
  none: "border-white/8",
  low: "ring-1 ring-red-400/30",
  medium: "ring-1 ring-amber-300/30",
  high: "ring-1 ring-emerald-300/30",
  full: "opacity-60",
};

export default function MonthCalendar({
  year,
  month,
  data,
  minDate,
  selectedDate,
  onPick,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const t = useT();

  const base = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const start = useMemo(() => startOfMonth(base), [base]);
  const end = useMemo(() => endOfMonth(base), [base]);

  // Build a fixed 6x7 grid (Mon-first)
  const startIdx = start.getDay() === 0 ? 6 : start.getDay() - 1;
  const days: (Date | null)[] = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const day = new Date(start);
        day.setDate(day.getDate() - startIdx + i);
        return day;
      }),
    [start, startIdx],
  );

  const today = new Date();
  const min = minDate ? new Date(minDate + "T00:00:00") : undefined;

  /** Keyboard navigation from the current selectedDate */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onPick) return;

      const current = selectedDate
        ? new Date(selectedDate + "T00:00:00")
        : min ?? today;

      let delta = 0;
      if (e.key === "ArrowLeft") delta = -1;
      else if (e.key === "ArrowRight") delta = 1;
      else if (e.key === "ArrowUp") delta = -7;
      else if (e.key === "ArrowDown") delta = 7;
      else return;

      e.preventDefault();

      const next = new Date(current);
      next.setDate(current.getDate() + delta);

      // Respect minDate if provided
      if (min && isBefore(next, min)) return;

      const nextIso = ymd(next);

      // If we moved to a different month, ask parent to change the month
      const movedMonth =
        next.getMonth() !== base.getMonth() ||
        next.getFullYear() !== base.getFullYear();
      if (movedMonth) {
        if (next < base) onPrevMonth?.();
        else onNextMonth?.();
      }

      onPick(nextIso);
    },
    [onPick, selectedDate, min, today, base, onPrevMonth, onNextMonth],
  );

  // Localized labels
  const weekLabels = [
    t("calendar.mon") || "Mon",
    t("calendar.tue") || "Tue",
    t("calendar.wed") || "Wed",
    t("calendar.thu") || "Thu",
    t("calendar.fri") || "Fri",
    t("calendar.sat") || "Sat",
    t("calendar.sun") || "Sun",
  ];
  const txtToday = t("calendar.today") || "Today";
  const legendMany = t("calendar.legend.many") || "many left";
  const legendSome = t("calendar.legend.some") || "some left";
  const legendLow = t("calendar.legend.low") || "low";
  const legendFull = t("calendar.legend.full") || "full";
  const legendLeft = t("calendar.legend.left") || "left";
  const ariaPrev = t("calendar.prevMonth") || "Previous month";
  const ariaNext = t("calendar.nextMonth") || "Next month";

  return (
    <div
      // ✅ FIX: On mobile, make the calendar a hair narrower than the viewport,
      // so it doesn't get clipped by body { overflow-x: hidden }.
      // Keeps normal full width on sm+.
      className="relative mx-auto w-[calc(100%-24px)] sm:w-full rounded-2xl border border-[--color-border] bg-[--color-card] overflow-hidden"
      role="region"
      aria-label={format(base, "MMMM yyyy")}
    >
      {/* local styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes mc-twinkle { 0%,100%{opacity:.05} 50%{opacity:.12} }
@keyframes mc-iris { 0%,100%{opacity:.18; transform:translate(-50%, -50%) scale(1)} 50%{opacity:.26; transform:translate(-50%, -50%) scale(1.05)} }
@media (prefers-reduced-motion: reduce){ .mc-anim { animation: none !important; } }
          `.trim(),
        }}
      />

      {/* Accent-aware animated background (inside the border) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(1200px 700px at 50% -10%, color-mix(in oklab, var(--accent-600), transparent 86%), transparent 65%),
              radial-gradient(900px 600px at 20% 80%, color-mix(in oklab, var(--accent-500), transparent 90%), transparent 70%),
              radial-gradient(900px 600px at 85% 80%, color-mix(in oklab, var(--accent-500), transparent 90%), transparent 70%)
            `,
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay mc-anim"
          style={{
            animation: "mc-twinkle 6s ease-in-out infinite",
            opacity: 0.12,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 42 42'%3E%3Ccircle cx='3' cy='3' r='1' fill='%23ffffff' fill-opacity='0.35'/%3E%3Ccircle cx='22' cy='14' r='1' fill='%23ffffff' fill-opacity='0.3'/%3E%3Ccircle cx='12' cy='30' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3Ccircle cx='36' cy='36' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          className="absolute left-1/2 top-10 h-[240px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-[999px] blur-3xl mc-anim"
          style={{
            animation: "mc-iris 10s ease-in-out infinite",
            background:
              "radial-gradient(60% 100% at 50% 50%, color-mix(in oklab, var(--accent-500), transparent 75%), color-mix(in oklab, var(--accent-600), transparent 84%) 55%, transparent 70%)",
          }}
        />
      </div>

      {/* Header (tighter on mobile) */}
      <div className="relative z-10 flex items-center justify-between px-1.5 py-1.5 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-[--color-border] bg-white/[0.05] text-sm hover:bg-white/[0.08]"
          aria-label={ariaPrev}
          title={ariaPrev}
        >
          ‹
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0 rounded-full border border-[--color-border] bg-white/[0.06] px-2 py-1 text-xs sm:text-sm tracking-tight truncate">
            {format(base, "MMMM yyyy")}
          </div>
          {isSameMonth(today, base) ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] sm:text-xs"
              style={{
                border:
                  "1px solid color-mix(in oklab, var(--accent-400), transparent 70%)",
                background:
                  "color-mix(in oklab, var(--accent-400), transparent 88%)",
                color:
                  "color-mix(in oklab, var(--accent-200, #fff), transparent 30%)",
              }}
            >
              {txtToday}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-[--color-border] bg-white/[0.05] text-sm hover:bg-white/[0.08]"
          aria-label={ariaNext}
          title={ariaNext}
        >
          ›
        </button>
      </div>

      {/* Week headings (wider: less padding + smaller gap) */}
      <div className="relative z-10 grid grid-cols-7 gap-[2px] sm:gap-2 px-1.5 pb-1.5 sm:px-4 sm:pb-3">
        {weekLabels.map((w) => (
          <div
            key={w}
            className="py-1 sm:py-2 text-center text-[10px] sm:text-xs uppercase tracking-wide opacity-70"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Days grid (wider + shorter) */}
      <div
        className="relative z-10 grid grid-cols-7 gap-[2px] sm:gap-2 px-1.5 pb-1.5 sm:px-4 sm:pb-3 outline-none"
        role="grid"
        aria-readonly="false"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {days.map((d, i) => {
          if (!d) return <div key={i} role="presentation" />;

          const iso = ymd(d);
          const info = data[iso];
          const inThisMonth = d.getMonth() === base.getMonth();

          // Disable:
          // - dates before minDate (if provided)
          // - ALL out-of-month cells (so users change month via nav)
          const disableForMin = !!(min && isBefore(d, min));
          const disabled = disableForMin || !inThisMonth;

          const isTodayFlag = isToday(d);
          const isSelected = selectedDate === iso;

          const bucket: DayBucket =
            info?.bucket ?? (info?.remaining ? "medium" : "none");

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onPick?.(iso)}
              role="gridcell"
              aria-selected={isSelected || undefined}
              className={clsx(
                // ✅ shorter on mobile
                "relative h-10 sm:h-20 rounded-lg sm:rounded-xl border px-1 sm:px-2 text-left transition focus:outline-none",
                inThisMonth
                  ? "border-[--color-border] bg-white/[0.02]"
                  : "border-white/5 bg-white/[0.01]",
                BUCKET_STYLES[bucket],
                disabled
                  ? "opacity-45 cursor-not-allowed [background-image:repeating-linear-gradient(135deg,transparent_0,transparent_6px,rgba(255,255,255,0.03)_6px,rgba(255,255,255,0.03)_12px)]"
                  : "hover:shadow-[0_8px_24px_-16px_color-mix(in_oklab,var(--accent-500),transparent_55%)]",
                isSelected && "ring-2",
              )}
              style={
                isSelected
                  ? {
                      boxShadow:
                        "0 10px 26px -18px color-mix(in oklab, var(--accent-500), transparent 40%)",
                      borderColor:
                        "color-mix(in oklab, var(--accent-500), transparent 40%)",
                      outline:
                        "2px solid color-mix(in oklab, var(--accent-500), transparent 30%)",
                    }
                  : undefined
              }
            >
              {/* day number + "today" pill */}
              <div className="flex items-start justify-between">
                <span
                  className={clsx(
                    "text-xs sm:text-sm",
                    disabled && "opacity-60",
                    isSelected && "font-semibold",
                  )}
                >
                  {d.getDate()}
                </span>
                {isTodayFlag && (
                  <span
                    className="rounded-full px-1 py-0.5 text-[9px] sm:text-[10px] opacity-85"
                    style={{
                      border:
                        "1px solid color-mix(in oklab, var(--accent-400), transparent 70%)",
                      background:
                        "color-mix(in oklab, var(--accent-400), transparent 88%)",
                    }}
                  >
                    {txtToday}
                  </span>
                )}
              </div>

              {/* capacity bar + mini numbers */}
              {info ? (
                <div className="absolute inset-x-1 bottom-1 sm:inset-x-2 sm:bottom-2">
                  <div className="mb-0.5 flex items-center justify-between text-[9px] sm:text-[10px] opacity-70">
                    <span>
                      {info.remaining}/{info.capacity} {legendLeft}
                    </span>
                    <span className="opacity-70">{info.capacity}</span>
                  </div>
                  <div className="h-[4px] sm:h-[6px] w-full rounded-full bg-white/10">
                    <div
                      className={clsx(
                        "h-[4px] sm:h-[6px] rounded-full",
                        info.remaining <= 0
                          ? "bg-red-400/80"
                          : info.remaining / (info.capacity || 1) >= 0.67
                            ? "bg-emerald-400/80"
                            : info.remaining / (info.capacity || 1) >= 0.34
                              ? "bg-amber-300/80"
                              : "bg-red-400/80",
                      )}
                      style={{
                        width: `${
                          info.capacity > 0
                            ? Math.max(
                                4,
                                Math.min(
                                  100,
                                  Math.round(
                                    (info.remaining / info.capacity) * 100,
                                  ),
                                ),
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {/* subtle inner glow when selected (accent-aware) */}
              {isSelected && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl"
                  style={{
                    boxShadow:
                      "inset 0 0 0 1px color-mix(in oklab, var(--accent-400), transparent 70%), 0 0 0 6px color-mix(in oklab, var(--accent-500), transparent 90%)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend (tighter on mobile) */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 sm:gap-4 border-t border-[--color-border] px-1.5 py-2 sm:px-4">
        {[
          { c: "#34d399", label: legendMany },
          { c: "#fbbf24", label: legendSome },
          { c: "#fb7185", label: legendLow },
          { c: "#ef4444", label: legendFull },
        ].map((it) => (
          <span
            key={it.label}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs opacity-85"
          >
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: it.c }}
            />
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}