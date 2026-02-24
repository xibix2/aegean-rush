// src/app/[club]/admin/slots/generate/page.tsx
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

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* =========================
   SERVER ACTION
   ========================= */
async function generate(formData: FormData) {
  "use server";

  const tenant = await requireTenant();
  await requireClubAdminStrict(tenant.id);
  const base = `/${tenant.slug}`;

  // tenant-specific tz
  const setting = await prisma.appSetting.findUnique({ where: { clubId: tenant.id } });
  const tz = setting?.tz || DEFAULT_TZ;

  const activityId = String(formData.get("activityId") || "");
  const from = String(formData.get("from") || "");
  const to = String(formData.get("to") || "");
  const times = String(formData.get("times") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const days = (formData.getAll("days") as DayKey[]) || [];

  if (!activityId) throw new Error("Activity is required.");
  if (!from || !to) throw new Error("Date range is required.");
  if (!times.length) throw new Error("At least one time is required.");
  if (!days.length) throw new Error("Select at least one day.");

  // 🔒 ensure the activity belongs to this tenant & pull defaults
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, clubId: tenant.id },
    select: {
      id: true,
      durationMin: true, // default duration
      basePrice: true,   // default price (cents)
      maxParty: true,    // we'll use this as default capacity
    },
  });
  if (!activity) throw new Error("Activity not found for this club.");

  // ---- Use activity defaults if fields are left empty in the form ----
  const durationInput = Number(formData.get("durationMin") || "");
  const capacityInput = Number(formData.get("capacity") || "");
  const priceEuroInput = Number(formData.get("priceEuro") || "");

  // Duration: prefer explicit form value, else activity.durationMin, else 60
  const durationMin =
    Number.isFinite(durationInput) && durationInput > 0
      ? durationInput
      : activity.durationMin ?? 60;

  // Capacity: prefer explicit form value, else activity.maxParty, else 4
  const capacity =
    Number.isFinite(capacityInput) && capacityInput > 0
      ? capacityInput
      : activity.maxParty ?? 4;

  // Price: prefer explicit form value (in €), else activity.basePrice (already cents), else 0
  const priceCents =
    Number.isFinite(priceEuroInput) && priceEuroInput > 0
      ? Math.round(priceEuroInput * 100)
      : activity.basePrice ?? 0;

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

  for (let cursor = new Date(start); cursor <= addDays(end, 1); cursor = addDays(cursor, 1)) {
    const ymd = toLocalYMD(cursor);
    const dow = String(weekdayInTz(ymd, tz)) as DayKey;

    if (days.includes(dow)) {
      for (const t of times) {
        const startAt = wallToUTC(ymd, t, tz);
        const endAt = new Date(startAt.getTime() + durationMin * 60 * 1000);
        toCreate.push({ activityId, startAt, endAt, capacity, priceCents });
      }
    }
  }

  if (!toCreate.length) redirect(`${base}/admin/slots?created=0`);

  let inserted = 0;
  for (const group of chunk(toCreate, 25)) {
    await prisma.$transaction(
      group.map((s) =>
        prisma.timeSlot.upsert({
          where: { activityId_startAt: { activityId: s.activityId, startAt: s.startAt } },
          create: s,
          update: { endAt: s.endAt, capacity: s.capacity, priceCents: s.priceCents },
        }),
      ),
    );
    inserted += group.length;
  }

  // tenant-scoped revalidation + redirect
  revalidatePath(`${base}/admin/slots`);
  revalidatePath(`${base}/timetable`);
  redirect(`${base}/admin/slots?created=${inserted}`);
}

/* =========================
   PAGE (server)
   ========================= */
export default async function GenerateSlotsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const tenant = await requireTenant();
  await requireClubAdminStrict(tenant.id);

  const sp = searchParams ?? {};
  const created = Number(sp.created ?? NaN);

  // Only tenant's activities – include defaults for the client
  const activities = await prisma.activity.findMany({
    where: { clubId: tenant.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      durationMin: true,
      basePrice: true,
      maxParty: true,
    },
  });

  // Default values
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const defaults = {
    from: fmt(today),
    to: fmt(nextWeek),
    time: "09:00",
  };

  return (
    <SlotGeneratorClient
      activities={activities}
      created={Number.isFinite(created) ? created : undefined}
      defaults={defaults}
      action={generate}
    />
  );
}