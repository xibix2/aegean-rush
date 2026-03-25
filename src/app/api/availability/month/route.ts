import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { ActivityMode } from "@prisma/client";

export const runtime = "nodejs";
export const revalidate = 0;

const PENDING_HOLD_MINUTES = 30;

function isFreshPending(createdAt: Date, now: Date) {
  return (now.getTime() - createdAt.getTime()) / 60000 < PENDING_HOLD_MINUTES;
}

// GET /api/availability/month?activityId=...&month=YYYY-MM
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("activityId");
    const monthStr = searchParams.get("month"); // YYYY-MM

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
        bucket: "none" | "low" | "medium" | "high" | "full";
      }
    > = {};

    const slotIds: string[] = [];
    const dayForSlot = new Map<string, string>();

    for (const s of slots) {
      const iso = s.startAt.toISOString().slice(0, 10);

      if (!days[iso]) {
        days[iso] = {
          capacity: 0,
          paid: 0,
          remaining: 0,
          bucket: "none",
        };
      }

      days[iso].capacity += s.capacity ?? 0;
      slotIds.push(s.id);
      dayForSlot.set(s.id, iso);
    }

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
      },
    });

    const now = new Date();

    for (const b of bookings) {
      const iso = dayForSlot.get(b.timeSlotId);
      if (!iso) continue;

      const counts =
        b.status === "paid" ||
        (b.status === "pending" && isFreshPending(b.createdAt, now));

      if (!counts) continue;

      if (activity.mode === ActivityMode.FIXED_SEAT_EVENT) {
        days[iso].paid += b.partySize ?? 0;
      } else {
        days[iso].paid += Math.max(1, b.reservedUnits ?? 1);
      }
    }

    for (const iso of Object.keys(days)) {
      const d = days[iso];
      d.remaining = Math.max(0, d.capacity - d.paid);
      const ratio = d.capacity ? d.remaining / d.capacity : 0;

      d.bucket =
        d.capacity === 0
          ? "none"
          : d.remaining === 0
          ? "full"
          : ratio <= 0.2
          ? "low"
          : ratio <= 0.6
          ? "medium"
          : "high";
    }

    return NextResponse.json({ days });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const status = msg.startsWith("Tenant not found") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}