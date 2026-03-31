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

const BUCKET_ACCENTS: Record<DayBucket, string> = {
  none: "border-white/8",
  low: "shadow-[inset_0_0_0_1px_rgba(251,113,133,0.18)]",
  medium: "shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)]",
  high: "shadow-[inset_0_0_0_1px_rgba(52,211,153,0.18)]",
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

  const startIdx = start.getDay() === 0 ? 6 : start.getDay() - 1;
  const days: Date[] = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const day = new Date(start);
        day.setDate(day.getDate() - startIdx + i);
        return day;
      }),
    [start, startIdx]
  );

  const today = new Date();
  const min = minDate ? new Date(minDate + "T00:00:00") : undefined;

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

      if (min && isBefore(next, min)) return;

      const nextIso = ymd(next);

      const movedMonth =
        next.getMonth() !== base.getMonth() ||
        next.getFullYear() !== base.getFullYear();

      if (movedMonth) {
        if (next < base) onPrevMonth?.();
        else onNextMonth?.();
      }

      onPick(nextIso);
    },
    [onPick, selectedDate, min, today, base, onPrevMonth, onNextMonth]
  );

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
      className="relative mx-auto w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a1020]"
      role="region"
      aria-label={format(base, "MMMM yyyy")}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes mcGlow {
  0%,100% { opacity: .16; transform: translateY(0px) scale(1); }
  50% { opacity: .26; transform: translateY(-4px) scale(1.03); }
}
@keyframes mcTwinkle {
  0%,100% { opacity: .04; }
  50% { opacity: .1; }
}
@media (prefers-reduced-motion: reduce) {
  .mc-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 300px at 50% -10%, rgba(99,102,241,0.10), transparent 60%), radial-gradient(700px 260px at 15% 100%, rgba(236,72,153,0.08), transparent 65%), radial-gradient(700px 260px at 100% 0%, rgba(34,211,238,0.06), transparent 55%)",
          }}
        />
        <div
          className="mc-anim absolute inset-0 mix-blend-overlay"
          style={{
            animation: "mcTwinkle 7s ease-in-out infinite",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 42 42'%3E%3Ccircle cx='3' cy='3' r='1' fill='%23ffffff' fill-opacity='0.28'/%3E%3Ccircle cx='22' cy='14' r='1' fill='%23ffffff' fill-opacity='0.22'/%3E%3Ccircle cx='12' cy='30' r='1' fill='%23ffffff' fill-opacity='0.18'/%3E%3Ccircle cx='36' cy='36' r='1' fill='%23ffffff' fill-opacity='0.16'/%3E%3C/svg%3E\")",
          }}
        />
        <div
          className="mc-anim absolute left-1/2 top-8 h-28 w-[420px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            animation: "mcGlow 8s ease-in-out infinite",
            background:
              "radial-gradient(circle, rgba(129,140,248,0.16) 0%, rgba(236,72,153,0.08) 45%, transparent 72%)",
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 pb-2 pt-4 sm:px-5">
        <button
          type="button"
          onClick={onPrevMonth}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-sm text-white/90 transition hover:bg-white/[0.09]"
          aria-label={ariaPrev}
          title={ariaPrev}
        >
          ‹
        </button>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-1.5 text-sm font-medium text-white/90">
            {format(base, "MMMM yyyy")}
          </div>
          {isSameMonth(today, base) ? (
            <span className="rounded-full border border-fuchsia-300/18 bg-fuchsia-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-fuchsia-100/80">
              {txtToday}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-sm text-white/90 transition hover:bg-white/[0.09]"
          aria-label={ariaNext}
          title={ariaNext}
        >
          ›
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-7 gap-2 px-4 pb-2 pt-1 sm:px-5">
        {weekLabels.map((w) => (
          <div
            key={w}
            className="py-1 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-white/42 sm:text-[11px]"
          >
            {w}
          </div>
        ))}
      </div>

      <div
        className="relative z-10 grid grid-cols-7 gap-2 px-4 pb-4 sm:px-5"
        role="grid"
        aria-readonly="false"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {days.map((d, i) => {
          const iso = ymd(d);
          const info = data[iso];
          const inThisMonth = d.getMonth() === base.getMonth();

          const disableForMin = !!(min && isBefore(d, min));
          const disabled = disableForMin || !inThisMonth;

          const isTodayFlag = isToday(d);
          const isSelected = selectedDate === iso;

          const bucket: DayBucket =
            info?.bucket ?? (info?.remaining ? "medium" : "none");

          const ratio =
            info && info.capacity > 0 ? info.remaining / info.capacity : 0;

          const fillClass =
            !info || info.remaining <= 0
              ? "bg-rose-400/80"
              : ratio >= 0.67
              ? "bg-emerald-400/80"
              : ratio >= 0.34
              ? "bg-amber-300/80"
              : "bg-rose-400/80";

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onPick?.(iso)}
              role="gridcell"
              aria-selected={isSelected || undefined}
              className={clsx(
                "relative h-[4.9rem] rounded-[1rem] border px-2 py-2 text-left transition-all duration-200 focus:outline-none sm:h-[5.5rem]",
                inThisMonth
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-white/6 bg-white/[0.015]",
                BUCKET_ACCENTS[bucket],
                disabled
                  ? "cursor-not-allowed opacity-35 [background-image:repeating-linear-gradient(135deg,transparent_0,transparent_7px,rgba(255,255,255,0.025)_7px,rgba(255,255,255,0.025)_14px)]"
                  : "hover:-translate-y-[1px] hover:bg-white/[0.045]",
                isSelected && "border-fuchsia-300/40 bg-white/[0.05]"
              )}
              style={
                isSelected
                  ? {
                      boxShadow:
                        "0 10px 30px -20px rgba(232,121,249,0.45), inset 0 0 0 1px rgba(232,121,249,0.28)",
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={clsx(
                    "text-sm text-white/88",
                    disabled && "opacity-60",
                    isSelected && "font-semibold text-white"
                  )}
                >
                  {d.getDate()}
                </span>

                {isTodayFlag && (
                  <span className="rounded-full border border-sky-300/16 bg-sky-400/10 px-1.5 py-0.5 text-[9px] font-medium text-sky-100/70">
                    {txtToday}
                  </span>
                )}
              </div>

              {info ? (
                <div className="absolute inset-x-2 bottom-2">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-white/52">
                    <span>
                      {info.remaining}/{info.capacity} {legendLeft}
                    </span>
                  </div>

                  <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/8">
                    <div
                      className={clsx("h-full rounded-full", fillClass)}
                      style={{
                        width: `${
                          info.capacity > 0
                            ? Math.max(
                                6,
                                Math.min(
                                  100,
                                  Math.round((info.remaining / info.capacity) * 100)
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {isSelected && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[1rem]"
                  style={{
                    boxShadow:
                      "inset 0 0 0 1px rgba(232,121,249,0.2), 0 0 0 4px rgba(232,121,249,0.05)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/8 px-4 py-3 sm:px-5">
        {[
          { c: "#34d399", label: legendMany },
          { c: "#fbbf24", label: legendSome },
          { c: "#fb7185", label: legendLow },
          { c: "#ef4444", label: legendFull },
        ].map((it) => (
          <span
            key={it.label}
            className="inline-flex items-center gap-1.5 text-[11px] text-white/58"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: it.c }}
            />
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}