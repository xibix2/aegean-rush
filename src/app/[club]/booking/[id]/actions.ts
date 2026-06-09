"use server";

import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function cancelBookingAction(
  prevState: { ok: boolean; error: string | null },
  formData: FormData
) {
  const club = String(formData.get("club") || "");
  const token = String(formData.get("token") || "");

  if (!club || !token) {
    return { ok: false, error: "Missing booking information." };
  }

  const tenant = await requireTenant(club);

  const booking = await prisma.booking.findFirst({
    where: {
      publicToken: token,
      timeSlot: {
        activity: {
          clubId: tenant.id,
        },
      },
    },
    include: {
      timeSlot: true,
      payment: true,
    },
  });

  if (!booking) {
    return { ok: false, error: "Booking not found." };
  }

  if (booking.status === "cancelled") {
    return { ok: false, error: "This booking is already cancelled." };
  }

  if (booking.status === "refunded") {
    return { ok: false, error: "This booking has already been refunded." };
  }

  const effectiveStart = booking.bookingStartAt ?? booking.timeSlot.startAt;
  const msUntilStart = effectiveStart.getTime() - Date.now();
  const minNoticeMs = 48 * 60 * 60 * 1000;

  if (msUntilStart <= minNoticeMs) {
    return {
      ok: false,
      error: "Refunds are only available at least 48 hours before the booking.",
    };
  }

  if (booking.status === "paid") {
    const paymentIntentId =
      booking.payment?.providerIntentId?.startsWith("pi_")
        ? booking.payment.providerIntentId
        : null;

    if (paymentIntentId) {
      const refundAmount = Math.round((booking.totalPrice ?? 0) * 0.8);

      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmount,
        reverse_transfer: true,
        refund_application_fee: false,
        reason: "requested_by_customer",
        metadata: {
          bookingId: booking.id,
          refundPolicy: "80_percent_customer_refund",
          originalAmount: String(booking.totalPrice ?? 0),
          refundedAmount: String(refundAmount),
          source: "customer_cancel_booking_action",
        },
      });
    }

    await prisma.payment.updateMany({
      where: { bookingId: booking.id },
      data: { status: "refunded" },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "refunded",
        cancelledAt: new Date(),
      },
    });
  } else {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });
  }

  revalidatePath(`/${club}/booking/${token}`);
  revalidatePath(`/${club}/manage-booking`);
  revalidatePath(`/${club}/admin/bookings`);

  return { ok: true, error: null };
}