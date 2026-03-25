// src/app/api/admin/day/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";

type SlotOut = {
  id: string;
  startAt: string;
  endAt: string | null;
  capacity: number;
  priceCents: number;
  paid: number;
  pendingFresh: number;
  remaining: number;
};

type GroupOut = {
  activityId: string;
  activityName: string;
  mode: string;

  totalCapacity: number;
  totalPaid: number;
  totalPending: number;
  totalRemaining: number;

  slots: SlotOut[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const activityFilter = searchParams.get("activityId") || undefined;
    const isPublic = searchParams.get("public") === "1";

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: "Missing or invalid ?date=YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const tenant = await requireTenant();

    if (!isPublic) {
      await requireClubAdmin(tenant.id);
    }

    const day = new Date(`${dateStr}T00:00:00`);
    const start = new Date(day);
    const end = new Date(day);
    end.setDate(end.getDate() + 1);

    const slots = await prisma.timeSlot.findMany({
      where: {
        startAt: { gte: start, lt: end },
        activity: {
          clubId: tenant.id,
          ...(activityFilter ? { id: activityFilter } : {}),
        },
      },
      orderBy: [{ activityId: "asc" }, { startAt: "asc" }],
      select: {
        id: true,
        activityId: true,
        startAt: true,
        endAt: true,
        capacity: true,
        priceCents: true,
      },
    });

    if (slots.length === 0) {
      return NextResponse.json({ date: dateStr, activities: [] });
    }

    const slotIds = slots.map((s) => s.id);
    const activityIds = Array.from(new Set(slots.map((s) => s.activityId)));

    const activities = await prisma.activity.findMany({
      where: { id: { in: activityIds } },
      select: {
        id: true,
        name: true,
        mode: true, // ✅ important
      },
    });

    const activityMap = new Map(
      activities.map((a) => [a.id, { name: a.name, mode: a.mode }])
    );

    const bookings = await prisma.booking.findMany({
      where: {
        timeSlotId: { in: slotIds },
        status: { in: ["paid", "pending"] },
      },
      select: {
        timeSlotId: true,
        status: true,
        partySize: true,
      },
    });

    const perSlot = new Map<string, { paid: number; pendingFresh: number }>();
    for (const id of slotIds) {
      perSlot.set(id, { paid: 0, pendingFresh: 0 });
    }

    for (const b of bookings) {
      const row = perSlot.get(b.timeSlotId);
      if (!row) continue;

      const n = b.partySize ?? 0;
      if (b.status === "paid") row.paid += n;
      else row.pendingFresh += n;
    }

    const groupsMap = new Map<string, GroupOut>();

    for (const s of slots) {
      const agg = perSlot.get(s.id) ?? { paid: 0, pendingFresh: 0 };

      const remaining = Math.max(
        0,
        (s.capacity ?? 0) - (agg.paid + agg.pendingFresh)
      );

      const aId = s.activityId;
      const a = activityMap.get(aId);

      if (!groupsMap.has(aId)) {
        groupsMap.set(aId, {
          activityId: aId,
          activityName: a?.name ?? "(unknown)",
          mode: a?.mode ?? "UNKNOWN",

          totalCapacity: 0,
          totalPaid: 0,
          totalPending: 0,
          totalRemaining: 0,

          slots: [],
        });
      }

      const group = groupsMap.get(aId)!;

      // accumulate totals
      group.totalCapacity += s.capacity ?? 0;
      group.totalPaid += agg.paid;
      group.totalPending += agg.pendingFresh;
      group.totalRemaining += remaining;

      group.slots.push({
        id: s.id,
        startAt: s.startAt.toISOString(),
        endAt: s.endAt ? s.endAt.toISOString() : null,
        capacity: s.capacity ?? 0,
        priceCents: s.priceCents ?? 0,
        paid: agg.paid,
        pendingFresh: agg.pendingFresh,
        remaining,
      });
    }

    return NextResponse.json({
      date: dateStr,
      activities: Array.from(groupsMap.values()),
    });
  } catch (e: any) {
    const msg = e?.message || "Internal error";

    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (msg.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = msg.startsWith("Tenant not found") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}