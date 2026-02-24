// src/app/admin/clubs/new/page.tsx
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function createClub(formData: FormData) {
  "use server";
  await requireSuperAdmin();

  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();
  const currency = String(formData.get("currency") || "EUR").toUpperCase();

  const adminEmail = String(formData.get("adminEmail") || "").trim().toLowerCase();
  const adminPassword = String(formData.get("adminPassword") || "");

  if (!name) throw new Error("Name is required");
  slug = slug ? slugify(slug) : slugify(name);
  if (!slug) throw new Error("Slug is required");

  const existing = await prisma.club.findUnique({ where: { slug } });
  if (existing) throw new Error("Slug already in use");

  // 1) Create the club
  const club = await prisma.club.create({
    data: { name, slug, currency },
    select: { id: true, slug: true },
  });

  // 2) Ensure tenant AppSetting exists
  await prisma.appSetting.upsert({
    where: { clubId: club.id },
    update: {},
    create: { clubId: club.id, tz: "Europe/Athens" },
  });

  // 3) Optionally create the initial ADMIN user
  if (adminEmail && adminPassword) {
    // duplicate within this club?
    const dup = await prisma.user.findFirst({
      where: { clubId: club.id, email: adminEmail },
      select: { id: true },
    });
    if (dup) throw new Error("Admin email already exists for this club");

    const hash = bcrypt.hashSync(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hash,
        role: "ADMIN",
        clubId: club.id,
      },
    });
  }

  // 4) Revalidate superadmin list and go straight to club admin
  revalidatePath("/admin/clubs");
  redirect(`/${club.slug}/admin`);
}

export default async function NewClubPage() {
  await requireSuperAdmin();

  return (
    <main className="max-w-lg mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-accent-gradient">Create club</span>
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Pick a name, slug and currency. Optionally, create the first admin user.
        </p>
      </header>

      <form action={createClub} className="space-y-4 rounded-2xl u-border u-surface p-5">
        {/* Club fields */}
        <label className="block text-sm">
          <span className="opacity-80">Name</span>
          <input
            name="name"
            type="text"
            required
            placeholder="Harbor Tennis"
            className="mt-1 w-full h-11 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
          />
        </label>

        <label className="block text-sm">
          <span className="opacity-80">Slug</span>
          <input
            name="slug"
            type="text"
            pattern="[a-z0-9-]+"
            placeholder="harbor-tennis"
            className="mt-1 w-full h-11 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
          />
          <small className="opacity-60">Lowercase, numbers and dashes only.</small>
        </label>

        <label className="block text-sm">
          <span className="opacity-80">Currency</span>
          <select
            name="currency"
            defaultValue="EUR"
            className="mt-1 w-full h-11 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </label>

        <div className="h-px bg-[--color-border] my-4" />

        {/* Optional initial admin */}
        <h3 className="text-sm font-medium opacity-85">Initial admin (optional)</h3>

        <label className="block text-sm">
          <span className="opacity-80">Admin email</span>
          <input
            name="adminEmail"
            type="email"
            placeholder="owner@harbor-tennis.com"
            className="mt-1 w-full h-11 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
          />
        </label>

        <label className="block text-sm">
          <span className="opacity-80">Admin password</span>
          <input
            name="adminPassword"
            type="password"
            placeholder="••••••••"
            className="mt-1 w-full h-11 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
          />
          <small className="opacity-60">
            If you fill both email & password, an ADMIN user will be created for this club.
          </small>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button className="inline-flex items-center justify-center rounded-xl px-5 h-11 text-sm font-medium btn-accent">
            Create club
          </button>
          <a href="/admin/clubs" className="text-sm opacity-80 hover:opacity-100">
            Cancel
          </a>
        </div>
      </form>
    </main>
  );
}