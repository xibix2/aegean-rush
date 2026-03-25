// src/app/api/admin/cancel-day/route.ts
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
  reason: z.string().trim().max(1000).optional().default(""),
  notifyCustomers: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body. Expected { date, activityId, reason?, notifyCustomers? }" },
        { status: 400 }
      );
    }

    const { date, activityId, reason, notifyCustomers } = parsed.data;

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
        activity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (slots.length === 0) {
      return NextResponse.json({
        ok: true,
        cancelledCount: 0,
        customerCount: 0,
        activityName: null,
        customers: [],
      });
    }

    const slotIds = slots.map((s) => s.id);
    const activityName = slots[0]?.activity?.name ?? null;

    const bookings = await prisma.booking.findMany({
      where: {
        activityId,
        timeSlotId: { in: slotIds },
        status: { in: ["paid", "pending"] },
      },
      select: {
        id: true,
        status: true,
        notes: true,
        customerId: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
      },
    });

    if (bookings.length === 0) {
      return NextResponse.json({
        ok: true,
        cancelledCount: 0,
        customerCount: 0,
        activityName,
        customers: [],
      });
    }

    const customerIds = Array.from(
      new Set(bookings.map((b) => b.customerId).filter(Boolean))
    ) as string[];

    const customersFromDb = customerIds.length
      ? await prisma.customer.findMany({
          where: {
            id: { in: customerIds },
            clubId: tenant.id,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        })
      : [];

    const customerMap = new Map(customersFromDb.map((c) => [c.id, c]));

    const cancelNote = reason
      ? `Cancelled by admin for ${date}. Reason: ${reason}`
      : `Cancelled by admin for ${date}.`;

    await prisma.$transaction(
      bookings.map((b) =>
        prisma.booking.update({
          where: { id: b.id },
          data: {
            status: "cancelled",
            notes: b.notes ? `${b.notes}\n\n${cancelNote}` : cancelNote,
          },
        })
      )
    );

    const customers = bookings.map((b) => {
      const dbCustomer = customerMap.get(b.customerId);

      return {
        bookingId: b.id,
        name: b.contactName || dbCustomer?.name || "",
        email: b.contactEmail || dbCustomer?.email || "",
        phone: b.contactPhone || dbCustomer?.phone || "",
      };
    });

    return NextResponse.json({
      ok: true,
      notifyCustomers,
      cancelledCount: bookings.length,
      customerCount: customers.filter((c) => !!c.email).length,
      activityName,
      customers,
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