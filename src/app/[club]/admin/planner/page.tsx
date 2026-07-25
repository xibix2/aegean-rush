import prisma from "@/lib/prisma";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import { requireTenant } from "@/lib/tenant";
import {
  formatYMDInTz,
  localStartOfDayUTC,
  localWallTimeToUTC,
  resolveTz,
} from "@/lib/timezone";
import PlannerBoard from "@/components/admin/PlannerBoard";
import type {
  PlannerActivity,
  PlannerMode,
} from "@/lib/admin-planner-types";

export const revalidate = 0;
export const dynamic = "force-dynamic";

function shiftYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12))
    .toISOString()
    .slice(0, 10);
}

function isYmd(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function PlannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ club }, query] = await Promise.all([params, searchParams]);
  const tenant = await requireTenant(club);
  await requireClubAdminStrict(tenant.id);

  const setting = await prisma.appSetting.findUnique({
    where: { clubId: tenant.id },
    select: { tz: true },
  });
  const timeZone = resolveTz(setting?.tz);
  const today = formatYMDInTz(new Date(), timeZone);
  const tomorrow = shiftYmd(today, 1);
  const requestedDate = Array.isArray(query.date) ? query.date[0] : query.date;
  const date = isYmd(requestedDate) ? requestedDate : today;
  const dayStart = localStartOfDayUTC(date, timeZone);
  const dayEnd = localStartOfDayUTC(shiftYmd(date, 1), timeZone);

  const slots = await prisma.timeSlot.findMany({
    where: {
      startAt: { gte: dayStart, lt: dayEnd },
      activity: { clubId: tenant.id, active: true },
    },
    orderBy: [{ activity: { name: "asc" } }, { startAt: "asc" }],
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
        where: { status: { in: ["paid", "pending"] } },
        orderBy: [
          { bookingStartAt: "asc" },
          { createdAt: "asc" },
        ],
        include: {
          customer: true,
          payment: true,
        },
      },
    },
  });

  const activityMap = new Map<string, PlannerActivity>();

  for (const slot of slots) {
    const fallbackEnd = new Date(
      slot.startAt.getTime() + slot.activity.durationMin * 60_000
    );
    const slotEnd = slot.endAt ?? fallbackEnd;
    const activity =
      activityMap.get(slot.activityId) ??
      {
        id: slot.activity.id,
        name: slot.activity.name,
        mode: slot.activity.mode as PlannerMode,
        minParty: slot.activity.minParty,
        maxParty: slot.activity.maxParty,
        guestsPerUnit: slot.activity.guestsPerUnit,
        maxUnitsPerBooking: slot.activity.maxUnitsPerBooking,
        slotIntervalMin: slot.activity.slotIntervalMin,
        durationOptions: slot.activity.durationOptions.map((option) => ({
          id: option.id,
          label: option.label,
          durationMin: option.durationMin,
          priceCents: option.priceCents,
        })),
        slots: [],
      };

    activity.slots.push({
      id: slot.id,
      status: slot.status,
      startAt: slot.startAt.toISOString(),
      endAt: slotEnd.toISOString(),
      capacity: slot.capacity,
      priceCents: slot.priceCents,
      bookings: slot.bookings.map((booking) => ({
        id: booking.id,
        slotId: slot.id,
        status: booking.status as "paid" | "pending",
        customerName:
          booking.contactName ?? booking.customer?.name ?? "Guest",
        customerPhone:
          booking.contactPhone ?? booking.customer?.phone ?? null,
        partySize: booking.partySize,
        reservedUnits: Math.max(1, booking.reservedUnits || 1),
        totalPrice: booking.totalPrice,
        startAt: (booking.bookingStartAt ?? slot.startAt).toISOString(),
        endAt: (booking.bookingEndAt ?? slotEnd).toISOString(),
        pricingLabel: booking.pricingLabelSnapshot,
        source: booking.payment?.providerIntentId.startsWith("admin_manual_")
          ? "walkIn"
          : "online",
      })),
    });
    activityMap.set(slot.activityId, activity);
  }

  const activities = [...activityMap.values()];
  const defaultStart = localWallTimeToUTC(date, "08:00", timeZone).getTime();
  const defaultEnd = localWallTimeToUTC(date, "20:00", timeZone).getTime();
  const slotStarts = slots.map((slot) => slot.startAt.getTime());
  const slotEnds = slots.map((slot) =>
    (
      slot.endAt ??
      new Date(slot.startAt.getTime() + slot.activity.durationMin * 60_000)
    ).getTime()
  );
  const timelineStart = Math.min(defaultStart, ...slotStarts);
  const timelineEnd = Math.max(defaultEnd, ...slotEnds);

  return (
    <PlannerBoard
      tenantSlug={tenant.slug}
      date={date}
      today={today}
      tomorrow={tomorrow}
      timeZone={timeZone}
      currency={tenant.currency || "EUR"}
      timelineStart={timelineStart}
      timelineEnd={timelineEnd}
      activities={activities}
    />
  );
}
