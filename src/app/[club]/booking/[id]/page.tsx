import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { requireTenant } from "@/lib/tenant";
import BookingClient from "./BookingClient";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ club: string; id: string }>;
}) {
  const { club, id } = await params;

  const tenant = await requireTenant(club);

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      timeSlot: {
        activity: {
          clubId: tenant.id,
        },
      },
    },
    include: {
      timeSlot: {
        include: {
          activity: true,
        },
      },
    },
  });

  const jar = await cookies();
  const currencyGlyph = jar.get("ui_currency")?.value ?? "€";

  const payload =
    booking && {
      id: booking.id,
      status: booking.status,
      partySize: booking.partySize,
      totalPrice: booking.totalPrice,

      reservedUnits: booking.reservedUnits,
      bookingStartAt: (
        booking.bookingStartAt ?? booking.timeSlot.startAt
      ).toISOString(),
      bookingEndAt: (
        booking.bookingEndAt ??
        booking.timeSlot.endAt ??
        new Date(booking.timeSlot.startAt.getTime() + 90 * 60 * 1000)
      ).toISOString(),
      durationMinSnapshot: booking.durationMinSnapshot,
      unitPriceSnapshot: booking.unitPriceSnapshot,
      pricingLabelSnapshot: booking.pricingLabelSnapshot,

      timeSlot: {
        startAt: booking.timeSlot.startAt.toISOString(),
        endAt: booking.timeSlot.endAt
          ? booking.timeSlot.endAt.toISOString()
          : null,
        activity: {
          name: booking.timeSlot.activity.name,
          mode: booking.timeSlot.activity.mode,
        },
      },
    };

  return (
    <BookingClient
      tenantSlug={tenant.slug}
      currencyGlyph={currencyGlyph}
      booking={payload}
    />
  );
}