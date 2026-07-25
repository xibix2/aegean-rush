import prisma from "@/lib/prisma";
import {
  formatYMDInTz,
  localStartOfDayUTC,
  resolveTz,
} from "@/lib/timezone";

export type StatsRangeKey = "7" | "30" | "90" | "all";

export type StatsBucket = {
  date: string;
  label: string;
  bookings: number;
  paidBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  refundedBookings: number;
  seats: number;
  capacity: number;
  revenueCents: number;
  onlineRevenueCents: number;
  walkInRevenueCents: number;
  refundsCents: number;
  netRevenueCents: number;
};

export type ActivityStats = {
  activityId: string;
  name: string;
  seats: number;
  bookings: number;
  paidBookings: number;
  revenueCents: number;
  onlineRevenueCents: number;
  walkInRevenueCents: number;
  refundsCents: number;
  netRevenueCents: number;
};

export type WeekdayStats = {
  day: number;
  label: string;
  bookings: number;
  seats: number;
  revenueCents: number;
};

export type AdminStats = {
  range: StatsRangeKey;
  rangeLabel: string;
  from: Date;
  to: Date;
  bucketUnit: "day" | "month";
  byPeriod: StatsBucket[];
  byActivity: ActivityStats[];
  byWeekday: WeekdayStats[];
  totals: {
    revenueCents: number;
    onlineRevenueCents: number;
    walkInRevenueCents: number;
    refundsCents: number;
    netRevenueCents: number;
    onlineNetRevenueCents: number;
    walkInNetRevenueCents: number;
    onlineBookings: number;
    walkInBookings: number;
    seats: number;
    capacity: number;
    paidBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    refundedBookings: number;
    bookings: number;
    averageBookingValueCents: number;
    utilization: number;
    conversion: number;
    refundRate: number;
  };
};

const INCLUDED_STATUSES = [
  "paid",
  "refunded",
  "cancelled",
  "pending",
] as const;

export function parseStatsRange(value: string | string[] | undefined): StatsRangeKey {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "7" ||
    candidate === "30" ||
    candidate === "90" ||
    candidate === "all"
    ? candidate
    : "30";
}

function shiftYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  return shifted.toISOString().slice(0, 10);
}

function monthKey(ymd: string) {
  return ymd.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function dailyLabel(key: string) {
  return key.slice(5);
}

function emptyBucket(key: string, unit: "day" | "month"): StatsBucket {
  return {
    date: key,
    label: unit === "month" ? monthLabel(key) : dailyLabel(key),
    bookings: 0,
    paidBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    refundedBookings: 0,
    seats: 0,
    capacity: 0,
    revenueCents: 0,
    onlineRevenueCents: 0,
    walkInRevenueCents: 0,
    refundsCents: 0,
    netRevenueCents: 0,
  };
}

function buildBuckets(fromYmd: string, toYmd: string, unit: "day" | "month") {
  const buckets = new Map<string, StatsBucket>();

  if (unit === "month") {
    const [fromYear, fromMonth] = fromYmd.split("-").map(Number);
    const [toYear, toMonth] = toYmd.split("-").map(Number);
    let year = fromYear;
    let month = fromMonth;

    while (year < toYear || (year === toYear && month <= toMonth)) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      buckets.set(key, emptyBucket(key, unit));
      month += 1;
      if (month === 13) {
        year += 1;
        month = 1;
      }
    }
    return buckets;
  }

  let cursor = fromYmd;
  while (cursor <= toYmd) {
    buckets.set(cursor, emptyBucket(cursor, unit));
    cursor = shiftYmd(cursor, 1);
  }
  return buckets;
}

function isWalkInPayment(providerIntentId: string | null | undefined) {
  return providerIntentId?.startsWith("admin_manual_") ?? false;
}

function weekdayIndex(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export async function getAdminStats({
  clubId,
  range,
  timeZone,
  now = new Date(),
}: {
  clubId: string;
  range: StatsRangeKey;
  timeZone?: string | null;
  now?: Date;
}): Promise<AdminStats> {
  const tz = resolveTz(timeZone);
  const todayYmd = formatYMDInTz(now, tz);

  let fromYmd =
    range === "all"
      ? todayYmd
      : shiftYmd(todayYmd, -(Number(range) - 1));

  if (range === "all") {
    const earliestSlot = await prisma.timeSlot.findFirst({
      where: {
        activity: { clubId },
        bookings: { some: { status: { in: [...INCLUDED_STATUSES] } } },
      },
      orderBy: { startAt: "asc" },
      select: { startAt: true },
    });
    if (earliestSlot) fromYmd = formatYMDInTz(earliestSlot.startAt, tz);
  }

  const from = localStartOfDayUTC(fromYmd, tz);
  const nextDay = localStartOfDayUTC(shiftYmd(todayYmd, 1), tz);
  const to = new Date(nextDay.getTime() - 1);
  const bucketUnit = range === "all" ? "month" : "day";

  const [bookings, slots] = await Promise.all([
    prisma.booking.findMany({
      where: {
        timeSlot: {
          startAt: { gte: from, lte: to },
          activity: { clubId },
        },
        status: { in: [...INCLUDED_STATUSES] },
      },
      include: {
        timeSlot: { include: { activity: true } },
        payment: true,
      },
      orderBy: { timeSlot: { startAt: "asc" } },
    }),
    prisma.timeSlot.findMany({
      where: {
        startAt: { gte: from, lte: to },
        activity: { clubId },
      },
      select: { startAt: true, capacity: true },
    }),
  ]);

  const buckets = buildBuckets(fromYmd, todayYmd, bucketUnit);
  const byActivity = new Map<string, ActivityStats>();
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byWeekday = weekdayLabels.map((label, day) => ({
    day,
    label,
    bookings: 0,
    seats: 0,
    revenueCents: 0,
  }));

  const totals: AdminStats["totals"] = {
    revenueCents: 0,
    onlineRevenueCents: 0,
    walkInRevenueCents: 0,
    refundsCents: 0,
    netRevenueCents: 0,
    onlineNetRevenueCents: 0,
    walkInNetRevenueCents: 0,
    onlineBookings: 0,
    walkInBookings: 0,
    seats: 0,
    capacity: 0,
    paidBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    refundedBookings: 0,
    bookings: 0,
    averageBookingValueCents: 0,
    utilization: 0,
    conversion: 0,
    refundRate: 0,
  };

  for (const slot of slots) {
    const ymd = formatYMDInTz(slot.startAt, tz);
    const key = bucketUnit === "month" ? monthKey(ymd) : ymd;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.capacity += slot.capacity || 0;
    totals.capacity += slot.capacity || 0;
  }

  for (const booking of bookings) {
    const ymd = formatYMDInTz(booking.timeSlot.startAt, tz);
    const key = bucketUnit === "month" ? monthKey(ymd) : ymd;
    const bucket = buckets.get(key);
    if (!bucket) continue;

    const isPaid = booking.status === "paid";
    const isRefunded = booking.status === "refunded";
    const isCompleted = isPaid || isRefunded;
    const isWalkIn = isWalkInPayment(booking.payment?.providerIntentId);
    const partySize = booking.partySize || 0;
    const gross = isCompleted ? booking.totalPrice || 0 : 0;
    const refund = isRefunded
      ? booking.payment?.amount ?? booking.totalPrice ?? 0
      : 0;

    bucket.bookings += 1;
    totals.bookings += 1;

    if (isPaid) {
      bucket.paidBookings += 1;
      bucket.seats += partySize;
      totals.paidBookings += 1;
      totals.seats += partySize;
    } else if (isRefunded) {
      bucket.refundedBookings += 1;
      totals.refundedBookings += 1;
    } else if (booking.status === "pending") {
      bucket.pendingBookings += 1;
      totals.pendingBookings += 1;
    } else if (booking.status === "cancelled") {
      bucket.cancelledBookings += 1;
      totals.cancelledBookings += 1;
    }

    bucket.revenueCents += gross;
    bucket.refundsCents += refund;
    bucket.netRevenueCents += gross - refund;
    totals.revenueCents += gross;
    totals.refundsCents += refund;

    if (isCompleted) {
      if (isWalkIn) {
        bucket.walkInRevenueCents += gross;
        totals.walkInRevenueCents += gross;
        totals.walkInBookings += 1;
        totals.walkInNetRevenueCents += gross - refund;
      } else {
        bucket.onlineRevenueCents += gross;
        totals.onlineRevenueCents += gross;
        totals.onlineBookings += 1;
        totals.onlineNetRevenueCents += gross - refund;
      }
    }

    const activityId = booking.timeSlot.activityId;
    const activity =
      byActivity.get(activityId) ??
      {
        activityId,
        name: booking.timeSlot.activity.name,
        seats: 0,
        bookings: 0,
        paidBookings: 0,
        revenueCents: 0,
        onlineRevenueCents: 0,
        walkInRevenueCents: 0,
        refundsCents: 0,
        netRevenueCents: 0,
      };

    activity.bookings += 1;
    if (isPaid) {
      activity.paidBookings += 1;
      activity.seats += partySize;
    }
    activity.revenueCents += gross;
    activity.refundsCents += refund;
    activity.netRevenueCents += gross - refund;
    if (isCompleted) {
      if (isWalkIn) activity.walkInRevenueCents += gross;
      else activity.onlineRevenueCents += gross;
    }
    byActivity.set(activityId, activity);

    const weekday = byWeekday[weekdayIndex(ymd)];
    weekday.bookings += 1;
    if (isPaid) weekday.seats += partySize;
    weekday.revenueCents += gross - refund;
  }

  totals.netRevenueCents = totals.revenueCents - totals.refundsCents;
  const completedBookings = totals.paidBookings + totals.refundedBookings;
  totals.averageBookingValueCents = completedBookings
    ? Math.round(totals.revenueCents / completedBookings)
    : 0;
  totals.utilization = totals.capacity ? totals.seats / totals.capacity : 0;
  totals.conversion = totals.bookings
    ? totals.paidBookings / totals.bookings
    : 0;
  totals.refundRate = completedBookings
    ? totals.refundedBookings / completedBookings
    : 0;

  const rangeLabel =
    range === "all"
      ? "All time"
      : `Last ${range} days`;

  return {
    range,
    rangeLabel,
    from,
    to,
    bucketUnit,
    byPeriod: [...buckets.values()],
    byActivity: [...byActivity.values()].sort(
      (a, b) => b.netRevenueCents - a.netRevenueCents
    ),
    byWeekday,
    totals,
  };
}
