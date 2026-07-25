import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import { requireTenant } from "@/lib/tenant";
import { getBookingQuoteAndAvailability } from "@/lib/booking-engine";
import { resend, FROM } from "@/lib/email";
import BookingConfirmed from "@/emails/BookingConfirmed";
import { localWallTimeToUTC, resolveTz } from "@/lib/timezone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function optionalNumber(value: unknown) {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function arrivalInstruction(activityName: string) {
  const normalized = activityName.toLowerCase();
  return normalized.includes("boat rental") ||
    (normalized.includes("rent") && normalized.includes("boat"))
    ? "Please arrive 30 minutes before your boat rental start time for check-in, safety briefing, and preparation."
    : "Please arrive 10-15 minutes before your activity start time for check-in and preparation.";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ club: string }> }
) {
  try {
    const { club } = await params;
    const tenant = await requireTenant(club);
    await requireClubAdminStrict(tenant.id);
    const body = await request.json();

    const slotId = optionalText(body.slotId);
    if (!slotId) {
      return NextResponse.json({ error: "Missing time slot." }, { status: 400 });
    }

    const name = optionalText(body.name) ?? "Guest";
    const email = optionalText(body.email);
    const phone = optionalText(body.phone);
    const markPaid = body.markPaid !== false;
    const startLocal = optionalText(body.startLocal);
    const setting = await prisma.appSetting.findUnique({
      where: { clubId: tenant.id },
      select: { tz: true },
    });
    const timeZone = resolveTz(setting?.tz);
    const localMatch = startLocal?.match(
      /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/
    );
    const startAt = localMatch
      ? localWallTimeToUTC(localMatch[1], localMatch[2], timeZone)
      : body.startAt
        ? new Date(String(body.startAt))
        : undefined;

    if (startAt && Number.isNaN(startAt.getTime())) {
      return NextResponse.json({ error: "Invalid start time." }, { status: 400 });
    }

    const slot = await prisma.timeSlot.findFirst({
      where: { id: slotId, activity: { clubId: tenant.id } },
      include: {
        activity: {
          include: {
            durationOptions: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            partySize: true,
            reservedUnits: true,
            bookingStartAt: true,
            bookingEndAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!slot) {
      return NextResponse.json({ error: "Time slot not found." }, { status: 404 });
    }
    if (slot.status !== "open") {
      return NextResponse.json(
        { error: "This time slot is closed." },
        { status: 409 }
      );
    }

    const quote = getBookingQuoteAndAvailability({
      activity: {
        id: slot.activity.id,
        name: slot.activity.name,
        mode: slot.activity.mode,
        minParty: slot.activity.minParty,
        maxParty: slot.activity.maxParty,
        basePrice: slot.activity.basePrice,
        guestsPerUnit: slot.activity.guestsPerUnit,
        maxUnitsPerBooking: slot.activity.maxUnitsPerBooking,
        slotIntervalMin: slot.activity.slotIntervalMin,
        durationOptions: slot.activity.durationOptions,
      },
      slot: {
        id: slot.id,
        activityId: slot.activityId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        capacity: slot.capacity,
        priceCents: slot.priceCents,
      },
      existingBookings: slot.bookings,
      partySize: optionalNumber(body.partySize),
      startTime:
        slot.activity.mode === "FIXED_SEAT_EVENT"
          ? slot.startAt
          : startAt,
      durationOptionId: optionalText(body.durationOptionId),
      units: optionalNumber(body.units),
      guests: optionalNumber(body.guests),
      skipBookingNotice: true,
    });

    if (!quote.isValid) {
      return NextResponse.json(
        { error: quote.errors[0] ?? "Invalid booking." },
        { status: 409 }
      );
    }

    const customerEmail = email ?? `walkin+${Date.now()}@example.com`;
    const booking = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: {
          clubId_email: { clubId: tenant.id, email: customerEmail },
        },
        update: { name, phone: phone ?? null },
        create: {
          clubId: tenant.id,
          email: customerEmail,
          name,
          phone: phone ?? null,
        },
      });

      const created = await tx.booking.create({
        data: {
          customerId: customer.id,
          activityId: slot.activityId,
          timeSlotId: slot.id,
          partySize: quote.partySize,
          totalPrice: quote.totalPrice,
          status: markPaid ? "paid" : "pending",
          contactName: name,
          contactEmail: email ?? null,
          contactPhone: phone ?? null,
          reservedUnits: quote.reservedUnits,
          bookingStartAt: quote.bookingStartAt,
          bookingEndAt: quote.bookingEndAt,
          durationMinSnapshot: quote.durationMin,
          unitPriceSnapshot: quote.unitPrice,
          pricingLabelSnapshot: quote.pricingLabel,
        },
      });

      if (markPaid) {
        await tx.payment.create({
          data: {
            bookingId: created.id,
            provider: "stripe",
            providerIntentId: `admin_manual_${created.id}`,
            amount: quote.totalPrice,
            currency: (tenant.currency || "EUR").toUpperCase(),
            status: "succeeded",
          },
        });
      }
      return created;
    });

    if (markPaid && email) {
      try {
        await resend.emails.send({
          from: FROM,
          to: email,
          subject: `Your booking with ${tenant.name} is confirmed`,
          react: BookingConfirmed({
            activity: slot.activity.name,
            startISO: quote.bookingStartAt.toISOString(),
            endISO: quote.bookingEndAt.toISOString(),
            partySize: quote.partySize,
            totalCents: quote.totalPrice,
            clubName: tenant.name,
            logoUrl: tenant.logoKey ?? undefined,
            brandPrimary: tenant.primaryHex ?? undefined,
            customerName: name,
            arrivalText: arrivalInstruction(slot.activity.name),
          }),
        });
      } catch (error) {
        console.error("Planner booking email failed:", error);
      }
    }

    const base = `/${tenant.slug}/admin`;
    revalidatePath(`${base}/planner`);
    revalidatePath(`${base}/bookings`);
    revalidatePath(`${base}/slots/${slot.id}`);

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      totalPrice: quote.totalPrice,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create booking.";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("Forbidden")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
