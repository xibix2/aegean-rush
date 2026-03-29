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
      publicToken: id,
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

  const effectiveStart =
    booking?.bookingStartAt ?? booking?.timeSlot.startAt ?? null;

  const effectiveEnd =
    booking?.bookingEndAt ??
    booking?.timeSlot.endAt ??
    (booking?.timeSlot.startAt
      ? new Date(booking.timeSlot.startAt.getTime() + 90 * 60 * 1000)
      : null);

  const canCancel =
    booking &&
    booking.status !== "cancelled" &&
    booking.status !== "refunded" &&
    effectiveStart &&
    effectiveStart.getTime() - Date.now() > 48 * 60 * 60 * 1000;

  const payload =
    booking && effectiveStart && effectiveEnd
      ? {
          id: booking.id,
          publicToken: booking.publicToken,
          status: booking.status,
          partySize: booking.partySize,
          totalPrice: booking.totalPrice,
          reservedUnits: booking.reservedUnits,
          bookingStartAt: effectiveStart.toISOString(),
          bookingEndAt: effectiveEnd.toISOString(),
          durationMinSnapshot: booking.durationMinSnapshot,
          unitPriceSnapshot: booking.unitPriceSnapshot,
          pricingLabelSnapshot: booking.pricingLabelSnapshot,
          cancelledAt: booking.cancelledAt?.toISOString() ?? null,
          canCancel: Boolean(canCancel),
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
        }
      : null;

  return (
    <BookingClient
      tenantSlug={tenant.slug}
      currencyGlyph={currencyGlyph}
      booking={payload}
    />
  );
}