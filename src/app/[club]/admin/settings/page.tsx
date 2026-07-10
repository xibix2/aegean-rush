// src/app/[club]/admin/settings/page.tsx
import prisma from "@/lib/prisma";
import { COMMON_TZS, DEFAULT_TZ, resolveTz } from "@/lib/timezone";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminSettingsClient from "@/components/admin/settings/AdminSettingsClient";
import { requireTenant } from "@/lib/tenant";
import { requireClubAdminStrict } from "@/lib/admin-guard";
import Link from "next/link";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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

  // TODO: plug in production storage (S3 / R2 / etc.)
  return null;
}

async function saveSettings(formData: FormData) {
  "use server";

  const tenant = await requireTenant();
  const session = await requireClubAdminStrict(tenant.id);

  // Settings are club-wide; non-admin staff should not change them.
  if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
    redirect(`/${tenant.slug}/admin?forbidden=settings`);
  }

  // Load plan so we can gate features
  const clubForPlan = await prisma.club.findUnique({
    where: { id: tenant.id },
    select: { subscriptionPlan: true },
  });
  const plan = clubForPlan?.subscriptionPlan ?? "BASIC";

  const isBasic = plan === "BASIC";
  const isPro = plan === "PRO";
  const isEnterprise = plan === "ENTERPRISE";

  const val = (k: string, fallback = "") =>
    String(formData.get(k) ?? fallback).trim();

  const year = 60 * 60 * 24 * 365;

  // UI cookies live under the tenant path to avoid cross-tenant bleed
  const tenantPath = `/${tenant.slug}`;
  const uiCookieOpts = {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: tenantPath,
    maxAge: year,
  };

  // Optional global cookie (kept global on purpose)
  const globalCookieOpts = {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: year,
  };

  try {
    const tz = resolveTz(val("tz", DEFAULT_TZ));
    await prisma.appSetting.upsert({
      where: { clubId: tenant.id },
      update: { tz },
      create: { clubId: tenant.id, tz },
    });

    // UI preferences are stored per tenant so admins can switch clubs safely.
    const jar = await cookies();
    const theme = val("theme", "dark");
    const rawAccent = val("accent", "pink");

    // BASIC plan: forced pink; PRO/ENTERPRISE can pick from select
    const accent = isBasic ? "pink" : rawAccent || "pink";

    const key = (base: string) => `${base}__${tenant.slug}`;
    const currentLang =
      jar.get(key("ui_lang"))?.value ?? jar.get("ui_lang")?.value ?? "en";
    const requestedLang = val("lang", currentLang);
    const lang = isBasic ? currentLang : requestedLang;

    // normalize currency to first glyph/char
    const rawCurrency = val("currency", "€");
    const currency = Array.from(rawCurrency)[0] || "€";

    const compact = formData.get("compact") ? "1" : "0";
    const sessionHrs = val("session", "8");

    // tenant-scoped UI cookies (namespaced + tenant path)
    jar.set(key("ui_theme"), theme, uiCookieOpts);
    jar.set(key("ui_accent"), accent, uiCookieOpts);
    jar.set(key("ui_currency"), currency, uiCookieOpts);
    jar.set(key("ui_compact"), compact, uiCookieOpts);

    // Only write lang cookie if allowed (PRO/ENTERPRISE)
    if (!isBasic) {
      jar.set(key("ui_lang"), lang, uiCookieOpts);
    }

    // keep tz in UI cookie too, tenant-scoped
    jar.set(key("ui_tz"), tz, uiCookieOpts);

    // Session lifetime is global because the auth cookie is not tenant-scoped.
    jar.set("admin_session_hours", sessionHrs, globalCookieOpts);

    // 3) Branding fields stored on Club (gated by plan)
    const canUseHex = isEnterprise;
    const primaryHex = canUseHex ? val("primaryHex") : "";

    // Logo + email customization: ENTERPRISE only
    const canUseEnterpriseBranding = isEnterprise;

    const emailFromName = canUseEnterpriseBranding ? val("emailFromName") : "";
    const emailFromEmail = canUseEnterpriseBranding ? val("emailFromEmail") : "";
    const uploadedLogo = canUseEnterpriseBranding
      ? ((formData.get("logoFile") as File) || null)
      : null;

    const logoKey = uploadedLogo ? await saveImageFile(uploadedLogo) : null;

    await prisma.club.update({
      where: { id: tenant.id },
      data: {
        ...(canUseEnterpriseBranding
          ? {
              emailFromName: emailFromName || null,
              emailFromEmail: emailFromEmail || null,
            }
          : {}),
        ...(canUseHex
          ? {
              primaryHex: primaryHex || null,
            }
          : {}),
        ...(logoKey ? { logoKey } : {}),
      },
    });

    const base = `/${tenant.slug}`;
    revalidatePath(`${base}/admin`);
    revalidatePath(`${base}/admin/bookings`);
    revalidatePath(`${base}/admin/slots`);
    revalidatePath(`${base}/admin/activities`);
    revalidatePath(`${base}/admin/settings`);
    revalidatePath(`${base}/timetable`);
    revalidatePath(base);
    redirect(`${base}/admin/settings?saved=1`);
  } catch (err) {
    console.error("[saveSettings] failed:", err);
    redirect(`/${(await requireTenant()).slug}/admin/settings?saved=0`);
  }
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const tenant = await requireTenant();
  const session = await requireClubAdminStrict(tenant.id);

  // Settings contain billing and branding controls, so only admins can view them.
  if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          No access to settings
        </h1>
        <p className="text-sm opacity-70 max-w-xl mx-auto">
          Only club admins can change timezone, branding, and billing settings
          for <span className="font-medium">{tenant.name}</span>.{" "}
          If you think this is a mistake, please contact your club owner.
        </p>
        <div className="mt-4">
          <Link
            href={`/${tenant.slug}/admin`}
            className="inline-flex items-center rounded-full u-border u-surface px-4 py-2 text-sm hover:u-surface-2 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Ensure a per-tenant row exists (tz only)
  const setting = await prisma.appSetting.upsert({
    where: { clubId: tenant.id },
    update: {},
    create: { clubId: tenant.id, tz: DEFAULT_TZ },
  });
  const currentTz = setting.tz || DEFAULT_TZ;

  // Load branding + plan from Club
  const club = await prisma.club.findUnique({
    where: { id: tenant.id },
    select: {
      subscriptionPlan: true,
      primaryHex: true,
      emailFromName: true,
      emailFromEmail: true,
    },
  });

  // Prefer tenant-scoped UI cookies; fall back to older global cookies.
  const jar = await cookies();
  const key = (base: string) => `${base}__${tenant.slug}`;

  const theme =
    jar.get(key("ui_theme"))?.value ?? jar.get("ui_theme")?.value ?? "dark";
  const accent =
    jar.get(key("ui_accent"))?.value ?? jar.get("ui_accent")?.value ?? "pink";
  const lang =
    jar.get(key("ui_lang"))?.value ?? jar.get("ui_lang")?.value ?? "en";
  const currency =
    jar.get(key("ui_currency"))?.value ?? jar.get("ui_currency")?.value ?? "€";
  const compact =
    (jar.get(key("ui_compact"))?.value ?? jar.get("ui_compact")?.value) === "1";
  const sessionHrs = jar.get("admin_session_hours")?.value ?? "8";

  const saved =
    (typeof searchParams?.saved === "string"
      ? searchParams?.saved
      : undefined) === "1";

  const base = `/${tenant.slug}`;

  return (
    <>
      <AdminSettingsClient
        saved={saved}
        currentTz={currentTz}
        theme={theme}
        accent={accent}
        lang={lang}
        currency={currency}
        compact={compact}
        sessionHrs={sessionHrs}
        tzOptions={COMMON_TZS}
        action={saveSettings}
        primaryHex={club?.primaryHex ?? ""}
        emailFromName={club?.emailFromName ?? ""}
        emailFromEmail={club?.emailFromEmail ?? ""}
        subscriptionPlan={club?.subscriptionPlan ?? "BASIC"}
      />

      {/* Billing shortcut card */}
      <section className="mt-8 rounded-2xl u-border u-surface p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold opacity-85">
            Subscription &amp; billing
          </h2>
          <p className="mt-1 text-xs sm:text-sm opacity-70 max-w-md">
            Change your plan, update your card, and see your billing status for
            this club.
          </p>
        </div>
        <Link
          href={`${base}/admin/billing`}
          className="inline-flex items-center justify-center rounded-xl h-10 px-4 text-sm font-medium btn-accent"
        >
          Manage subscription
        </Link>
      </section>
    </>
  );
}

