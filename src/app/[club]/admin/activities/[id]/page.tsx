// src/app/[club]/admin/activities/[id]/page.tsx
import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ActivityDetailHeaderClient } from "@/components/admin/ActivityDetailHeaderClient";
import { ActivityFormClient } from "@/components/admin/ActivityFormClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import { redirect, notFound } from "next/navigation";
import { ActivityMode } from "@prisma/client";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/* ============ shared helpers ============ */
async function saveImageFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const isDev = process.env.NODE_ENV !== "production";
  const ext = path.extname(file.name || "upload.jpg") || ".jpg";
  const filename = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (isDev) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buf);
    return `/uploads/${filename}`;
  }

  return null;
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseOptionalString(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

function parseMode(value: FormDataEntryValue | null): ActivityMode {
  const raw = String(value || "").trim();
  if (
    raw === "FIXED_SEAT_EVENT" ||
    raw === "DYNAMIC_RENTAL" ||
    raw === "HYBRID_UNIT_BOOKING"
  ) {
    return raw;
  }
  return "FIXED_SEAT_EVENT";
}

function parseDurationOptions(formData: FormData) {
  const jsonRaw =
    String(formData.get("durationOptionsJson") || "").trim() ||
    String(formData.get("durationOptions") || "").trim();

  if (!jsonRaw) return null;

  try {
    const parsed = JSON.parse(jsonRaw);
    if (!Array.isArray(parsed)) return null;

    return parsed
      .map((item: any, index: number) => {
        const durationMin = Number(item?.durationMin);
        const priceInput =
          item?.priceCents != null
            ? Number(item.priceCents)
            : Math.round(Number(item?.priceEuro ?? 0) * 100);

        if (!Number.isFinite(durationMin) || durationMin <= 0) return null;
        if (!Number.isFinite(priceInput) || priceInput < 0) return null;

        return {
          label:
            typeof item?.label === "string" && item.label.trim().length
              ? item.label.trim()
              : null,
          durationMin: Math.trunc(durationMin),
          priceCents: Math.trunc(priceInput),
          isActive:
            typeof item?.isActive === "boolean" ? item.isActive : true,
          sortOrder:
            Number.isFinite(Number(item?.sortOrder))
              ? Math.trunc(Number(item.sortOrder))
              : index,
        };
      })
      .filter(Boolean) as Array<{
      label: string | null;
      durationMin: number;
      priceCents: number;
      isActive: boolean;
      sortOrder: number;
    }>;
  } catch {
    return null;
  }
}

/* ============ server actions ============ */
async function updateActivityAction(
  tenantSlug: string,
  id: string,
  formData: FormData
) {
  "use server";

  const tenant = await requireTenant(tenantSlug);
  await requireClubAdmin(tenant.id);

  const existing = await prisma.activity.findFirst({
    where: { id, clubId: tenant.id },
    select: { id: true, coverImageUrl: true },
  });

  if (!existing) {
    throw new Error("Activity not found for tenant");
  }

  const name = String(formData.get("name") || "").trim();
  const mode = parseMode(formData.get("mode"));

  const durationMin = Number(formData.get("durationMin") || 60) || 60;
  const basePriceEuro = Number(formData.get("basePriceEuro") || 0);
  const basePrice = Math.max(0, Math.round(basePriceEuro * 100));

  const minParty = Math.max(1, Number(formData.get("minParty") || 1));
  const maxParty = Math.max(minParty, Number(formData.get("maxParty") || 4));

  const description = String(formData.get("description") || "");
  const locationId = String(formData.get("locationId") || "athens-marina");
  const active = formData.get("active") === "on";

  const meetingPoint = parseOptionalString(formData.get("meetingPoint"));
  const includedText = parseOptionalString(formData.get("includedText"));
  const bringText = parseOptionalString(formData.get("bringText"));
  const cancellationText = parseOptionalString(formData.get("cancellationText"));
  const ageInfo = parseOptionalString(formData.get("ageInfo"));
  const skillLevel = parseOptionalString(formData.get("skillLevel"));
  const safetyInfo = parseOptionalString(formData.get("safetyInfo"));
  const pricingNotes = parseOptionalString(formData.get("pricingNotes"));

  const guestsPerUnit = parseOptionalInt(formData.get("guestsPerUnit"));
  const maxUnitsPerBooking = parseOptionalInt(
    formData.get("maxUnitsPerBooking")
  );
  const slotIntervalMin = parseOptionalInt(formData.get("slotIntervalMin"));

  const parsedDurationOptions = parseDurationOptions(formData);

  let newCoverUrl: string | undefined = undefined;
  const uploaded = formData.get("coverFile");

  if (uploaded instanceof File && uploaded.size > 0) {
    const saved = await saveImageFile(uploaded);

    if (saved) {
      newCoverUrl = saved;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: { id },
      data: {
        name,
        mode,
        durationMin,
        basePrice,
        minParty,
        maxParty,
        description,
        locationId,
        active,

        meetingPoint,
        includedText,
        bringText,
        cancellationText,
        ageInfo,
        skillLevel,
        safetyInfo,
        pricingNotes,

        guestsPerUnit:
          mode === "HYBRID_UNIT_BOOKING"
            ? Math.max(1, guestsPerUnit ?? 1)
            : guestsPerUnit,
        maxUnitsPerBooking:
          mode === "FIXED_SEAT_EVENT" ? null : maxUnitsPerBooking,
        slotIntervalMin:
          mode === "FIXED_SEAT_EVENT"
            ? slotIntervalMin
            : slotIntervalMin ?? 30,

        ...(newCoverUrl ? { coverImageUrl: newCoverUrl } : {}),
      },
    });

    if (parsedDurationOptions) {
      await tx.activityDurationOption.deleteMany({
        where: { activityId: id },
      });

      if (parsedDurationOptions.length > 0) {
        await tx.activityDurationOption.createMany({
          data: parsedDurationOptions.map((opt) => ({
            activityId: id,
            label: opt.label,
            durationMin: opt.durationMin,
            priceCents: opt.priceCents,
            isActive: opt.isActive,
            sortOrder: opt.sortOrder,
          })),
        });
      }
    }
  });

  revalidatePath(`/${tenantSlug}/admin/activities`);
  revalidatePath(`/${tenantSlug}/admin/activities/${id}`);
  revalidatePath(`/${tenantSlug}/timetable`);
}

async function deleteActivityAction(tenantSlug: string, id: string) {
  "use server";

  const tenant = await requireTenant(tenantSlug);
  await requireClubAdmin(tenant.id);

  const existing = await prisma.activity.findFirst({
    where: { id, clubId: tenant.id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Activity not found for tenant");
  }

  await prisma.activity.delete({
    where: { id },
  });

  revalidatePath(`/${tenantSlug}/admin/activities`);
  redirect(`/${tenantSlug}/admin/activities/deleted`);
}

/* ============ page ============ */
export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ club: string; id: string }>;
}) {
  noStore();

  const { club, id } = await params;

  if (!club || !id) {
    notFound();
  }

  const tenant = await requireTenant(club);
  await requireClubAdmin(tenant.id);

  const a = await prisma.activity.findFirst({
    where: {
      id,
      clubId: tenant.id,
    },
    include: {
      durationOptions: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!a) {
    notFound();
  }

  const activityPayload = {
    id: a.id,
    name: a.name,
    mode: a.mode,

    durationMin: a.durationMin ?? 60,
    basePriceEuro: (a.basePrice ?? 0) / 100,
    minParty: a.minParty ?? 1,
    maxParty: a.maxParty ?? 4,

    description: a.description ?? "",
    locationId: a.locationId ?? "athens-marina",
    active: a.active,
    coverImageUrl: a.coverImageUrl ?? null,

    meetingPoint: a.meetingPoint ?? "",
    includedText: a.includedText ?? "",
    bringText: a.bringText ?? "",
    cancellationText: a.cancellationText ?? "",
    ageInfo: a.ageInfo ?? "",
    skillLevel: a.skillLevel ?? "",
    safetyInfo: a.safetyInfo ?? "",
    pricingNotes: a.pricingNotes ?? "",

    guestsPerUnit: a.guestsPerUnit ?? 1,
    maxUnitsPerBooking: a.maxUnitsPerBooking ?? 1,
    slotIntervalMin: a.slotIntervalMin ?? 30,

    durationOptions: a.durationOptions.map((opt) => ({
      id: opt.id,
      label: opt.label ?? "",
      durationMin: opt.durationMin,
      priceEuro: opt.priceCents / 100,
      priceCents: opt.priceCents,
      isActive: opt.isActive,
      sortOrder: opt.sortOrder,
    })),
  };

  return (
    <main key={a.id} className="space-y-8 px-6 py-10 max-w-4xl mx-auto">
      <ActivityDetailHeaderClient key={a.id} name={a.name} />
      <ActivityFormClient
        key={a.id}
        activity={activityPayload}
        updateAction={updateActivityAction.bind(null, club, a.id)}
        deleteAction={deleteActivityAction.bind(null, club, a.id)}
      />
    </main>
  );
}