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

  const smallParticles = Array.from({ length: 110 }, (_, i) => {
    const size = i % 8 === 0 ? 3 : i % 3 === 0 ? 2 : 1;
    const left = (i * 17) % 100;
    const top = (i * 23) % 100;
    const duration = 12 + (i % 10) * 1.8;
    const delay = (i % 9) * 0.7;
    const opacity = i % 6 === 0 ? 0.22 : i % 2 === 0 ? 0.14 : 0.09;

    return {
      id: i,
      size,
      left,
      top,
      duration,
      delay,
      opacity,
    };
  });

  const mediumOrbs = Array.from({ length: 34 }, (_, i) => {
    const size = 4 + (i % 5) * 2;
    const left = (i * 29) % 100;
    const top = 6 + ((i * 31) % 88);
    const duration = 18 + (i % 7) * 2.5;
    const delay = (i % 8) * 0.9;

    return {
      id: i,
      size,
      left,
      top,
      duration,
      delay,
    };
  });

  const microParticles = Array.from({ length: 90 }, (_, i) => {
    const size = i % 6 === 0 ? 3 : i % 3 === 0 ? 2 : 1;
    const left = (i * 13) % 100;
    const top = (i * 11) % 100;
    const duration = 7 + (i % 9) * 1.2;
    const delay = (i % 8) * 0.55;
    const opacity = i % 5 === 0 ? 0.24 : 0.12;

    return {
      id: i,
      size,
      left,
      top,
      duration,
      delay,
      opacity,
    };
  });

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
            {/* BACKGROUND */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {/* base */}
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(circle at 20% 8%, rgba(255,255,255,0.025), transparent 20%),
                    radial-gradient(circle at 80% 16%, rgba(255,255,255,0.02), transparent 18%),
                    linear-gradient(180deg, #050816 0%, #040815 38%, #030712 68%, #02040a 100%)
                  `,
                }}
              />

              {/* very subtle lower atmosphere */}
              <div
                className="absolute bottom-[-120px] left-1/2 h-[320px] w-[1000px] -translate-x-1/2 opacity-20 blur-[110px]"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 14%, transparent), transparent 72%)",
                }}
              />

              {/* wave panels */}
              <div className="animate-wave-pan-slow absolute inset-x-[-10%] bottom-[8%] h-[220px] opacity-[0.08]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(175deg, transparent 0px, transparent 22px, rgba(255,255,255,0.12) 23px, transparent 24px, transparent 46px)",
                    maskImage:
                      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 20%, rgba(0,0,0,1) 65%, transparent 100%)",
                  }}
                />
              </div>

              <div className="animate-wave-pan-reverse absolute inset-x-[-15%] bottom-[2%] h-[260px] opacity-[0.06]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(178deg, transparent 0px, transparent 28px, rgba(255,255,255,0.1) 29px, transparent 30px, transparent 58px)",
                    maskImage:
                      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 28%, rgba(0,0,0,1) 75%, transparent 100%)",
                  }}
                />
              </div>

              {/* drifting streaks */}
              <div className="absolute inset-0">
                <div className="animate-streak-drift absolute left-[6%] top-[18%] h-px w-[22%] rotate-[8deg] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px]" />
                <div className="animate-streak-drift-delayed absolute right-[10%] top-[28%] h-px w-[18%] -rotate-[7deg] bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[1px]" />
                <div className="animate-streak-drift absolute left-[14%] top-[52%] h-px w-[26%] rotate-[4deg] bg-gradient-to-r from-transparent via-white/25 to-transparent blur-[1px]" />
                <div className="animate-streak-drift-delayed absolute right-[14%] top-[66%] h-px w-[24%] -rotate-[5deg] bg-gradient-to-r from-transparent via-white/28 to-transparent blur-[1px]" />
                <div className="animate-streak-drift absolute left-[42%] bottom-[16%] h-px w-[18%] rotate-[2deg] bg-gradient-to-r from-transparent via-white/32 to-transparent blur-[1px]" />
              </div>

              {/* ripple rings */}
              <div className="animate-spin-ultra-slow absolute left-[-120px] top-[18%] h-[380px] w-[380px] rounded-full border border-white/[0.045]" />
              <div className="animate-spin-reverse-ultra-slow absolute left-[-70px] top-[22%] h-[280px] w-[280px] rounded-full border border-white/[0.04]" />
              <div className="animate-spin-ultra-slow absolute bottom-[10%] right-[-140px] h-[420px] w-[420px] rounded-full border border-white/[0.04]" />
              <div className="animate-spin-reverse-ultra-slow absolute bottom-[16%] right-[-80px] h-[300px] w-[300px] rounded-full border border-white/[0.035]" />

              {/* small particles */}
              {smallParticles.map((p) => (
                <span
                  key={`small-${p.id}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    opacity: p.opacity,
                    animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                    boxShadow: "0 0 6px rgba(255,255,255,0.08)",
                  }}
                />
              ))}

              {/* medium particles */}
              {mediumOrbs.map((orb) => (
                <span
                  key={`orb-${orb.id}`}
                  className="absolute rounded-full"
                  style={{
                    width: `${orb.size}px`,
                    height: `${orb.size}px`,
                    left: `${orb.left}%`,
                    top: `${orb.top}%`,
                    opacity: 0.16,
                    background: "rgba(255,255,255,0.75)",
                    animation: `floatOrb ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
                    boxShadow: "0 0 14px rgba(255,255,255,0.08)",
                    filter: "blur(0.6px)",
                  }}
                />
              ))}

              {/* fast micro particles */}
              {microParticles.map((p) => (
                <span
                  key={`micro-${p.id}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    opacity: p.opacity,
                    animation: `floatParticleFast ${p.duration}s linear ${p.delay}s infinite`,
                  }}
                />
              ))}

              {/* grain / film texture */}
              <div className="animate-grain absolute inset-0 opacity-[0.045] mix-blend-screen">
                <div
                  className="absolute inset-[-50%]"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.18) 0.6px, transparent 0.8px)",
                    backgroundSize: "18px 18px",
                  }}
                />
              </div>

              {/* grid texture */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "72px 72px",
                  maskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.7), transparent)",
                }}
              />
            </div>

            {/* HEADER */}
            <header className="sticky top-0 z-50">
              <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
              <div className="absolute inset-x-0 top-0 h-20 bg-[rgba(3,7,18,0.58)] backdrop-blur-xl" />

              <div className="relative mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href={tHref("/")} className="group flex min-w-0 items-center gap-3">
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
                          radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 45%),
                          linear-gradient(135deg, color-mix(in oklab, var(--brand-primary) 72%, #1e293b), #020617)
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
                  </div>
                </Link>

                <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
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
                  className="h-px w-full opacity-60"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                  }}
                />
              </div>
            </header>

            {/* PAGE CONTENT */}
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