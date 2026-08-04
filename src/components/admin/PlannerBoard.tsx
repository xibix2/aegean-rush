"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MousePointerClick,
  Plus,
  RefreshCw,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import type {
  PlannerActivity,
  PlannerAvailabilityBlock,
  PlannerBooking,
  PlannerSlot,
} from "@/lib/admin-planner-types";

type Selection = {
  intent: "booking" | "block";
  activity: PlannerActivity;
  slot: PlannerSlot;
  lane: number;
  startMs: number;
};

type LaneBooking = PlannerBooking & {
  kind: "booking";
  lane: number;
  conflicted: boolean;
};

type LaneBlock = PlannerAvailabilityBlock & {
  kind: "block";
  lane: number;
  conflicted: boolean;
};

type LaneItem = LaneBooking | LaneBlock;

const LABEL_WIDTH = 176;
const TRACK_WIDTH = 1120;
const ROW_HEIGHT = 58;

function shiftYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12))
    .toISOString()
    .slice(0, 10);
}

function formatTime(value: string | number, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDay(ymd: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T12:00:00Z`));
}

function toLocalInput(value: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function isUnitMode(activity: PlannerActivity) {
  return activity.mode !== "FIXED_SEAT_EVENT";
}

function activeBookings(activity: PlannerActivity) {
  return activity.slots
    .flatMap((slot) => slot.bookings)
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime() ||
        a.id.localeCompare(b.id)
    );
}

function activeBlocks(activity: PlannerActivity) {
  return activity.slots
    .flatMap((slot) => slot.availabilityBlocks)
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime() ||
        a.id.localeCompare(b.id),
    );
}

function allocateUnitItems(activity: PlannerActivity, laneCount: number) {
  const laneEnds = Array.from({ length: laneCount }, () => -Infinity);
  const placed: LaneItem[] = [];
  const items = [
    ...activeBookings(activity).map((booking) => ({
      kind: "booking" as const,
      item: booking,
      startAt: booking.startAt,
      endAt: booking.endAt,
      units: booking.reservedUnits,
      slotId: booking.slotId,
    })),
    ...activeBlocks(activity).map((block) => ({
      kind: "block" as const,
      item: block,
      startAt: block.startAt,
      endAt: block.endAt,
      units: block.units,
      slotId: block.slotId,
    })),
  ].sort(
    (a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime() ||
      (a.kind === b.kind ? a.item.id.localeCompare(b.item.id) : a.kind.localeCompare(b.kind)),
  );

  for (const timelineItem of items) {
    const start = new Date(timelineItem.startAt).getTime();
    const end = new Date(timelineItem.endAt).getTime();
    const slot = activity.slots.find(
      (candidate) => candidate.id === timelineItem.slotId,
    );
    const usableLanes = Math.min(laneCount, slot?.capacity ?? laneCount);
    const required = Math.min(
      usableLanes,
      Math.max(1, timelineItem.units || 1),
    );
    const free = laneEnds
      .map((laneEnd, lane) => ({ laneEnd, lane }))
      .filter(({ laneEnd, lane }) => lane < usableLanes && laneEnd <= start)
      .slice(0, required);
    const conflicted = free.length < required;
    const chosen =
      free.length === required
        ? free
        : Array.from({ length: required }, (_, lane) => ({
            lane,
            laneEnd: laneEnds[lane],
          }));

    for (const { lane } of chosen) {
      laneEnds[lane] = Math.max(laneEnds[lane], end);
      placed.push({
        ...timelineItem.item,
        kind: timelineItem.kind,
        lane,
        conflicted,
      } as LaneItem);
    }
  }
  return placed;
}

export default function PlannerBoard({
  tenantSlug,
  date,
  today,
  tomorrow,
  timeZone,
  currency,
  timelineStart,
  timelineEnd,
  activities,
}: {
  tenantSlug: string;
  date: string;
  today: string;
  tomorrow: string;
  timeZone: string;
  currency: string;
  timelineStart: number;
  timelineEnd: number;
  activities: PlannerActivity[];
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);

  const paidBookings = activities
    .flatMap((activity) => activeBookings(activity))
    .filter((booking) => booking.status === "paid");
  const pendingBookings = activities
    .flatMap((activity) => activeBookings(activity))
    .filter((booking) => booking.status === "pending");
  const guests = paidBookings.reduce(
    (sum, booking) => sum + booking.partySize,
    0
  );
  const revenue = paidBookings.reduce(
    (sum, booking) => sum + booking.totalPrice,
    0
  );

  const money = (cents: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase() || "EUR",
    }).format(cents / 100);

  const goToDate = (nextDate: string) => {
    router.push(`/${tenantSlug}/admin/planner?date=${nextDate}`);
  };

  const duration = Math.max(1, timelineEnd - timelineStart);
  const position = (value: string | number) =>
    Math.max(
      0,
      Math.min(
        100,
        ((new Date(value).getTime() - timelineStart) / duration) * 100
      )
    );

  const hourTicks = useMemo(() => {
    const ticks: number[] = [];
    let cursor = Math.ceil(timelineStart / 3_600_000) * 3_600_000;
    while (cursor <= timelineEnd) {
      ticks.push(cursor);
      cursor += 3_600_000;
    }
    return ticks;
  }, [timelineStart, timelineEnd]);

  function openFromSlot(
    event: React.MouseEvent<HTMLButtonElement>,
    activity: PlannerActivity,
    slot: PlannerSlot,
    lane: number
  ) {
    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    let startMs = slotStart;

    if (isUnitMode(activity)) {
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width)
      );
      const raw = slotStart + ratio * (slotEnd - slotStart);
      const step = Math.max(5, activity.slotIntervalMin ?? 15) * 60_000;
      startMs = Math.round(raw / step) * step;
      startMs = Math.max(slotStart, Math.min(slotEnd - step, startMs));
    }

    setSelection({ intent: "booking", activity, slot, lane, startMs });
  }

  function openBlock(activity: PlannerActivity) {
    const slot = activity.slots.find((candidate) => candidate.status === "open");
    if (!slot) return;

    const slotStart = new Date(slot.startAt).getTime();
    const slotEnd = new Date(slot.endAt).getTime();
    const now = Date.now();
    const step = Math.max(5, activity.slotIntervalMin ?? 15) * 60_000;
    const roundedNow = Math.ceil(now / step) * step;
    const startMs =
      date === today
        ? Math.max(slotStart, Math.min(slotEnd - step, roundedNow))
        : slotStart;

    setSelection({ intent: "block", activity, slot, lane: 0, startMs });
  }

  return (
    <main className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--card),transparent_4%)] shadow-xl">
        <div className="border-b border-[var(--border)] bg-gradient-to-r from-[color-mix(in_oklab,var(--accent-500),transparent_88%)] via-transparent to-transparent px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-400)]">
                <CalendarDays className="h-4 w-4" />
                Daily operations
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {formatDay(date)}
              </h1>
              <p className="mt-1 text-sm opacity-60">
                One row per bookable unit. Click an open time to add a walk-in.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => goToDate(shiftYmd(date, -1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] hover:bg-white/[0.05]"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goToDate(today)}
                className={[
                  "h-10 rounded-xl border px-4 text-sm font-medium",
                  date === today
                    ? "border-[var(--accent-500)] bg-[color-mix(in_oklab,var(--accent-500),transparent_84%)] text-[var(--accent-400)]"
                    : "border-[var(--border)] hover:bg-white/[0.05]",
                ].join(" ")}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => goToDate(tomorrow)}
                className={[
                  "h-10 rounded-xl border px-4 text-sm font-medium",
                  date === tomorrow
                    ? "border-[var(--accent-500)] bg-[color-mix(in_oklab,var(--accent-500),transparent_84%)] text-[var(--accent-400)]"
                    : "border-[var(--border)] hover:bg-white/[0.05]",
                ].join(" ")}
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={date}
                onChange={(event) => goToDate(event.target.value)}
                className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => router.refresh()}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] hover:bg-white/[0.05]"
                aria-label="Refresh planner"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goToDate(shiftYmd(date, 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] hover:bg-white/[0.05]"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-[var(--border)] sm:grid-cols-4 sm:divide-y-0">
          <SummaryItem
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            label="Confirmed"
            value={String(paidBookings.length)}
          />
          <SummaryItem
            icon={<Clock3 className="h-4 w-4 text-amber-400" />}
            label="Pending"
            value={String(pendingBookings.length)}
          />
          <SummaryItem
            icon={<Users className="h-4 w-4 text-sky-400" />}
            label="Guests"
            value={String(guests)}
          />
          <SummaryItem
            icon={<WalletCards className="h-4 w-4 text-violet-400" />}
            label="Paid income"
            value={money(revenue)}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs opacity-65">
        <LegendDot className="bg-sky-400" label="Online booking" />
        <LegendDot className="bg-violet-400" label="Walk-in booking" />
        <LegendDot className="bg-amber-400" label="Pending" />
        <LegendDot className="bg-rose-500" label="Availability block" />
        <span className="inline-flex items-center gap-1.5">
          <MousePointerClick className="h-3.5 w-3.5" />
          Click an empty availability lane to book
        </span>
      </div>

      {activities.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-6 py-16 text-center">
          <CalendarDays className="mx-auto h-9 w-9 opacity-35" />
          <h2 className="mt-4 text-lg font-semibold">No schedule for this day</h2>
          <p className="mt-1 text-sm opacity-60">
            Create time slots first, then they will appear on this board.
          </p>
          <Link
            href={`/${tenantSlug}/admin/slots?date=${date}`}
            className="btn-accent mt-5 inline-flex px-4 py-2 text-sm"
          >
            Create time slots
          </Link>
        </section>
      ) : (
        <div className="space-y-5">
          {activities.map((activity) => (
            <ActivityTimeline
              key={activity.id}
              activity={activity}
              tenantSlug={tenantSlug}
              timeZone={timeZone}
              trackWidth={TRACK_WIDTH}
              labelWidth={LABEL_WIDTH}
              rowHeight={ROW_HEIGHT}
              hourTicks={hourTicks}
              position={position}
              onOpen={openFromSlot}
              onBlock={openBlock}
              onBlockRemoved={() => router.refresh()}
            />
          ))}
        </div>
      )}

      {selection && (
        <QuickBookingModal
          tenantSlug={tenantSlug}
          timeZone={timeZone}
          currency={currency}
          selection={selection}
          onClose={() => setSelection(null)}
          onCreated={() => {
            setSelection(null);
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

function ActivityTimeline({
  activity,
  tenantSlug,
  timeZone,
  trackWidth,
  labelWidth,
  rowHeight,
  hourTicks,
  position,
  onOpen,
  onBlock,
  onBlockRemoved,
}: {
  activity: PlannerActivity;
  tenantSlug: string;
  timeZone: string;
  trackWidth: number;
  labelWidth: number;
  rowHeight: number;
  hourTicks: number[];
  position: (value: string | number) => number;
  onOpen: (
    event: React.MouseEvent<HTMLButtonElement>,
    activity: PlannerActivity,
    slot: PlannerSlot,
    lane: number
  ) => void;
  onBlock: (activity: PlannerActivity) => void;
  onBlockRemoved: () => void;
}) {
  const unitMode = isUnitMode(activity);
  const laneCount = unitMode
    ? Math.max(1, ...activity.slots.map((slot) => slot.capacity))
    : 1;
  const placed = unitMode ? allocateUnitItems(activity, laneCount) : [];
  const totalBookings = activeBookings(activity);
  const paid = totalBookings.filter((booking) => booking.status === "paid");
  const bookedUnits = paid.reduce(
    (sum, booking) => sum + (unitMode ? booking.reservedUnits : booking.partySize),
    0
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--card),transparent_3%)] shadow-lg">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{activity.name}</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-65">
              {unitMode ? `${laneCount} units` : "Fixed event"}
            </span>
          </div>
          <div className="mt-1 text-xs opacity-55">
            {totalBookings.length} bookings · {bookedUnits}{" "}
            {unitMode ? "units reserved" : "confirmed guests"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unitMode && (
            <button
              type="button"
              onClick={() => onBlock(activity)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/25 bg-rose-400/8 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/14"
            >
              <Ban className="h-3.5 w-3.5" />
              Block availability
            </button>
          )}
          <Link
            href={`/${tenantSlug}/admin/slots?activityId=${activity.id}`}
            className="text-xs font-medium text-[var(--accent-400)] hover:underline"
          >
            Manage schedule
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ width: labelWidth + trackWidth }}>
          <div
            className="grid border-b border-[var(--border)] bg-black/[0.12]"
            style={{ gridTemplateColumns: `${labelWidth}px ${trackWidth}px` }}
          >
            <div className="sticky left-0 z-20 border-r border-[var(--border)] bg-[color-mix(in_oklab,var(--card),black_4%)] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] opacity-45">
              {unitMode ? "Equipment" : "Schedule"}
            </div>
            <div className="relative h-11">
              {hourTicks.map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-y-0 border-l border-white/10"
                  style={{ left: `${position(tick)}%` }}
                >
                  <span className="absolute left-1 top-2 whitespace-nowrap text-[10px] opacity-55">
                    {formatTime(tick, timeZone)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {Array.from({ length: laneCount }, (_, lane) => (
            <div
              key={lane}
              className="grid border-b border-[var(--border)] last:border-b-0"
              style={{
                gridTemplateColumns: `${labelWidth}px ${trackWidth}px`,
                minHeight: rowHeight,
              }}
            >
              <div className="sticky left-0 z-20 flex items-center border-r border-[var(--border)] bg-[color-mix(in_oklab,var(--card),black_4%)] px-4">
                <span className="mr-3 grid h-7 w-7 place-items-center rounded-lg bg-[var(--surface-1)] text-xs font-semibold">
                  {lane + 1}
                </span>
                <span className="truncate text-xs font-medium">
                  {unitMode ? `${activity.name} ${lane + 1}` : activity.name}
                </span>
              </div>

              <div
                className="relative"
                style={{
                  minHeight: rowHeight,
                  backgroundImage:
                    "repeating-linear-gradient(90deg, transparent 0, transparent calc(2.0833% - 1px), rgba(255,255,255,.035) calc(2.0833% - 1px), rgba(255,255,255,.035) 2.0833%)",
                }}
              >
                {activity.slots
                  .filter((slot) => !unitMode || lane < slot.capacity)
                  .map((slot) => {
                    const left = position(slot.startAt);
                    const right = position(slot.endAt);
                    const width = Math.max(0.5, right - left);

                    if (!unitMode) {
                      const slotBookings = slot.bookings;
                      const confirmedGuests = slotBookings
                        .filter((booking) => booking.status === "paid")
                        .reduce((sum, booking) => sum + booking.partySize, 0);
                      const names = slotBookings
                        .slice(0, 2)
                        .map((booking) => booking.customerName)
                        .join(", ");

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={slot.status !== "open"}
                          onClick={(event) => onOpen(event, activity, slot, lane)}
                          className={[
                            "absolute inset-y-2 overflow-hidden rounded-lg border px-2 text-left transition",
                            slot.status === "open"
                              ? "border-[color-mix(in_oklab,var(--accent-500),transparent_50%)] bg-[color-mix(in_oklab,var(--accent-500),transparent_84%)] hover:brightness-110"
                              : "cursor-not-allowed border-rose-500/20 bg-rose-500/8 opacity-55",
                          ].join(" ")}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title="Click to add booking"
                        >
                          <span className="block truncate text-[11px] font-semibold">
                            {formatTime(slot.startAt, timeZone)} · {confirmedGuests}/
                            {slot.capacity}
                          </span>
                          <span className="block truncate text-[10px] opacity-65">
                            {names || "Available - click to book"}
                            {slotBookings.length > 2
                              ? ` +${slotBookings.length - 2}`
                              : ""}
                          </span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={slot.status !== "open"}
                        onClick={(event) => onOpen(event, activity, slot, lane)}
                        className={[
                          "group absolute inset-y-2 rounded-lg border border-dashed transition",
                          slot.status === "open"
                            ? "border-emerald-400/20 bg-emerald-400/[0.035] hover:border-emerald-400/40 hover:bg-emerald-400/[0.08]"
                            : "cursor-not-allowed border-rose-400/20 bg-rose-400/[0.04]",
                        ].join(" ")}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={
                          slot.status === "open"
                            ? "Available - click to book"
                            : "Closed"
                        }
                      >
                        <Plus className="mx-auto h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60" />
                      </button>
                    );
                  })}

                {unitMode &&
                  placed
                    .filter((item) => item.lane === lane)
                    .map((item) => {
                      const left = position(item.startAt);
                      const right = position(item.endAt);
                      const width = Math.max(1.2, right - left);
                      if (item.kind === "block") {
                        return (
                          <button
                            key={`${item.id}-${lane}`}
                            type="button"
                            onClick={async () => {
                              if (!window.confirm("Remove this availability block?")) return;
                              const response = await fetch(
                                `/${tenantSlug}/admin/planner/blocks`,
                                {
                                  method: "DELETE",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ blockId: item.id }),
                                },
                              );
                              if (response.ok) onBlockRemoved();
                            }}
                            className={`absolute inset-y-2 z-10 overflow-hidden rounded-lg border border-rose-200/45 bg-rose-600/90 px-2 py-1 text-left text-white shadow-lg transition hover:z-20 hover:bg-rose-500 ${
                              item.conflicted ? "ring-2 ring-amber-300" : ""
                            }`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${item.reason || "Unavailable"} - click to remove`}
                          >
                            <span className="block truncate text-[10px] font-bold">
                              Unavailable
                            </span>
                            <span className="block truncate text-[9px] opacity-85">
                              {formatTime(item.startAt, timeZone)}-
                              {formatTime(item.endAt, timeZone)}
                            </span>
                          </button>
                        );
                      }

                      const booking = item;
                      const color =
                        booking.status === "pending"
                          ? "border-amber-300/55 bg-amber-400/80 text-black"
                          : booking.source === "walkIn"
                            ? "border-violet-200/45 bg-violet-500/85 text-white"
                            : "border-sky-200/45 bg-sky-500/85 text-white";

                      return (
                        <Link
                          key={`${booking.id}-${lane}`}
                          href={`/${tenantSlug}/admin/slots/${booking.slotId}`}
                          className={`absolute inset-y-2 z-10 overflow-hidden rounded-lg border px-2 py-1 shadow-lg transition hover:z-20 hover:brightness-110 ${color} ${
                            booking.conflicted ? "ring-2 ring-rose-500" : ""
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${booking.customerName} · ${formatTime(
                            booking.startAt,
                            timeZone
                          )}-${formatTime(booking.endAt, timeZone)}`}
                        >
                          <span className="block truncate text-[10px] font-bold">
                            {booking.customerName}
                          </span>
                          <span className="block truncate text-[9px] opacity-80">
                            {formatTime(booking.startAt, timeZone)}-
                            {formatTime(booking.endAt, timeZone)}
                          </span>
                        </Link>
                      );
                    })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickBookingModal({
  tenantSlug,
  timeZone,
  currency,
  selection,
  onClose,
  onCreated,
}: {
  tenantSlug: string;
  timeZone: string;
  currency: string;
  selection: Selection;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { activity, slot, lane, startMs } = selection;
  const unitMode = isUnitMode(activity);
  const [intent, setIntent] = useState<"booking" | "block">(selection.intent);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [startLocal, setStartLocal] = useState(
    toLocalInput(startMs, timeZone)
  );
  const [endLocal, setEndLocal] = useState(
    toLocalInput(
      Math.min(
        new Date(slot.endAt).getTime(),
        startMs + 60 * 60_000,
      ),
      timeZone,
    ),
  );
  const [blockAllAvailable, setBlockAllAvailable] = useState(true);
  const [blockUnits, setBlockUnits] = useState(1);
  const [blockReason, setBlockReason] = useState("");
  const [durationOptionId, setDurationOptionId] = useState(
    activity.durationOptions[0]?.id ?? ""
  );
  const [partySize, setPartySize] = useState(
    Math.max(1, activity.minParty || 1)
  );
  const [units, setUnits] = useState(1);
  const [guests, setGuests] = useState(1);
  const [markPaid, setMarkPaid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedDuration = activity.durationOptions.find(
    (option) => option.id === durationOptionId
  );
  const estimatedPrice = unitMode
    ? (selectedDuration?.priceCents ?? slot.priceCents) * units
    : slot.priceCents * partySize;
  const money = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase() || "EUR",
  }).format(estimatedPrice / 100);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/${tenantSlug}/admin/planner/${intent === "block" ? "blocks" : "bookings"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            intent === "block"
              ? {
                  slotId: slot.id,
                  startLocal,
                  endLocal,
                  blockAllAvailable,
                  units: blockAllAvailable ? undefined : blockUnits,
                  reason: blockReason,
                }
              : {
                  slotId: slot.id,
                  name,
                  phone,
                  email,
                  markPaid,
                  startLocal: unitMode ? startLocal : undefined,
                  durationOptionId: unitMode ? durationOptionId : undefined,
                  partySize: unitMode ? undefined : partySize,
                  units: unitMode ? units : undefined,
                  guests:
                    activity.mode === "HYBRID_UNIT_BOOKING" ? guests : undefined,
                },
          ),
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          result?.error ||
            (intent === "block"
              ? "Could not block availability."
              : "Could not create booking."),
        );
      }
      onCreated();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : intent === "block"
            ? "Could not block availability."
            : "Could not create booking.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-3 py-6 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close quick booking"
      />
      <form
        onSubmit={submit}
        className="relative z-10 max-h-full w-full max-w-xl overflow-y-auto rounded-3xl border border-white/12 bg-[#101218] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/10 bg-[#101218]/95 px-5 py-4 backdrop-blur">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-400)]">
              {intent === "block" ? "Availability control" : "Quick walk-in booking"}
            </div>
            <h2 className="mt-1 text-xl font-semibold">{activity.name}</h2>
            <p className="mt-1 text-xs text-white/50">
              {unitMode ? `Unit lane ${lane + 1}` : "Fixed event"} ·{" "}
              {formatTime(startMs, timeZone)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/55 hover:bg-white/8 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2 grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.035] p-1">
            <button
              type="button"
              onClick={() => setIntent("booking")}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                intent === "booking"
                  ? "bg-[var(--accent-500)] text-black"
                  : "text-white/55 hover:bg-white/5"
              }`}
            >
              Walk-in booking
            </button>
            <button
              type="button"
              onClick={() => setIntent("block")}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                intent === "block"
                  ? "bg-rose-500 text-white"
                  : "text-white/55 hover:bg-white/5"
              }`}
            >
              Block availability
            </button>
          </div>

          {intent === "block" ? (
            <>
              <div className="sm:col-span-2 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-100/85">
                Reduce online availability without creating a booking, payment,
                customer, or email.
              </div>
              <Field label="Unavailable from">
                <input
                  type="datetime-local"
                  value={startLocal}
                  min={toLocalInput(new Date(slot.startAt).getTime(), timeZone)}
                  max={toLocalInput(new Date(slot.endAt).getTime(), timeZone)}
                  onChange={(event) => setStartLocal(event.target.value)}
                  className="planner-input"
                  required
                />
              </Field>
              <Field label="Unavailable until">
                <input
                  type="datetime-local"
                  value={endLocal}
                  min={startLocal}
                  max={toLocalInput(new Date(slot.endAt).getTime(), timeZone)}
                  onChange={(event) => setEndLocal(event.target.value)}
                  className="planner-input"
                  required
                />
              </Field>
              <label className="sm:col-span-2 flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">
                    Block all remaining units
                  </span>
                  <span className="block text-xs text-white/45">
                    Makes this whole time range unavailable online.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={blockAllAvailable}
                  onChange={(event) => setBlockAllAvailable(event.target.checked)}
                  className="h-5 w-5 accent-rose-500"
                />
              </label>
              {!blockAllAvailable && (
                <Field label="Units to block" className="sm:col-span-2">
                  <input
                    type="number"
                    min={1}
                    max={slot.capacity}
                    value={blockUnits}
                    onChange={(event) =>
                      setBlockUnits(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="planner-input"
                  />
                </Field>
              )}
              <Field label="Reason (optional)" className="sm:col-span-2">
                <input
                  value={blockReason}
                  maxLength={160}
                  onChange={(event) => setBlockReason(event.target.value)}
                  placeholder="Counter reservations, maintenance, private use..."
                  className="planner-input"
                />
              </Field>
            </>
          ) : (
            <>
          <Field label="Guest name" className="sm:col-span-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Walk-in guest"
              className="planner-input"
              autoFocus
            />
          </Field>
          <Field label="Phone">
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+30..."
              className="planner-input"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="guest@example.com"
              className="planner-input"
            />
          </Field>

          {unitMode ? (
            <>
              <Field label="Start time">
                <input
                  type="datetime-local"
                  value={startLocal}
                  min={toLocalInput(new Date(slot.startAt).getTime(), timeZone)}
                  max={toLocalInput(new Date(slot.endAt).getTime(), timeZone)}
                  onChange={(event) => setStartLocal(event.target.value)}
                  className="planner-input"
                  required
                />
              </Field>
              <Field label="Duration">
                <select
                  value={durationOptionId}
                  onChange={(event) => setDurationOptionId(event.target.value)}
                  className="planner-input"
                  required
                >
                  {activity.durationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label || `${option.durationMin} minutes`} ·{" "}
                      {new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: currency.toUpperCase() || "EUR",
                      }).format(option.priceCents / 100)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Units">
                <input
                  type="number"
                  min={1}
                  max={
                    activity.maxUnitsPerBooking ??
                    Math.max(...activity.slots.map((item) => item.capacity))
                  }
                  value={units}
                  onChange={(event) =>
                    setUnits(Math.max(1, Number(event.target.value) || 1))
                  }
                  className="planner-input"
                />
              </Field>
              {activity.mode === "HYBRID_UNIT_BOOKING" && (
                <Field label="Guests">
                  <input
                    type="number"
                    min={1}
                    max={activity.maxParty}
                    value={guests}
                    onChange={(event) =>
                      setGuests(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="planner-input"
                  />
                </Field>
              )}
            </>
          ) : (
            <Field label="Guests" className="sm:col-span-2">
              <input
                type="number"
                min={Math.max(1, activity.minParty)}
                max={Math.min(activity.maxParty, slot.capacity)}
                value={partySize}
                onChange={(event) =>
                  setPartySize(Math.max(1, Number(event.target.value) || 1))
                }
                className="planner-input"
              />
            </Field>
          )}

          <label className="sm:col-span-2 flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
            <span>
              <span className="block text-sm font-medium">Mark as paid</span>
              <span className="block text-xs text-white/45">
                Counts as walk-in income
              </span>
            </span>
            <input
              type="checkbox"
              checked={markPaid}
              onChange={(event) => setMarkPaid(event.target.checked)}
              className="h-5 w-5 accent-[var(--accent-500)]"
            />
          </label>
            </>
          )}

          {error && (
            <div className="sm:col-span-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">
              {intent === "block" ? "Effect" : "Estimated total"}
            </div>
            <div className="font-semibold">
              {intent === "block"
                ? blockAllAvailable
                  ? "All remaining units"
                  : `${blockUnits} unit${blockUnits === 1 ? "" : "s"}`
                : money}
            </div>
          </div>
          <div className="flex gap-2">
            {intent === "booking" && (
              <Link
                href={`/${tenantSlug}/admin/slots/${slot.id}`}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/65 hover:bg-white/5"
              >
                Full form
              </Link>
            )}
            <button
              type="submit"
              disabled={saving}
              className="btn-accent min-w-32 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : intent === "block"
                  ? "Block availability"
                  : "Create booking"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-1)]">
        {icon}
      </span>
      <span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] opacity-45">
          {label}
        </span>
        <span className="block text-lg font-semibold">{value}</span>
      </span>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-white/60">
        {label}
      </span>
      {children}
    </label>
  );
}
