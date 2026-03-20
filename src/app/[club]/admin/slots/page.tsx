// src/app/[club]/admin/slots/page.tsx
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import {
  DEFAULT_TZ,
  localStartOfDayUTC,
  localWallTimeToUTC as wallToUTC,
  toLocalYMD,
  weekdayInTz,
} from "@/lib/timezone";
import SlotGeneratorClient from "@/components/admin/SlotGeneratorClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type DayKey = "0" | "1" | "2" | "3" | "4" | "5" | "6";
type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function parsePositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

function parseTimeList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* =========================
   SERVER ACTION
   ========================= */
async function generate(tenantSlug: string, formData: FormData) {
  "use server";

  const tenant = await requireTenant(tenantSlug);
  await requireClubAdminStrict(tenant.id);
  const base = `/${tenant.slug}`;

  const setting = await prisma.appSetting.findUnique({
    where: { clubId: tenant.id },
  });
  const tz = setting?.tz || DEFAULT_TZ;

  const activityId = String(formData.get("activityId") || "");
  const from = String(formData.get("from") || "");
  const to = String(formData.get("to") || "");
  const days = (formData.getAll("days") as DayKey[]) || [];

  if (!activityId) throw new Error("Activity is required.");
  if (!from || !to) throw new Error("Date range is required.");
  if (!days.length) throw new Error("Select at least one day.");

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, clubId: tenant.id },
    select: {
      id: true,
      mode: true,
      durationMin: true,
      basePrice: true,
      maxParty: true,
      maxUnitsPerBooking: true,
      guestsPerUnit: true,
      durationOptions: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          durationMin: true,
          priceCents: true,
        },
      },
    },
  });

  if (!activity) {
    throw new Error("Activity not found for this business.");
  }

  const firstDurationOption = activity.durationOptions[0] ?? null;
  const start = localStartOfDayUTC(from, tz);
  const end = localStartOfDayUTC(to, tz);

  type NewSlot = {
    activityId: string;
    startAt: Date;
    endAt: Date;
    capacity: number;
    priceCents: number;
  };

  const toCreate: NewSlot[] = [];

  if (activity.mode === "FIXED_SEAT_EVENT") {
    const times = parseTimeList(formData.get("times"));
    if (!times.length) throw new Error("At least one departure time is required.");

    const durationMin = parsePositiveInt(
      formData.get("durationMin"),
      activity.durationMin ?? 60
    );

    const capacity = parsePositiveInt(
      formData.get("capacity"),
      activity.maxParty ?? 4
    );

    const priceCents = Math.max(
      0,
      Math.round(Number(formData.get("priceEuro") || 0) * 100)
    );

    for (
      let cursor = new Date(start);
      cursor <= addDays(end, 1);
      cursor = addDays(cursor, 1)
    ) {
      const ymd = toLocalYMD(cursor);
      const dow = String(weekdayInTz(ymd, tz)) as DayKey;

      if (!days.includes(dow)) continue;

      for (const t of times) {
        const startAt = wallToUTC(ymd, t, tz);
        const endAt = new Date(startAt.getTime() + durationMin * 60 * 1000);

        toCreate.push({
          activityId,
          startAt,
          endAt,
          capacity,
          priceCents: priceCents > 0 ? priceCents : activity.basePrice ?? 0,
        });
      }
    }
  } else {
    const windowStartTime = String(formData.get("windowStartTime") || "").trim();
    const windowEndTime = String(formData.get("windowEndTime") || "").trim();

    if (!windowStartTime || !windowEndTime) {
      throw new Error("Available from/to times are required.");
    }

    const unitsAvailable = parsePositiveInt(
      formData.get("capacity"),
      activity.maxUnitsPerBooking ?? 1
    );

    for (
      let cursor = new Date(start);
      cursor <= addDays(end, 1);
      cursor = addDays(cursor, 1)
    ) {
      const ymd = toLocalYMD(cursor);
      const dow = String(weekdayInTz(ymd, tz)) as DayKey;

      if (!days.includes(dow)) continue;

      const startAt = wallToUTC(ymd, windowStartTime, tz);
      const endAt = wallToUTC(ymd, windowEndTime, tz);

      if (endAt <= startAt) {
        throw new Error("Available-to time must be later than available-from time.");
      }

      toCreate.push({
        activityId,
        startAt,
        endAt,
        capacity: unitsAvailable,
        priceCents: firstDurationOption?.priceCents ?? activity.basePrice ?? 0,
      });
    }
  }

  if (!toCreate.length) {
    redirect(`${base}/admin/slots?created=0`);
  }

  let inserted = 0;

  for (const group of chunk(toCreate, 25)) {
    await prisma.$transaction(
      group.map((slot) =>
        prisma.timeSlot.upsert({
          where: {
            activityId_startAt: {
              activityId: slot.activityId,
              startAt: slot.startAt,
            },
          },
          create: slot,
          update: {
            endAt: slot.endAt,
            capacity: slot.capacity,
            priceCents: slot.priceCents,
          },
        })
      )
    );

    inserted += group.length;
  }

  revalidatePath(`${base}/admin/slots`);
  revalidatePath(`${base}/timetable`);
  redirect(`${base}/admin/slots?created=${inserted}`);
}

/* =========================
   PAGE (server)
   ========================= */
export default async function GenerateSlotsPage({
  params,
  searchParams,
}: {
  params: { club: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const tenant = await requireTenant(params.club);
  await requireClubAdminStrict(tenant.id);

  const sp = searchParams ?? {};
  const created = Number(sp.created ?? NaN);

  const activities = await prisma.activity.findMany({
    where: { clubId: tenant.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      mode: true,
      durationMin: true,
      basePrice: true,
      maxParty: true,
      slotIntervalMin: true,
      maxUnitsPerBooking: true,
      guestsPerUnit: true,
      durationOptions: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          durationMin: true,
          priceCents: true,
        },
      },
    },
  });

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const defaults = {
    from: fmt(today),
    to: fmt(nextWeek),
    departureTime: "09:00",
    availableFromTime: "09:00",
    availableToTime: "21:00",
  };

  return (
    <SlotGeneratorClient
      activities={activities}
      created={Number.isFinite(created) ? created : undefined}
      defaults={defaults}
      backHref={`/${params.club}/admin/slots`}
      action={generate.bind(null, params.club)}
    />
  );
}