//src/app/api/bookings/[id]/cancel/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const revalidate = 0;

const DB = {
  PENDING: "pending",
  CONFIRMED: "paid",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);

    const id = params.id;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { activity: true },
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ✅ Ensure this booking belongs to this tenant
    if (booking.activity.clubId !== tenant.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === DB.REFUNDED) {
      return NextResponse.json({ error: "Already refunded" }, { status: 409 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: DB.CANCELLED as any },
    });

    return NextResponse.json({ ok: true, booking: updated });
  } catch (err) {
    console.error("Cancel booking failed", err);
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 500 });
  }
}