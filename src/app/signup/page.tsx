// src/app/signup/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import Link from "next/link";

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

async function createClubAndAdmin(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim().toLowerCase();

  // ✅ NEW: location (optional)
  const location = String(formData.get("location") || "").trim();

  const adminEmail = String(formData.get("adminEmail") || "")
    .trim()
    .toLowerCase();
  const adminPassword = String(formData.get("adminPassword") || "");

  if (!name) throw new Error("Club name is required");
  if (!adminEmail) throw new Error("Admin email is required");
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  slug = slug ? slugify(slug) : slugify(name);
  if (!slug) throw new Error("Slug is required");

  // Make sure slug is unique
  const existingClub = await prisma.club.findUnique({ where: { slug } });
  if (existingClub) throw new Error("This slug is already in use");

  // Default currency is EUR now (no field on the form)
  const currency = "EUR";

  // Create club (billing fields will be handled by Stripe flow later)
  const club = await prisma.club.create({
    data: {
      name,
      slug,
      currency,
      // ✅ NEW: save location (null if empty)
      location: location || null,
      // subscriptionPlan & subscriptionStatus use Prisma defaults (BASIC / INACTIVE)
    },
    select: { id: true, slug: true },
  });

  // Create basic settings row
  await prisma.appSetting.upsert({
    where: { clubId: club.id },
    update: {},
    create: { clubId: club.id, tz: "Europe/Athens" },
  });

  // Ensure no duplicate admin email in this club (paranoia)
  const dup = await prisma.user.findFirst({
    where: { clubId: club.id, email: adminEmail },
    select: { id: true },
  });
  if (dup) throw new Error("Admin email already exists for this club");

  // Create the initial ADMIN user
  const hash = bcrypt.hashSync(adminPassword, 10);
  await prisma.user.create({
    data: {
      clubId: club.id,
      email: adminEmail,
      password: hash,
      role: "ADMIN",
    },
  });

  // Issue admin session cookies (same style as login)
  const jar = await cookies();
  const hours = 8;
  const maxAge = Math.max(1, Math.min(24 * 30, hours)) * 60 * 60;
  const common = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/" as const,
    maxAge,
  };

  jar.set("admin_auth", "yes", common);
  jar.set("admin_email", adminEmail, common);
  jar.set("admin_role", "ADMIN", common);
  jar.set("admin_clubId", club.id, common);
  jar.set("tenant_slug", club.slug, common);

  // Step 2: send them to the nice billing screen you already have
  redirect(`/onboarding/${club.slug}/billing?from=signup`);
}

export default function SignupPage() {
  const TXT = {
    backMain: "Back to main site",
    title: "Create your business",
    subtitle:
      "Set up your business and your first admin account. You’ll choose a plan on the next step.",
    badge: "Setup & billing next",
    sectionClub: "Business details",
    sectionAdmin: "Admin account",
    clubName: "Business name",
    clubSlug: "Slug (optional)",
    clubLocation: "Location (optional)",
    locationHint: "City, area, or full address.",
    slugHint: "Lowercase, numbers and dashes only.",
    adminEmail: "Admin email",
    adminPassword: "Admin password",
    pwHint: "Minimum 8 characters.",
    primaryBtn: "Create my business & continue to billing",
    cancel: "Cancel",
  };

  return (
    <main
      className="min-h-[100svh] grid place-items-center px-6 py-10"
      style={{
        ["--accent-700" as any]: "#a21caf",
        ["--accent-600" as any]: "#db2777",
        ["--accent-500" as any]: "#ec4899",
        ["--accent-400" as any]: "#f472b6",
        ["--accent-300" as any]: "#f9a8d4",
        ["--accent-glow" as any]: "244 114 182",
      }}
    >
      {/* Calm premium background (same vibe as login) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 50% -10%, color-mix(in oklab, var(--accent-600), transparent 86%), transparent 65%)," +
              "radial-gradient(700px 420px at 10% 20%, rgba(255,255,255,0.04), transparent 60%)," +
              "radial-gradient(700px 420px at 90% 70%, rgba(255,255,255,0.03), transparent 60%)," +
              "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.65))",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='3' cy='3' r='1' fill='%23ffffff' fill-opacity='0.30'/%3E%3Ccircle cx='27' cy='18' r='1' fill='%23ffffff' fill-opacity='0.22'/%3E%3Ccircle cx='18' cy='36' r='1' fill='%23ffffff' fill-opacity='0.18'/%3E%3C/svg%3E\")",
            animation: "signupTwinkle 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-1/2 top-[-140px] h-[520px] w-[860px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--accent-500), transparent 30%), transparent 70%)",
            animation: "signupFloat 10s ease-in-out infinite",
          }}
        />
      </div>

      <div className="w-full max-w-[520px]">
        {/* Top row */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs u-border u-surface/70 backdrop-blur hover:u-surface-2 transition"
            title={TXT.backMain}
          >
            <span aria-hidden>←</span>
            {TXT.backMain}
          </Link>

          <span className="text-xs opacity-70">{TXT.badge}</span>
        </div>

        {/* Card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_30px_90px_-60px_rgba(0,0,0,0.85)]">
          {/* subtle top accent */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent-500), white 12%), transparent)",
              opacity: 0.9,
            }}
          />

          <div className="p-7 sm:p-8">
            {/* Header */}
            <header className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] opacity-80">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--accent-400), white 12%) 0%, var(--accent-600) 70%)",
                    boxShadow:
                      "0 0 16px 2px color-mix(in oklab, var(--accent-500), transparent 55%)",
                  }}
                />
                {TXT.badge}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                <span className="text-accent-gradient">{TXT.title}</span>
              </h1>

              <p className="mt-2 text-sm opacity-70">{TXT.subtitle}</p>

              <div
                className="mx-auto mt-4 h-[3px] w-24 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--accent-500), transparent)",
                  animation: "adminGlowLine 3.2s ease-in-out infinite",
                  opacity: 0.85,
                }}
              />
            </header>

            <form action={createClubAndAdmin} className="mt-7 space-y-5">
              {/* Business details */}
              <div className="text-xs font-medium opacity-80">{TXT.sectionClub}</div>

              <label className="block text-sm">
                <span className="opacity-80">{TXT.clubName}</span>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Aegean Rush Watersports"
                  className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/25 px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
              </label>

              <label className="block text-sm">
                <span className="opacity-80">{TXT.clubSlug}</span>
                <input
                  name="slug"
                  type="text"
                  pattern="[a-z0-9-]+"
                  placeholder="aegean-rush"
                  className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/25 px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
                <small className="opacity-60">{TXT.slugHint}</small>
              </label>

              <label className="block text-sm">
                <span className="opacity-80">{TXT.clubLocation}</span>
                <input
                  name="location"
                  type="text"
                  placeholder="Hersonissos, Crete"
                  className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/25 px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
                <small className="opacity-60">{TXT.locationHint}</small>
              </label>

              <div className="h-px bg-white/10 my-1" />

              {/* Admin account */}
              <div className="text-xs font-medium opacity-80">{TXT.sectionAdmin}</div>

              <label className="block text-sm">
                <span className="opacity-80">{TXT.adminEmail}</span>
                <input
                  name="adminEmail"
                  type="email"
                  required
                  placeholder="owner@aegeanrush.com"
                  className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/25 px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
              </label>

              <label className="block text-sm">
                <span className="opacity-80">{TXT.adminPassword}</span>
                <input
                  name="adminPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-black/25 px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
                <small className="opacity-60">{TXT.pwHint}</small>
              </label>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center rounded-2xl px-5 h-11 text-sm font-medium btn-accent"
                >
                  {TXT.primaryBtn}
                </button>
                <a href="/" className="text-sm opacity-80 hover:opacity-100">
                  {TXT.cancel}
                </a>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] opacity-60">
                <span>Powered by Aegean Rush</span>
                <span className="opacity-70">You’ll choose a plan next</span>
              </div>
            </form>
          </div>
        </section>

        <style
          dangerouslySetInnerHTML={{
            __html: `
@keyframes adminGlowLine {
  0%,100% { opacity: .45; transform: scaleX(.92); }
  50% { opacity: .95; transform: scaleX(1); }
}
@keyframes signupTwinkle {
  0%,100% { opacity: .04; }
  50% { opacity: .08; }
}
@keyframes signupFloat {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(10px); }
}
          `,
          }}
        />
      </div>
    </main>
  );
}