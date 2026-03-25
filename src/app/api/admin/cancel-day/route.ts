import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import Stripe from "stripe";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import { resend, FROM } from "@/lib/email";
import BookingCancelledEmail from "@/emails/BookingCancelled";

export const runtime = "nodejs";
export const revalidate = 0;

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activityId: z.string().min(1),
  reason: z.string().trim().max(1000).optional().default(""),
  notifyCustomers: z.boolean().optional().default(false),
});

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

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
        status: true,
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
        closedSlotCount: 0,
        cancelledCount: 0,
        refundedCount: 0,
        stripeRefundedCount: 0,
        emailedCount: 0,
        emailErrorCount: 0,
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
        payment: {
          select: {
            id: true,
            providerIntentId: true,
            status: true,
          },
        },
      },
    });

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

    const stripe = getStripe();

    let cancelledCount = 0;
    let refundedCount = 0;
    let stripeRefundedCount = 0;

    for (const b of bookings) {
      if (b.status === "pending") {
        await prisma.booking.update({
          where: { id: b.id },
          data: {
            status: "cancelled",
            notes: b.notes ? `${b.notes}\n\n${cancelNote}` : cancelNote,
          },
        });
        cancelledCount += 1;
        continue;
      }

      const rawPI = b.payment?.providerIntentId ?? null;
      const hasStripePI = !!rawPI && rawPI.startsWith("pi_");

      if (hasStripePI) {
        await stripe.refunds.create({ payment_intent: rawPI });

        if (b.payment?.id) {
          await prisma.payment.update({
            where: { id: b.payment.id },
            data: { status: "refunded" },
          });
        }

        await prisma.booking.update({
          where: { id: b.id },
          data: {
            status: "refunded",
            notes: b.notes ? `${b.notes}\n\n${cancelNote}` : cancelNote,
          },
        });

        refundedCount += 1;
        stripeRefundedCount += 1;
      } else {
        if (b.payment?.id) {
          await prisma.payment.update({
            where: { id: b.payment.id },
            data: { status: "refunded" },
          });
        }

        await prisma.booking.update({
          where: { id: b.id },
          data: {
            status: "refunded",
            notes: b.notes ? `${b.notes}\n\n${cancelNote}` : cancelNote,
          },
        });

        refundedCount += 1;
      }
    }

    await prisma.timeSlot.updateMany({
      where: {
        id: { in: slotIds },
      },
      data: {
        status: "closed",
      },
    });

    const customers = bookings.map((b) => {
      const dbCustomer = customerMap.get(b.customerId);

      return {
        bookingId: b.id,
        name: b.contactName || dbCustomer?.name || "",
        email: b.contactEmail || dbCustomer?.email || "",
        phone: b.contactPhone || dbCustomer?.phone || "",
      };
    });

    let emailedCount = 0;
    let emailErrorCount = 0;

    if (notifyCustomers && customers.length > 0) {
      const club = await prisma.club.findUnique({
        where: { id: tenant.id },
        select: {
          logoKey: true,
          primaryHex: true,
        },
      });

      for (const customer of customers) {
        if (!customer.email) continue;

        try {
          await resend.emails.send({
            from: FROM,
            to: customer.email,
            subject: `${tenant.name}: booking cancelled for ${activityName ?? "activity"}`,
            react: BookingCancelledEmail({
              clubName: tenant.name,
              activity: activityName ?? "Activity",
              dateLabel: date,
              reason: reason || undefined,
              logoUrl: club?.logoKey ?? undefined,
              brandPrimary: club?.primaryHex ?? tenant.primaryHex ?? undefined,
            }),
          });
          emailedCount += 1;
        } catch (err: any) {
          emailErrorCount += 1;
          console.error(
            `Failed to send cancel-day email for booking ${customer.bookingId}:`,
            err?.message || err
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      notifyCustomers,
      activityName,
      closedSlotCount: slotIds.length,
      cancelledCount,
      refundedCount,
      stripeRefundedCount,
      customerCount: customers.filter((c) => !!c.email).length,
      emailedCount,
      emailErrorCount,
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