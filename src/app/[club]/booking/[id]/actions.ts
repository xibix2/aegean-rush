"use server";

import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

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
  const minNoticeMs = 24 * 60 * 60 * 1000;

  if (msUntilStart <= minNoticeMs) {
    return {
      ok: false,
      error: "Online cancellation is no longer available for this booking.",
    };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });

  revalidatePath(`/${club}/booking/${token}`);
  revalidatePath(`/${club}/manage-booking`);
  revalidatePath(`/${club}/admin/bookings`);

  return { ok: true, error: null };
}