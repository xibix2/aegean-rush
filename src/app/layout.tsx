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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aegean Rush — Book activities in seconds",
  description: "Real-time activity availability with fast, secure checkout.",
};

function isValidTenantSlug(slug: string | null) {
  if (!slug) return false;
  if (slug === "undefined" || slug === "null") return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    plan = (tenant.subscriptionPlan as "BASIC" | "PRO" | "ENTERPRISE") ?? "BASIC";

    if (plan === "ENTERPRISE") {
      brandPrimary = tenant.primaryHex || defaultAccentPrimary;
    } else {
      brandPrimary = defaultAccentPrimary;
    }

    brandLogo = tenant.logoKey ?? null;
    brandName = tenant.name;
  }

  const effectiveBrandName = brandName ?? "Aegean Rush";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-white`}
        style={
          {
            "--brand-primary": brandPrimary,
            ...accentOverrides,
          } as React.CSSProperties
        }
      >
        <I18nProvider lang={prefs.lang as "en" | "el"}>
          <div className="relative min-h-screen overflow-x-hidden bg-[#030712] text-[--color-text]">
            {/* GLOBAL BACKGROUND */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(circle at 15% 10%, color-mix(in srgb, var(--brand-primary) 22%, transparent), transparent 28%),
                    radial-gradient(circle at 85% 12%, rgba(56, 189, 248, 0.16), transparent 24%),
                    radial-gradient(circle at 50% 100%, rgba(236, 72, 153, 0.10), transparent 30%),
                    linear-gradient(180deg, #050816 0%, #030712 45%, #02040a 100%)
                  `,
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "64px 64px",
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
                }}
              />
            </div>

            {/* TOP BAR */}
            <header className="sticky top-0 z-50">
              <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
              <div className="absolute inset-x-0 top-0 h-20 bg-[rgba(3,7,18,0.55)] backdrop-blur-xl" />

              <div className="relative mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                  href={tHref("/")}
                  className="group flex min-w-0 items-center gap-3"
                >
                  {brandLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brandLogo}
                      alt={effectiveBrandName}
                      className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-black/30 object-contain shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                    />
                  ) : (
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                      aria-hidden="true"
                      style={{
                        background: `
                          radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25), transparent 45%),
                          linear-gradient(135deg, color-mix(in oklab, var(--brand-primary) 82%, #1e293b), #020617)
                        `,
                      }}
                    >
                      <span className="text-base leading-none">🌊</span>
                    </span>
                  )}

                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold tracking-tight text-white/95 transition group-hover:text-white">
                      {effectiveBrandName}
                    </div>
                    <div className="hidden text-xs text-white/45 sm:block">
                      Premium water experiences
                    </div>
                  </div>
                </Link>

                <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
                  <Link
                    href={tHref("/")}
                    className="rounded-full px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    Activities
                  </Link>
                  <Link
                    href={tHref("/contact")}
                    className="rounded-full px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    Contact
                  </Link>
                </nav>
              </div>

              <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div
                  aria-hidden
                  className="h-px w-full opacity-70"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, color-mix(in srgb, var(--brand-primary) 58%, white), transparent)",
                  }}
                />
              </div>
            </header>

            {/* PAGE WRAPPER */}
            <main className="relative">
              <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8 lg:pb-20 lg:pt-10">
                {children}
              </div>
            </main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}