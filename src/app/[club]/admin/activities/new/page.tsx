// src/app/[club]/admin/activities/new/page.tsx
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NewActivityHeaderClient } from "@/components/admin/NewActivityHeaderClient";
import { NewActivityFormClient } from "@/components/admin/NewActivityFormClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import { redirect } from "next/navigation";
import { getPlanLimits } from "@/lib/billing";

export const revalidate = 0;
export const runtime = "nodejs";

/* ====== utils ====== */
function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getUniqueSlug(base: string, clubId: string) {
  const baseSlug = slugify(base) || "experience";
  let slug = baseSlug;

  for (let i = 0; ; i++) {
    const exists = await prisma.activity.findUnique({
      where: { clubId_slug: { clubId, slug } },
      select: { id: true },
    });

    if (!exists) return slug;
    slug = `${baseSlug}-${i + 1}`;
  }
}

async function saveImageFile(file: File | null): Promise<string | null> {
  console.log("saveImageFile called");
  console.log("file exists:", !!file);
  console.log("file name:", file?.name);
  console.log("file type:", file?.type);
  console.log("file size:", file?.size);

  if (!file || file.size === 0) {
    console.log("No file or empty file");
    return null;
  }

  if (!file.type?.startsWith("image/")) {
    console.log("Rejected: not an image");
    return null;
  }

  const ext = path.extname(file.name || "upload.jpg") || ".jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  console.log("uploadsDir:", uploadsDir);

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buf);

  const finalPath = `/uploads/${filename}`;
  console.log("saved to:", finalPath);

  return finalPath;
}

function parsePositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

function parseOptionalPositiveInt(value: FormDataEntryValue | null) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function parseEuroToCents(value: FormDataEntryValue | null, fallback = 0) {
  const raw = String(value || "").replace(",", ".").trim();
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : fallback;
}

function normalizeText(value: FormDataEntryValue | null) {
  const s = String(value || "").trim();
  return s.length ? s : null;
}

type ActivityModeValue =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

function parseActivityMode(value: FormDataEntryValue | null): ActivityModeValue {
  const v = String(value || "").trim();
  if (
    v === "FIXED_SEAT_EVENT" ||
    v === "DYNAMIC_RENTAL" ||
    v === "HYBRID_UNIT_BOOKING"
  ) {
    return v;
  }
  return "FIXED_SEAT_EVENT";
}

function parseDurationOptions(formData: FormData) {
  const durations = formData.getAll("durationOptionDurationMin");
  const prices = formData.getAll("durationOptionPriceEuro");
  const labels = formData.getAll("durationOptionLabel");

  const out: Array<{
    label: string | null;
    durationMin: number;
    priceCents: number;
    sortOrder: number;
  }> = [];

  const total = Math.max(durations.length, prices.length, labels.length);

  for (let i = 0; i < total; i++) {
    const durationMin = parseOptionalPositiveInt(durations[i] ?? null);
    const priceCents = parseEuroToCents(prices[i] ?? null, -1);
    const labelRaw = String(labels[i] ?? "").trim();

    if (!durationMin) continue;
    if (priceCents < 0) continue;

    out.push({
      label: labelRaw || null,
      durationMin,
      priceCents,
      sortOrder: out.length,
    });
  }

  return out;
}

/* ====== server action (tenant-scoped via slug) ====== */
async function createActivityAction(tenantSlug: string, formData: FormData) {
  "use server";

  const tenant = await requireTenant(tenantSlug);
  await requireClubAdmin(tenant.id);

  const club = await prisma.club.findUnique({
    where: { id: tenant.id },
    select: { subscriptionPlan: true },
  });

  const { maxActivities } = getPlanLimits(club?.subscriptionPlan ?? "BASIC");

  if (Number.isFinite(maxActivities)) {
    const currentCount = await prisma.activity.count({
      where: { clubId: tenant.id },
    });

    if (currentCount >= maxActivities) {
      redirect(`/${tenantSlug}/admin/activities/new/limit`);
    }
  }

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const mode = parseActivityMode(formData.get("mode"));
  const description = String(formData.get("description") || "").trim();
  const locationId =
    String(formData.get("locationId") || "hersonissos-port").trim() || "hersonissos-port";
  const active = formData.get("active") === "on";

  const meetingPoint = normalizeText(formData.get("meetingPoint"));
  const includedText = normalizeText(formData.get("includedText"));
  const bringText = normalizeText(formData.get("bringText"));
  const cancellationText = normalizeText(formData.get("cancellationText"));
  const ageInfo = normalizeText(formData.get("ageInfo"));
  const skillLevel = normalizeText(formData.get("skillLevel"));
  const safetyInfo = normalizeText(formData.get("safetyInfo"));
  const pricingNotes = normalizeText(formData.get("pricingNotes"));

  const minParty = parsePositiveInt(formData.get("minParty"), 1);
  const maxParty = Math.max(
    minParty,
    parsePositiveInt(formData.get("maxParty"), mode === "FIXED_SEAT_EVENT" ? 4 : 6)
  );

  const slotIntervalMin = parseOptionalPositiveInt(formData.get("slotIntervalMin"));
  const guestsPerUnit = parseOptionalPositiveInt(formData.get("guestsPerUnit"));
  const maxUnitsPerBooking = parseOptionalPositiveInt(formData.get("maxUnitsPerBooking"));

  const durationOptions = parseDurationOptions(formData);

  const manualDurationMin = parsePositiveInt(formData.get("durationMin"), 60);
  const manualBasePrice = parseEuroToCents(formData.get("basePriceEuro"), 0);

  const fallbackDurationMin =
    durationOptions.length > 0 ? durationOptions[0].durationMin : manualDurationMin;

  const fallbackBasePrice =
    durationOptions.length > 0 ? durationOptions[0].priceCents : manualBasePrice;

  const durationMin =
    mode === "FIXED_SEAT_EVENT" ? manualDurationMin : fallbackDurationMin;

  const basePrice =
    mode === "FIXED_SEAT_EVENT" ? manualBasePrice : fallbackBasePrice;

  const uploaded = (formData.get("coverFile") as File) || null;

  console.log("=== ACTIVITY UPLOAD DEBUG ===");
  console.log("uploaded exists:", !!uploaded);
  console.log("uploaded name:", uploaded?.name);
  console.log("uploaded type:", uploaded?.type);
  console.log("uploaded size:", uploaded?.size);

  const cover = await saveImageFile(uploaded);

  console.log("saved cover path:", cover);
  console.log("=== END ACTIVITY UPLOAD DEBUG ===");

  await prisma.activity.create({
    data: {
      club: { connect: { id: tenant.id } },
      name,
      slug: await getUniqueSlug(name, tenant.id),

      description,
      durationMin,
      minParty,
      maxParty,
      basePrice,

      requiresInstructor: false,
      locationId,
      active,
      sport: "watersports",
      coverImageUrl: cover,

      mode,
      meetingPoint,
      includedText,
      bringText,
      cancellationText,
      ageInfo,
      skillLevel,
      safetyInfo,
      pricingNotes,
      guestsPerUnit,
      maxUnitsPerBooking,
      slotIntervalMin,

      ...(durationOptions.length
        ? {
            durationOptions: {
              create: durationOptions.map((opt) => ({
                label: opt.label,
                durationMin: opt.durationMin,
                priceCents: opt.priceCents,
                sortOrder: opt.sortOrder,
              })),
            },
          }
        : {}),
    },
  });

  const listPath = `/${tenantSlug}/admin/activities`;
  revalidatePath(listPath);
  redirect(`/${tenantSlug}/admin/activities/new/success`);
}

/* ====== page ====== */
export default function NewActivityPage({
  params,
}: {
  params: { club: string };
}) {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <NewActivityHeaderClient />
      <NewActivityFormClient
        createAction={createActivityAction.bind(null, params.club)}
      />
    </main>
  );
}