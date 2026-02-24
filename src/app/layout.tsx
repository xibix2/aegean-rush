// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { readUiPrefsFromCookies } from "@/lib/ui-prefs-server";
import { I18nProvider } from "@/components/I18nProvider";
import { getTenantSoft } from "@/lib/tenant";
import type React from "react";

export const dynamic = "force-dynamic";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tennis Booking — Pick a court, book in seconds",
  description: "Real-time tennis court availability with fast, secure checkout.",
};

function isValidTenantSlug(slug: string | null) {
  if (!slug) return false;
  if (slug === "undefined" || slug === "null") return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const prefs = await readUiPrefsFromCookies();
  const themeAttr = prefs.theme === "auto" ? "auto" : prefs.theme;

  const tenant = await getTenantSoft();
  const tenantSlugRaw = tenant?.slug ?? null;

  const hasTenant = isValidTenantSlug(tenantSlugRaw);
  const tenantSlug = hasTenant ? tenantSlugRaw : null;

  const tHref = (path: string) => {
    const clean = path.startsWith("/") ? path : `/${path}`;
    if (/^https?:\/\//i.test(path)) return path;
    return hasTenant && tenantSlug ? `/${tenantSlug}${clean}` : clean;
  };

  const defaultAccentPrimary =
    prefs.accent === "pink"
      ? "#ec4899"
      : prefs.accent === "blue"
      ? "#3b82f6"
      : "#22c55e";

  let brandPrimary = defaultAccentPrimary;
  let brandLogo: string | null = null;
  let brandName: string | null = null;
  let plan: "BASIC" | "PRO" | "ENTERPRISE" | null = null;

  if (tenant && hasTenant) {
    plan = (tenant.subscriptionPlan as any) ?? "BASIC";

    if (plan === "ENTERPRISE") {
      brandPrimary = tenant.primaryHex || defaultAccentPrimary;
    } else {
      brandPrimary = defaultAccentPrimary;
    }

    brandLogo = tenant.logoKey ?? null;
    brandName = tenant.name;
  }

  const effectiveBrandName = brandName ?? "Tennis Courts";

  const accentOverrides =
    plan === "ENTERPRISE"
      ? ({
          "--accent-300": brandPrimary,
          "--accent-400": brandPrimary,
          "--accent-500": brandPrimary,
          "--accent-600": brandPrimary,
          "--accent-700": brandPrimary,
        } as React.CSSProperties)
      : ({} as React.CSSProperties);

  return (
    <html
      lang={prefs.lang}
      data-theme={themeAttr}
      data-accent={prefs.accent}
      data-compact={prefs.compact ? "1" : "0"}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={
          {
            "--brand-primary": brandPrimary,
            ...accentOverrides,
          } as React.CSSProperties
        }
      >
        <I18nProvider lang={prefs.lang as "en" | "el"}>
          {/* ---- NAVBAR ---- */}
          <header className="sticky top-0 z-50 backdrop-blur-md bg-[--color-card]/65 border-b border-[--color-border]">
            <div className="relative">
              <div
                aria-hidden
                className="absolute left-1/2 top-0 h-[2px] w-40 -translate-x-1/2 rounded-full anim-accent"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--brand-primary), var(--brand-primary), transparent)",
                  animation: "accent-slide 3.4s ease-in-out infinite",
                }}
              />
            </div>

            <div className="container-page h-16 flex items-center justify-between gap-3">
              {/* Brand (allow shrink) */}
              <Link
                href={tHref("/")}
                className="group flex min-w-0 items-center gap-2 font-semibold"
              >
                {brandLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandLogo}
                    alt={effectiveBrandName}
                    className="inline-block h-7 w-7 rounded-xl object-contain bg-black/40 shrink-0"
                  />
                ) : (
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-black/40 ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)] shrink-0"
                    aria-hidden="true"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%), " +
                        "radial-gradient(circle at 70% 80%, rgba(255,255,255,0.18), transparent 60%), " +
                        "linear-gradient(135deg, color-mix(in oklab, var(--brand-primary) 80%, #1e293b), #020617)",
                    }}
                  >
                    <span className="text-base leading-none">🎾</span>
                  </span>
                )}

                {/* ✅ truncate so mobile nav doesn’t get pushed out */}
                <span className="min-w-0 truncate tracking-tight group-hover:opacity-100 opacity-90 transition">
                  {effectiveBrandName}
                </span>
              </Link>

              {/* ✅ Always show nav; compact on mobile; never shrink away */}
              <nav className="shrink-0 flex items-center gap-3 sm:gap-6 text-xs sm:text-sm opacity-85">
                <Link href={tHref("/")} className="hover:opacity-100 transition whitespace-nowrap">
                  Courts
                </Link>
                <Link
                  href={tHref("/contact")}
                  className="hover:opacity-100 transition whitespace-nowrap"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </header>

          {/* ---- PAGE CONTENT ---- */}
          <main className="container-page py-4 ">
            {children}
          </main>
        </I18nProvider>
      </body>
    </html>
  );
}