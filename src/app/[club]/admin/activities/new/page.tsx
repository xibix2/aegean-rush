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

/* ====== utils ====== */
function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function getUniqueSlug(base: string, clubId: string) {
  const baseSlug = slugify(base) || "court";
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
  if (!file || file.size === 0) return null;
  const isDev = process.env.NODE_ENV !== "production";
  const ext = path.extname(file.name || "upload.jpg") || ".jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  if (isDev) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buf);
    return `/uploads/${filename}`;
  }
  return null;
}

/* ====== server action (tenant-scoped via slug) ====== */
async function createActivityAction(tenantSlug: string, formData: FormData) {
  "use server";

  const tenant = await requireTenant(tenantSlug);
  await requireClubAdmin(tenant.id);

  // 1) Enforce plan limits before doing any heavy work
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
      // 🚫 redirect to "limit" page
      redirect(`/${tenantSlug}/admin/activities/new/limit`);
    }
  }

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const durationMin = Number(formData.get("durationMin") || 60) || 60;
  const basePriceEuro = Number(formData.get("basePriceEuro") || 0);
  const basePrice = Math.max(0, Math.round(basePriceEuro * 100));
  const maxParty = Math.max(1, Number(formData.get("maxParty") || 4));
  const locationId = String(formData.get("locationId") || "athens-marina");
  const description = String(formData.get("description") || "");
  const active = formData.get("active") === "on";

  const uploaded = (formData.get("coverFile") as File) || null;
  const cover = await saveImageFile(uploaded);

  await prisma.activity.create({
    data: {
      club: { connect: { id: tenant.id } },
      name,
      slug: await getUniqueSlug(name, tenant.id),
      description,
      durationMin,
      basePrice,
      locationId,
      active,
      coverImageUrl: cover,
      minParty: 1,
      maxParty,
      requiresInstructor: false,
      sport: "tennis",
    },
  });

  // ✅ Revalidate and redirect to success screen
  const listPath = `/${tenantSlug}/admin/activities`;
  revalidatePath(listPath);
  redirect(`/${tenantSlug}/admin/activities/new/success`);
}

/* ====== page ====== */
export default function NewActivityPage({
  params,
}: { params: { club: string } }) {
  return (
    <main className="space-y-8 px-6 py-10 max-w-4xl mx-auto">
      <NewActivityHeaderClient />
      <NewActivityFormClient
        createAction={createActivityAction.bind(null, params.club)}
      />
    </main>
  );
}
