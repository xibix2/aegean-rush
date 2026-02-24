// src/app/[club]/admin/activities/[id]/page.tsx
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ActivityDetailHeaderClient } from "@/components/admin/ActivityDetailHeaderClient";
import { ActivityFormClient } from "@/components/admin/ActivityFormClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdmin } from "@/lib/admin-guard";
import { redirect } from "next/navigation";

export const revalidate = 0;

/* ============ shared helpers ============ */
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

/* ============ server actions (tenant-scoped via slug) ============ */
async function updateActivityAction(
  tenantSlug: string,
  id: string,
  formData: FormData
) {
  "use server";
  const tenant = await requireTenant(tenantSlug);
  await requireClubAdmin(tenant.id);

  const name = String(formData.get("name") || "").trim();
  const durationMin = Number(formData.get("durationMin") || 60) || 60;
  const basePriceEuro = Number(formData.get("basePriceEuro") || 0);
  const basePrice = Math.max(0, Math.round(basePriceEuro * 100));
  const maxParty = Math.max(1, Number(formData.get("maxParty") || 4));
  const description = String(formData.get("description") || "");
  const locationId = String(formData.get("locationId") || "athens-marina");
  const active = formData.get("active") === "on";

  let cover: string | undefined | null = undefined;
  const uploaded = (formData.get("coverFile") as File) || null;
  if (uploaded && uploaded.size > 0) {
    cover = await saveImageFile(uploaded);
  }

  await prisma.activity.update({
    where: { id, clubId: tenant.id },
    data: {
      name,
      durationMin,
      basePrice,
      maxParty,
      description,
      locationId,
      active,
      ...(cover !== undefined ? { coverImageUrl: cover } : {}),
    } as any,
  });

  revalidatePath(`/${tenantSlug}/admin/activities/${id}`);
}

async function deleteActivityAction(tenantSlug: string, id: string) {
  "use server";
  const tenant = await requireTenant(tenantSlug);
  await requireClubAdmin(tenant.id);

  await prisma.activity.delete({
    where: { id, clubId: tenant.id },
  });

  const listPath = `/${tenantSlug}/admin/activities`;
  revalidatePath(listPath);

  // ✅ After delete, go to a dedicated confirmation page
  redirect(`/${tenantSlug}/admin/activities/deleted`);
}

/* ============ page (server) ============ */
export default async function ActivityDetailPage({
  params,
}: {
  params: { club: string; id: string };
}) {
  const tenant = await requireTenant(params.club);
  await requireClubAdmin(tenant.id);

  const a = await prisma.activity.findFirst({
    where: { id: params.id, clubId: tenant.id },
  });

  if (!a) {
    return (
      <main className="p-6 text-center">
        <div className="text-lg opacity-80">Activity not found.</div>
        <a href={`/${tenant.slug}/admin/activities`} className="underline">
          Back to activities
        </a>
      </main>
    );
  }

  return (
    <main className="space-y-8 px-6 py-10 max-w-4xl mx-auto">
      <ActivityDetailHeaderClient name={a.name} />
      <ActivityFormClient
        activity={{
          id: a.id,
          name: a.name,
          durationMin: a.durationMin ?? 60,
          basePriceEuro: (a.basePrice ?? 0) / 100,
          maxParty: a.maxParty ?? 4,
          description: a.description ?? "",
          locationId: a.locationId ?? "athens-marina",
          active: a.active,
        }}
        // Bind tenant slug + id into the actions so they’re tenant-safe
        updateAction={updateActivityAction.bind(null, params.club, a.id)}
        deleteAction={deleteActivityAction.bind(null, params.club, a.id)}
      />
    </main>
  );
}