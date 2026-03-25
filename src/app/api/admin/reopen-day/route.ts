import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const revalidate = 0;

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activityId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body. Expected { date, activityId }" },
        { status: 400 }
      );
    }

    const { date, activityId } = parsed.data;

    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T00:00:00`);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const slots = await prisma.timeSlot.findMany({
      where: {
        activityId,
        startAt: { gte: dayStart, lt: dayEnd },
        activity: { clubId: tenant.id },
      },
      select: {
        id: true,
        status: true,
        activity: {
          select: {
            name: true,
          },
        },
      },
    });

    if (slots.length === 0) {
      return NextResponse.json({
        ok: true,
        reopenedCount: 0,
        activityName: null,
      });
    }

    const closedSlotIds = slots.filter((s) => s.status === "closed").map((s) => s.id);
    const activityName = slots[0]?.activity?.name ?? null;

    if (closedSlotIds.length === 0) {
      return NextResponse.json({
        ok: true,
        reopenedCount: 0,
        activityName,
      });
    }

    await prisma.timeSlot.updateMany({
      where: {
        id: { in: closedSlotIds },
      },
      data: {
        status: "open",
      },
    });

    return NextResponse.json({
      ok: true,
      activityName,
      reopenedCount: closedSlotIds.length,
    });
  } catch (e: any) {
    const msg = e?.message || "Server error";

    if (msg === "Unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    if (msg.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = msg.startsWith("Tenant not found") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}