import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import { requireTenant } from "@/lib/tenant";
import { localWallTimeToUTC, resolveTz } from "@/lib/timezone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CapacityInterval = {
  startAt: Date;
  endAt: Date;
  units: number;
};

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function optionalPositiveInt(value: unknown) {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(1, Math.floor(parsed));
}

function parseLocalDateTime(value: unknown, timeZone: string) {
  const text = optionalText(value);
  const match = text?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
  return match ? localWallTimeToUTC(match[1], match[2], timeZone) : null;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function maximumConcurrentUnits(
  intervals: CapacityInterval[],
  rangeStart: Date,
  rangeEnd: Date,
) {
  const points = new Set<number>([rangeStart.getTime(), rangeEnd.getTime()]);

  for (const interval of intervals) {
    if (!overlaps(interval.startAt, interval.endAt, rangeStart, rangeEnd)) continue;
    points.add(Math.max(rangeStart.getTime(), interval.startAt.getTime()));
    points.add(Math.min(rangeEnd.getTime(), interval.endAt.getTime()));
  }

  const sorted = [...points].sort((a, b) => a - b);
  let maximum = 0;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const segmentStart = new Date(sorted[index]);
    const segmentEnd = new Date(sorted[index + 1]);
    if (segmentEnd <= segmentStart) continue;

    const used = intervals.reduce(
      (sum, interval) =>
        overlaps(interval.startAt, interval.endAt, segmentStart, segmentEnd)
          ? sum + interval.units
          : sum,
      0,
    );
    maximum = Math.max(maximum, used);
  }

  return maximum;
}

function buildFullBlockSegments(
  intervals: CapacityInterval[],
  rangeStart: Date,
  rangeEnd: Date,
  capacity: number,
) {
  const points = new Set<number>([rangeStart.getTime(), rangeEnd.getTime()]);
  for (const interval of intervals) {
    if (!overlaps(interval.startAt, interval.endAt, rangeStart, rangeEnd)) continue;
    points.add(Math.max(rangeStart.getTime(), interval.startAt.getTime()));
    points.add(Math.min(rangeEnd.getTime(), interval.endAt.getTime()));
  }

  const sorted = [...points].sort((a, b) => a - b);
  const segments: CapacityInterval[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const segmentStart = new Date(sorted[index]);
    const segmentEnd = new Date(sorted[index + 1]);
    if (segmentEnd <= segmentStart) continue;

    const used = intervals.reduce(
      (sum, interval) =>
        overlaps(interval.startAt, interval.endAt, segmentStart, segmentEnd)
          ? sum + interval.units
          : sum,
      0,
    );
    const units = Math.max(0, capacity - used);
    if (units <= 0) continue;

    const previous = segments.at(-1);
    if (
      previous &&
      previous.units === units &&
      previous.endAt.getTime() === segmentStart.getTime()
    ) {
      previous.endAt = segmentEnd;
    } else {
      segments.push({ startAt: segmentStart, endAt: segmentEnd, units });
    }
  }

  return segments;
}

function revalidatePlanner(tenantSlug: string, slotId?: string) {
  const base = `/${tenantSlug}/admin`;
  revalidatePath(`${base}/planner`);
  revalidatePath(`${base}/slots`);
  if (slotId) revalidatePath(`${base}/slots/${slotId}`);
  revalidatePath(`/${tenantSlug}/timetable`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ club: string }> },
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

    const setting = await prisma.appSetting.findUnique({
      where: { clubId: tenant.id },
      select: { tz: true },
    });
    const timeZone = resolveTz(setting?.tz);
    const startAt = parseLocalDateTime(body.startLocal, timeZone);
    const endAt = parseLocalDateTime(body.endLocal, timeZone);

    if (!startAt || !endAt || endAt <= startAt) {
      return NextResponse.json(
        { error: "Choose a valid start and end time." },
        { status: 400 },
      );
    }

    const blockAllAvailable = body.blockAllAvailable === true;
    const requestedUnits = optionalPositiveInt(body.units);
    if (!blockAllAvailable && !requestedUnits) {
      return NextResponse.json(
        { error: "Choose how many units to block." },
        { status: 400 },
      );
    }

    const reason = optionalText(body.reason)?.slice(0, 160) ?? null;

    const created = await prisma.$transaction(async (tx) => {
      const slot = await tx.timeSlot.findFirst({
        where: { id: slotId, activity: { clubId: tenant.id } },
        include: {
          activity: { select: { id: true, mode: true, durationMin: true } },
          bookings: {
            where: { status: { in: ["paid", "pending"] } },
            select: {
              status: true,
              createdAt: true,
              partySize: true,
              reservedUnits: true,
              bookingStartAt: true,
              bookingEndAt: true,
            },
          },
          availabilityBlocks: {
            select: { startAt: true, endAt: true, units: true },
          },
        },
      });

      if (!slot) throw new Error("Time slot not found.");
      if (slot.status !== "open") throw new Error("This time slot is closed.");

      const slotEnd =
        slot.endAt ??
        new Date(slot.startAt.getTime() + slot.activity.durationMin * 60_000);
      if (startAt < slot.startAt || endAt > slotEnd) {
        throw new Error("The blocked time must stay inside the availability window.");
      }

      const now = new Date();
      const activeBookings = slot.bookings.filter(
        (booking) =>
          booking.status === "paid" ||
          (booking.status === "pending" &&
            now.getTime() - booking.createdAt.getTime() < 30 * 60_000),
      );

      const bookingIntervals: CapacityInterval[] = activeBookings.map((booking) => ({
        startAt: booking.bookingStartAt ?? slot.startAt,
        endAt: booking.bookingEndAt ?? slotEnd,
        units:
          slot.activity.mode === "FIXED_SEAT_EVENT"
            ? Math.max(1, booking.partySize)
            : Math.max(1, booking.reservedUnits),
      }));
      const blockIntervals: CapacityInterval[] = slot.availabilityBlocks.map(
        (block) => ({
          startAt: block.startAt,
          endAt: block.endAt,
          units: Math.max(1, block.units),
        }),
      );
      const existingIntervals = [...bookingIntervals, ...blockIntervals];
      const maximumUsed = maximumConcurrentUnits(
        existingIntervals,
        startAt,
        endAt,
      );
      const availableToBlock = Math.max(0, slot.capacity - maximumUsed);

      if (blockAllAvailable) {
        const segments = buildFullBlockSegments(
          existingIntervals,
          startAt,
          endAt,
          slot.capacity,
        );
        if (segments.length === 0) {
          throw new Error("This range is already fully unavailable.");
        }
        return Promise.all(
          segments.map((segment) =>
            tx.availabilityBlock.create({
              data: {
                activityId: slot.activity.id,
                timeSlotId: slot.id,
                startAt: segment.startAt,
                endAt: segment.endAt,
                units: segment.units,
                reason,
              },
            }),
          ),
        );
      }

      const units = requestedUnits!;
      if (availableToBlock <= 0) {
        throw new Error("There is no remaining availability to block in this range.");
      }
      if (units > availableToBlock) {
        throw new Error(
          `Only ${availableToBlock} unit${availableToBlock === 1 ? " is" : "s are"} available to block in this range.`,
        );
      }

      const block = await tx.availabilityBlock.create({
        data: {
          activityId: slot.activity.id,
          timeSlotId: slot.id,
          startAt,
          endAt,
          units,
          reason,
        },
      });
      return [block];
    });

    revalidatePlanner(tenant.slug, slotId);
    return NextResponse.json({
      ok: true,
      blocks: created.map((block) => ({
        id: block.id,
        units: block.units,
        startAt: block.startAt.toISOString(),
        endAt: block.endAt.toISOString(),
        reason: block.reason,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not block availability.";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("Forbidden")
          ? 403
          : message.includes("not found")
            ? 404
            : message.includes("available") || message.includes("closed")
              ? 409
              : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ club: string }> },
) {
  try {
    const { club } = await params;
    const tenant = await requireTenant(club);
    await requireClubAdminStrict(tenant.id);
    const body = await request.json();
    const blockId = optionalText(body.blockId);

    if (!blockId) {
      return NextResponse.json({ error: "Missing block." }, { status: 400 });
    }

    const block = await prisma.availabilityBlock.findFirst({
      where: { id: blockId, activity: { clubId: tenant.id } },
      select: { id: true, timeSlotId: true },
    });
    if (!block) {
      return NextResponse.json({ error: "Block not found." }, { status: 404 });
    }

    await prisma.availabilityBlock.delete({ where: { id: block.id } });
    revalidatePlanner(tenant.slug, block.timeSlotId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not remove block.";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("Forbidden")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
