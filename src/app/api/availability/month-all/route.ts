import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

type DayAgg = {
  capacity: number;
  paidPlayers: number;
  remaining: number;
  ratio: number; // 0..1
  level: 0 | 1 | 2 | 3 | 4; // 0 none, 4 full
  bucket: "none" | "low" | "medium" | "high" | "full";
};

// GET /api/availability/month-all?month=YYYY-MM
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get("month"); // YYYY-MM
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      return NextResponse.json({ error: "Missing or invalid ?month=YYYY-MM" }, { status: 400 });
    }

    // 🔒 tenant scope
    const tenant = await requireTenant(); // header -> cookie

    const [y, m] = monthStr.split("-").map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);

    // 1) Slots in the month — SCOPED BY TENANT via Activity
    const slots = await prisma.timeSlot.findMany({
      where: {
        startAt: { gte: start, lt: end },
        activity: { clubId: tenant.id, active: true },
      },
      orderBy: { startAt: "asc" },
      select: { id: true, startAt: true, capacity: true },
    });

    if (slots.length === 0) return NextResponse.json({ days: {} });

    const byDay: Record<string, DayAgg> = {};
    const slotIds: string[] = [];
    const dayForSlot = new Map<string, string>();

    for (const s of slots) {
      const iso = s.startAt.toISOString().slice(0, 10);
      if (!byDay[iso]) {
        byDay[iso] = {
          capacity: 0,
          paidPlayers: 0,
          remaining: 0,
          ratio: 0,
          level: 0,
          bucket: "none",
        };
      }
      byDay[iso].capacity += s.capacity ?? 0;
      dayForSlot.set(s.id, iso);
      slotIds.push(s.id);
    }

    // 2) Bookings (paid + pending) on those tenant slots
    const bookings = await prisma.booking.findMany({
      where: {
        timeSlotId: { in: slotIds },
        status: { in: ["paid", "pending"] },
      },
      select: { timeSlotId: true, partySize: true },
    });

    for (const b of bookings) {
      const iso = dayForSlot.get(b.timeSlotId);
      if (!iso) continue;
      byDay[iso].paidPlayers += b.partySize ?? 0;
    }

    // 3) Compute ratio + bucket
    for (const iso of Object.keys(byDay)) {
      const d = byDay[iso];
      const cap = Math.max(1, d.capacity);
      d.remaining = Math.max(0, d.capacity - d.paidPlayers);
      d.ratio = Math.min(1, d.paidPlayers / cap);

      const r = d.ratio;
      const level = r === 0 ? 0 : r < 0.25 ? 1 : r < 0.6 ? 2 : r < 0.9 ? 3 : 4;
      d.level = level;
      d.bucket = ["none", "low", "medium", "high", "full"][level] as DayAgg["bucket"];
    }

    return NextResponse.json({ days: byDay });
  } catch (e: any) {
    const msg = e?.message || "Internal error";
    const status = msg.startsWith("Tenant not found") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}