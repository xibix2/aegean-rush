import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { ActivityMode } from "@prisma/client";

export const runtime = "nodejs";
export const revalidate = 0;

const PENDING_HOLD_MINUTES = 30;

type Bucket = "none" | "low" | "medium" | "high" | "full";

type DayAgg = {
  capacity: number;
  paidPlayers: number;
  remaining: number;
  ratio: number;
  level: 0 | 1 | 2 | 3 | 4;
  bucket: Bucket;
};

function isFreshPending(createdAt: Date, now: Date) {
  return (now.getTime() - createdAt.getTime()) / 60000 < PENDING_HOLD_MINUTES;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function emptyDay(): DayAgg {
  return {
    capacity: 0,
    paidPlayers: 0,
    remaining: 0,
    ratio: 0,
    level: 0,
    bucket: "none",
  };
}

function finalizeDay(d: DayAgg) {
  d.remaining = Math.max(0, d.remaining);
  d.paidPlayers = Math.max(0, d.capacity - d.remaining);

  const usedRatio = d.capacity > 0 ? d.paidPlayers / d.capacity : 0;
  d.ratio = Math.min(1, Math.max(0, usedRatio));

  const availabilityRatio = d.capacity > 0 ? d.remaining / d.capacity : 0;

  d.bucket =
    d.capacity === 0
      ? "none"
      : d.remaining === 0
      ? "full"
      : availabilityRatio <= 0.2
      ? "low"
      : availabilityRatio <= 0.6
      ? "medium"
      : "high";

  d.level =
    d.bucket === "none"
      ? 0
      : d.bucket === "low"
      ? 1
      : d.bucket === "medium"
      ? 2
      : d.bucket === "high"
      ? 3
      : 4;
}

// GET /api/availability/month-all?month=YYYY-MM
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month");

    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      return NextResponse.json(
        { error: "Missing or invalid ?month=YYYY-MM" },
        { status: 400 }
      );
    }

    const tenant = await requireTenant();

    const [y, m] = monthStr.split("-").map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);

    const slots = await prisma.timeSlot.findMany({
      where: {
        startAt: { gte: start, lt: end },
        status: "open",
        activity: {
          clubId: tenant.id,
          active: true,
        },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        capacity: true,
        activity: {
          select: {
            mode: true,
            slotIntervalMin: true,
            durationMin: true,
            durationOptions: {
              select: {
                durationMin: true,
              },
            },
          },
        },
      },
    });

    if (slots.length === 0) {
      return NextResponse.json({ days: {} });
    }

    const byDay: Record<string, DayAgg> = {};
    const slotIds = slots.map((s) => s.id);
    const now = new Date();

    const bookings = await prisma.booking.findMany({
      where: {
        timeSlotId: { in: slotIds },
        status: { in: ["paid", "pending"] },
      },
      select: {
        timeSlotId: true,
        status: true,
        createdAt: true,
        partySize: true,
        reservedUnits: true,
        bookingStartAt: true,
        bookingEndAt: true,
      },
    });

    const validBookings = bookings.filter((b) => {
      return (
        b.status === "paid" ||
        (b.status === "pending" && isFreshPending(b.createdAt, now))
      );
    });

    const bookingsBySlot = new Map<string, typeof validBookings>();

    for (const booking of validBookings) {
      const list = bookingsBySlot.get(booking.timeSlotId) ?? [];
      list.push(booking);
      bookingsBySlot.set(booking.timeSlotId, list);
    }

    for (const slot of slots) {
      const iso = slot.startAt.toISOString().slice(0, 10);

      if (!byDay[iso]) {
        byDay[iso] = emptyDay();
      }

      const day = byDay[iso];
      const slotCapacity = Math.max(0, slot.capacity ?? 0);
      const slotBookings = bookingsBySlot.get(slot.id) ?? [];

      if (slot.activity.mode === ActivityMode.FIXED_SEAT_EVENT) {
        const usedSeats = slotBookings.reduce(
          (sum, b) => sum + Math.max(0, b.partySize ?? 0),
          0
        );

        day.capacity += slotCapacity;
        day.remaining += Math.max(0, slotCapacity - usedSeats);
        continue;
      }

      const windowStart = slot.startAt;
      const windowEnd = slot.endAt;

      if (!windowEnd || windowEnd <= windowStart || slotCapacity <= 0) {
        continue;
      }

      const stepMin = Math.max(5, slot.activity.slotIntervalMin ?? 30);

      const shortestDuration =
        slot.activity.durationOptions.length > 0
          ? Math.min(...slot.activity.durationOptions.map((d) => d.durationMin))
          : slot.activity.durationMin ?? stepMin;

      const durationMin = Math.max(5, shortestDuration);

      for (
        let current = new Date(windowStart);
        addMinutes(current, durationMin) <= windowEnd;
        current = addMinutes(current, stepMin)
      ) {
        const candidateEnd = addMinutes(current, durationMin);

        let usedUnits = 0;

        for (const booking of slotBookings) {
          const bStart = booking.bookingStartAt ?? windowStart;
          const bEnd = booking.bookingEndAt ?? windowEnd;

          if (overlaps(current, candidateEnd, bStart, bEnd)) {
            usedUnits += Math.max(1, booking.reservedUnits ?? 1);
          }
        }

        const availableUnits = Math.max(0, slotCapacity - usedUnits);

        day.capacity += slotCapacity;
        day.remaining += availableUnits;
      }
    }

    for (const iso of Object.keys(byDay)) {
      finalizeDay(byDay[iso]);
    }

    return NextResponse.json({ days: byDay });
  } catch (e: any) {
    const msg = e?.message || "Internal error";
    const status = msg.startsWith("Tenant not found") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}