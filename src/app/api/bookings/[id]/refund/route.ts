import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
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

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY in .env");
  return new Stripe(key);
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const tenant = await requireTenant();
    await requireClubAdmin(tenant.id);

    const id = params.id;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { activity: true, payment: true },
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ✅ Ensure this booking belongs to this tenant
    if (booking.activity.clubId !== tenant.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== DB.CONFIRMED) {
      const updated = await prisma.booking.update({
        where: { id },
        data: { status: DB.CANCELLED as any },
      });
      return NextResponse.json({ ok: true, booking: updated, note: "Not paid; cancelled" });
    }

    const payment = booking.payment;
    const stripePI = payment?.providerIntentId?.startsWith("pi_")
      ? payment.providerIntentId
      : null;

    if (stripePI) {
      const stripe = getStripe();
      await stripe.refunds.create({ payment_intent: stripePI });
    }

    await prisma.payment.updateMany({
      where: { bookingId: id },
      data: { status: "refunded" },
    });

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: DB.REFUNDED as any },
    });

    return NextResponse.json({ ok: true, booking: updated });
  } catch (err) {
    console.error("Refund booking failed", err);
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 500 });
  }
}