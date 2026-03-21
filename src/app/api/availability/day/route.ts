// src/app/api/availability/day/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { ActivityMode } from "@prisma/client";
import { getBookingQuoteAndAvailability } from "@/lib/booking-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function startOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

function endOfDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d;
}

export async function GET(req: NextRequest) {
  const started = Date.now();

  try {
    const inUrl = new URL(req.url);
    const sp = inUrl.searchParams;

    const activityId = sp.get("activityId") || "";
    const date = sp.get("date") || "";

    const partySize = parsePositiveInt(sp.get("partySize"), 1);
    const units = sp.get("units") ? parsePositiveInt(sp.get("units"), 1) : undefined;
    const guests = sp.get("guests")
      ? parsePositiveInt(sp.get("guests"), 1)
      : undefined;

    const startTime = sp.get("startTime") || undefined;
    const durationOptionId = sp.get("durationOptionId") || undefined;

    if (!activityId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Missing activityId or date (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const tenant = await requireTenant();

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        clubId: tenant.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        mode: true,
        minParty: true,
        maxParty: true,
        basePrice: true,
        guestsPerUnit: true,
        maxUnitsPerBooking: true,
        slotIntervalMin: true,
        durationOptions: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            label: true,
            durationMin: true,
            priceCents: true,
            isActive: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found for tenant" },
        { status: 404 },
      );
    }

    const slots = await prisma.timeSlot.findMany({
      where: {
        startAt: { gte: dayStart, lt: dayEnd },
        activityId: activity.id,
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        activityId: true,
        startAt: true,
        endAt: true,
        capacity: true,
        priceCents: true,
        bookings: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            partySize: true,
            reservedUnits: true,
            bookingStartAt: true,
            bookingEndAt: true,
          },
        },
      },
    });

    if (slots.length === 0) {
      return NextResponse.json({
        activity: {
          id: activity.id,
          name: activity.name,
          mode: activity.mode,
          slotIntervalMin: activity.slotIntervalMin,
          guestsPerUnit: activity.guestsPerUnit,
          maxUnitsPerBooking: activity.maxUnitsPerBooking,
          durationOptions: activity.durationOptions,
        },
        slots: [],
      });
    }

    const slotResults = slots.map((slot) => {
      if (activity.mode === ActivityMode.FIXED_SEAT_EVENT) {
        const quote = getBookingQuoteAndAvailability({
          activity,
          slot: {
            id: slot.id,
            activityId: slot.activityId,
            startAt: slot.startAt,
            endAt: slot.endAt,
            capacity: slot.capacity,
            priceCents: slot.priceCents,
          },
          existingBookings: slot.bookings,
          partySize,
        });

        return {
          id: slot.id,
          kind: "fixed",
          start: slot.startAt.toISOString(),
          end: slot.endAt ? slot.endAt.toISOString() : null,
          capacity: slot.capacity,

          remaining: quote.remainingCapacity ?? 0,
          canFit: quote.isValid,

          unitPrice: quote.unitPrice,
          totalPrice: quote.totalPrice,

          requestedPartySize: quote.partySize,
          errors: quote.errors,
        };
      }

      const selectedDuration =
        durationOptionId &&
        activity.durationOptions.find((d) => d.id === durationOptionId);

      if (!startTime || !durationOptionId || !selectedDuration) {
        return {
          id: slot.id,
          kind: activity.mode === ActivityMode.DYNAMIC_RENTAL ? "rental" : "hybrid",
          start: slot.startAt.toISOString(),
          end: slot.endAt ? slot.endAt.toISOString() : null,
          capacity: slot.capacity,

          availableWindowStart: slot.startAt.toISOString(),
          availableWindowEnd: slot.endAt ? slot.endAt.toISOString() : null,

          durationOptions: activity.durationOptions.map((d) => ({
            id: d.id,
            label: d.label,
            durationMin: d.durationMin,
            priceCents: d.priceCents,
          })),

          requiresStartTimeSelection: true,
          requiresDurationSelection: true,
        };
      }

      const quote = getBookingQuoteAndAvailability({
        activity,
        slot: {
          id: slot.id,
          activityId: slot.activityId,
          startAt: slot.startAt,
          endAt: slot.endAt,
          capacity: slot.capacity,
          priceCents: slot.priceCents,
        },
        existingBookings: slot.bookings,
        partySize,
        startTime,
        durationOptionId,
        units,
        guests,
      });

      return {
        id: slot.id,
        kind: activity.mode === ActivityMode.DYNAMIC_RENTAL ? "rental" : "hybrid",
        start: slot.startAt.toISOString(),
        end: slot.endAt ? slot.endAt.toISOString() : null,
        capacity: slot.capacity,

        availableWindowStart: slot.startAt.toISOString(),
        availableWindowEnd: slot.endAt ? slot.endAt.toISOString() : null,

        bookingStartAt: quote.bookingStartAt.toISOString(),
        bookingEndAt: quote.bookingEndAt.toISOString(),

        remainingUnits: quote.remainingUnitsForRange ?? 0,
        canFit: quote.isValid,

        reservedUnits: quote.reservedUnits,
        requiredUnits: quote.requiredUnits,
        requestedGuests:
          activity.mode === ActivityMode.HYBRID_UNIT_BOOKING
            ? quote.partySize
            : null,

        durationMin: quote.durationMin,
        pricingLabel: quote.pricingLabel,
        unitPrice: quote.unitPrice,
        totalPrice: quote.totalPrice,

        errors: quote.errors,
      };
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[api/availability/day] IN", {
        path: "/api/availability/day",
        tenantId: tenant.id,
        activityId,
        date,
        mode: activity.mode,
        partySize,
        units,
        guests,
        startTime,
        durationOptionId,
      });

      console.log("[api/availability/day] OUT", {
        count: slotResults.length,
        ms: Date.now() - started,
      });
    }

    return NextResponse.json({
      activity: {
        id: activity.id,
        name: activity.name,
        mode: activity.mode,
        slotIntervalMin: activity.slotIntervalMin,
        guestsPerUnit: activity.guestsPerUnit,
        maxUnitsPerBooking: activity.maxUnitsPerBooking,
        durationOptions: activity.durationOptions.map((d) => ({
          id: d.id,
          label: d.label,
          durationMin: d.durationMin,
          priceCents: d.priceCents,
        })),
      },
      slots: slotResults,
    });
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[api/availability/day] error", err);
    }

    const msg = err?.message || "Server error";
    const status = msg.startsWith("Tenant not found") ? 400 : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}