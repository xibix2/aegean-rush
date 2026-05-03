import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { ActivityMode } from "@prisma/client";

export const runtime = "nodejs";
export const revalidate = 0;

const PENDING_HOLD_MINUTES = 30;

type DayBucket = "none" | "low" | "medium" | "high" | "full";

function isFreshPending(createdAt: Date, now: Date) {
  return (now.getTime() - createdAt.getTime()) / 60000 < PENDING_HOLD_MINUTES;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function bucketFromRatio(capacity: number, remaining: number): DayBucket {
  if (capacity <= 0) return "none";
  if (remaining <= 0) return "full";

  const ratio = remaining / capacity;

  if (ratio <= 0.2) return "low";
  if (ratio <= 0.6) return "medium";
  return "high";
}

// GET /api/availability/month?activityId=...&month=YYYY-MM
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("activityId");
    const monthStr = searchParams.get("month");

    if (!activityId || !monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      return NextResponse.json(
        { error: "Missing or invalid activityId/month" },
        { status: 400 }
      );
    }

    const tenant = await requireTenant();

    const [y, m] = monthStr.split("-").map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);

    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        clubId: tenant.id,
        active: true,
      },
      select: {
        id: true,
        mode: true,
        slotIntervalMin: true,
        durationMin: true,
        durationOptions: {
          select: {
            durationMin: true,
          },
        },
      },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const slots = await prisma.timeSlot.findMany({
      where: {
        startAt: { gte: start, lt: end },
        activityId: activity.id,
        status: "open",
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        capacity: true,
      },
    });

    if (slots.length === 0) {
      return NextResponse.json({ days: {} });
    }

    const days: Record<
      string,
      {
        capacity: number;
        paid: number;
        remaining: number;
        bucket: DayBucket;
      }
    > = {};

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

    for (const b of validBookings) {
      const list = bookingsBySlot.get(b.timeSlotId) ?? [];
      list.push(b);
      bookingsBySlot.set(b.timeSlotId, list);
    }

    for (const slot of slots) {
      const iso = slot.startAt.toISOString().slice(0, 10);

      if (!days[iso]) {
        days[iso] = {
          capacity: 0,
          paid: 0,
          remaining: 0,
          bucket: "none",
        };
      }

      const slotCapacity = Math.max(0, slot.capacity ?? 0);
      const slotBookings = bookingsBySlot.get(slot.id) ?? [];

      if (activity.mode === ActivityMode.FIXED_SEAT_EVENT) {
        const paidSeats = slotBookings.reduce(
          (sum, b) => sum + Math.max(0, b.partySize ?? 0),
          0
        );

        days[iso].capacity += slotCapacity;
        days[iso].paid += paidSeats;
        days[iso].remaining += Math.max(0, slotCapacity - paidSeats);
        continue;
      }

      const windowStart = slot.startAt;
      const windowEnd = slot.endAt;

      if (!windowEnd || windowEnd <= windowStart || slotCapacity <= 0) {
        continue;
      }

      const stepMin = Math.max(5, activity.slotIntervalMin ?? 30);

      const shortestDuration =
        activity.durationOptions.length > 0
          ? Math.min(...activity.durationOptions.map((d) => d.durationMin))
          : activity.durationMin ?? stepMin;

      const durationMin = Math.max(5, shortestDuration);

      for (
        let current = new Date(windowStart);
        addMinutes(current, durationMin) <= windowEnd;
        current = addMinutes(current, stepMin)
      ) {
        const bookingEnd = addMinutes(current, durationMin);

        let usedUnits = 0;

        for (const booking of slotBookings) {
          const bStart = booking.bookingStartAt ?? windowStart;
          const bEnd = booking.bookingEndAt ?? windowEnd;

          if (overlaps(current, bookingEnd, bStart, bEnd)) {
            usedUnits += Math.max(1, booking.reservedUnits ?? 1);
          }
        }

        const availableUnits = Math.max(0, slotCapacity - usedUnits);

        days[iso].capacity += slotCapacity;
        days[iso].remaining += availableUnits;
      }

      days[iso].paid = Math.max(0, days[iso].capacity - days[iso].remaining);
    }

    for (const iso of Object.keys(days)) {
      const d = days[iso];
      d.remaining = Math.max(0, d.remaining);
      d.paid = Math.max(0, d.capacity - d.remaining);
      d.bucket = bucketFromRatio(d.capacity, d.remaining);
    }

    return NextResponse.json({ days });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg.startsWith("Tenant not found") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}