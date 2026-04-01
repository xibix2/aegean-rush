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

  const mobileParticles = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    size: i % 6 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
    left: (i * 19) % 100,
    top: (i * 23) % 100,
    duration: 10 + (i % 7) * 2,
    delay: (i % 6) * 0.8,
    opacity: i % 4 === 0 ? 0.2 : 0.1,
  }));

  const desktopParticles = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    size: i % 10 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
    left: (i * 19) % 100,
    top: (i * 23) % 100,
    duration: 10 + (i % 9) * 2,
    delay: (i % 8) * 0.8,
    opacity: i % 5 === 0 ? 0.24 : i % 2 === 0 ? 0.14 : 0.08,
  }));

  const desktopOrbs = Array.from({ length: 16 }, (_, i) => {
    const colors = [
      "rgba(56,189,248,0.7)",
      "rgba(125,211,252,0.65)",
      "rgba(244,114,182,0.62)",
      "rgba(167,139,250,0.62)",
      "rgba(251,191,36,0.45)",
    ];

    return {
      id: i,
      size: 4 + (i % 5) * 3,
      left: (i * 31) % 100,
      top: 8 + ((i * 29) % 84),
      duration: 16 + (i % 6) * 3,
      delay: (i % 7) * 0.9,
      color: colors[i % colors.length],
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
          <div className="relative min-h-screen overflow-x-hidden bg-[#050816] text-[--color-text]">
            {/* BACKGROUND */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {/* base gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(circle at 16% 12%, rgba(56,189,248,0.08), transparent 22%),
                    radial-gradient(circle at 82% 14%, rgba(244,114,182,0.08), transparent 22%),
                    radial-gradient(circle at 50% 78%, rgba(99,102,241,0.10), transparent 34%),
                    radial-gradient(circle at 22% 88%, rgba(251,191,36,0.04), transparent 20%),
                    linear-gradient(180deg, #07101f 0%, #060b18 22%, #050816 52%, #040713 78%, #03050d 100%)
                  `,
                }}
              />

              {/* mobile-safe simple color atmosphere */}
              <div className="absolute inset-x-0 top-0 h-[38vh] bg-gradient-to-b from-cyan-400/[0.04] via-fuchsia-400/[0.02] to-transparent sm:hidden" />
              <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-gradient-to-t from-violet-500/[0.05] via-cyan-400/[0.03] to-transparent sm:hidden" />

              {/* desktop richer layers */}
              <div
                className="animate-aurora-pan absolute -left-[12%] top-[8%] hidden h-[320px] w-[620px] rotate-[-10deg] rounded-full opacity-[0.12] blur-[90px] sm:block"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(56,189,248,0.45), rgba(167,139,250,0.24), rgba(244,114,182,0.35))",
                }}
              />
              <div
                className="animate-aurora-pan-reverse absolute right-[-14%] top-[18%] hidden h-[360px] w-[680px] rotate-[12deg] rounded-full opacity-[0.11] blur-[100px] sm:block"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(244,114,182,0.34), rgba(56,189,248,0.18), rgba(251,191,36,0.12))",
                }}
              />
              <div
                className="animate-aurora-pan-slow absolute bottom-[2%] left-[16%] hidden h-[260px] w-[720px] rotate-[4deg] rounded-full opacity-[0.08] blur-[110px] lg:block"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(56,189,248,0.18), rgba(99,102,241,0.22), rgba(244,114,182,0.18))",
                }}
              />

              {/* desktop wave bands */}
              <div className="animate-wave-pan-slow absolute inset-x-[-10%] bottom-[6%] hidden h-[240px] opacity-[0.1] md:block">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(176deg, transparent 0px, transparent 26px, rgba(255,255,255,0.10) 27px, transparent 28px, transparent 56px)",
                    maskImage:
                      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 20%, rgba(0,0,0,1) 68%, transparent 100%)",
                  }}
                />
              </div>

              <div className="animate-wave-pan-reverse absolute inset-x-[-15%] bottom-[0%] hidden h-[280px] opacity-[0.07] lg:block">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(178deg, transparent 0px, transparent 30px, rgba(56,189,248,0.12) 31px, transparent 32px, transparent 62px)",
                    maskImage:
                      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.72) 24%, rgba(0,0,0,1) 78%, transparent 100%)",
                  }}
                />
              </div>

              {/* streaks */}
              <div className="absolute inset-0 hidden sm:block">
                <div className="animate-streak-drift absolute left-[4%] top-[16%] h-px w-[24%] rotate-[8deg] bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent blur-[1px]" />
                <div className="animate-streak-drift-delayed absolute right-[8%] top-[24%] h-px w-[20%] -rotate-[8deg] bg-gradient-to-r from-transparent via-pink-300/40 to-transparent blur-[1px]" />
                <div className="animate-streak-drift absolute left-[12%] top-[50%] h-px w-[28%] rotate-[5deg] bg-gradient-to-r from-transparent via-violet-300/35 to-transparent blur-[1px]" />
                <div className="animate-streak-drift-delayed absolute right-[14%] top-[62%] h-px w-[22%] -rotate-[5deg] bg-gradient-to-r from-transparent via-sky-200/40 to-transparent blur-[1px]" />
              </div>

              {/* desktop ripple rings */}
              <div className="animate-spin-ultra-slow absolute left-[-120px] top-[18%] hidden h-[420px] w-[420px] rounded-full border border-cyan-300/[0.08] md:block" />
              <div className="animate-spin-reverse-ultra-slow absolute left-[-70px] top-[23%] hidden h-[300px] w-[300px] rounded-full border border-violet-300/[0.07] lg:block" />
              <div className="animate-spin-ultra-slow absolute bottom-[8%] right-[-140px] hidden h-[440px] w-[440px] rounded-full border border-pink-300/[0.08] md:block" />
              <div className="animate-spin-reverse-ultra-slow absolute bottom-[16%] right-[-80px] hidden h-[320px] w-[320px] rounded-full border border-sky-200/[0.07] lg:block" />

              {/* horizon */}
              <div className="absolute inset-x-0 bottom-[18%] h-px opacity-[0.16] bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent sm:hidden" />
              <div className="absolute inset-x-0 bottom-[18%] hidden h-px opacity-[0.22] bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent sm:block" />
              <div className="absolute inset-x-0 bottom-[18%] hidden h-24 opacity-[0.08] blur-2xl bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent md:block" />

              {/* mobile particles */}
              {mobileParticles.map((p) => (
                <span
                  key={`mobile-particle-${p.id}`}
                  className="absolute rounded-full bg-white sm:hidden"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    opacity: p.opacity,
                    animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                  }}
                />
              ))}

              {/* desktop particles */}
              {desktopParticles.map((p) => (
                <span
                  key={`desktop-particle-${p.id}`}
                  className="absolute hidden rounded-full bg-white sm:block"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    opacity: p.opacity,
                    animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                    boxShadow:
                      p.size > 2
                        ? "0 0 12px rgba(255,255,255,0.1)"
                        : "0 0 6px rgba(255,255,255,0.06)",
                  }}
                />
              ))}

              {/* desktop colored orbs */}
              {desktopOrbs.map((orb) => (
                <span
                  key={`orb-${orb.id}`}
                  className="absolute hidden rounded-full md:block"
                  style={{
                    width: `${orb.size}px`,
                    height: `${orb.size}px`,
                    left: `${orb.left}%`,
                    top: `${orb.top}%`,
                    opacity: 0.16,
                    background: orb.color,
                    animation: `floatOrb ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
                    boxShadow: `0 0 14px ${orb.color}`,
                    filter: "blur(0.35px)",
                  }}
                />
              ))}

              {/* lighter beams only on desktop */}
              <div className="animate-beam-shift absolute left-[-8%] top-[20%] hidden h-[120px] w-[48%] rotate-[8deg] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent blur-2xl md:block" />
              <div className="animate-beam-shift-reverse absolute right-[-12%] bottom-[18%] hidden h-[140px] w-[52%] -rotate-[6deg] bg-gradient-to-r from-transparent via-cyan-200/[0.04] to-transparent blur-2xl lg:block" />

              {/* grain desktop only */}
              <div className="animate-grain absolute inset-0 hidden opacity-[0.03] mix-blend-screen md:block">
                <div
                  className="absolute inset-[-50%]"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.12) 0.6px, transparent 0.8px)",
                    backgroundSize: "18px 18px",
                  }}
                />
              </div>

              {/* grid */}
              <div
                className="absolute inset-0 opacity-[0.025] sm:opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "72px 72px",
                  maskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.22), rgba(0,0,0,0.72), transparent)",
                }}
              />
            </div>

            {/* HEADER */}
            <header className="sticky top-0 z-50">
              <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
              <div className="absolute inset-x-0 top-0 h-20 bg-[rgba(5,8,22,0.55)] backdrop-blur-xl" />
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-cyan-400/[0.025] via-transparent to-pink-400/[0.025]" />

              <div className="relative mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href={tHref("/")} className="group flex min-w-0 items-center gap-3">
                  {brandLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brandLogo}
                      alt={effectiveBrandName}
                      className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-black/20 object-contain shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                    />
                  ) : (
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                      aria-hidden="true"
                      style={{
                        background: `
                          radial-gradient(circle at 30% 25%, rgba(255,255,255,0.15), transparent 45%),
                          linear-gradient(135deg, rgba(56,189,248,0.70), rgba(99,102,241,0.60), rgba(244,114,182,0.62))
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

                <nav className="rounded-full border border-white/10 bg-white/6 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
                  <Link
                    href={tHref("/contact")}
                    className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Contact
                  </Link>
                </nav>
              </div>

              <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
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