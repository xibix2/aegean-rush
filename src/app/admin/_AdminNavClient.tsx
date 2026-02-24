"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCog,
  CalendarClock,
  Receipt,
  BarChart3,
  Download,
  Settings,
} from "lucide-react";
import { useT } from "@/components/I18nProvider";

type NavItem = {
  href: string; // canonical under /admin
  i18nKey: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin",                 i18nKey: "nav.dashboard",  Icon: LayoutDashboard },
  { href: "/admin/activities",      i18nKey: "nav.activities", Icon: CalendarCog },
  { href: "/admin/slots",           i18nKey: "nav.slots",      Icon: CalendarClock },
  { href: "/admin/bookings",        i18nKey: "nav.bookings",   Icon: Receipt },
  { href: "/admin/stats",           i18nKey: "nav.stats",      Icon: BarChart3 },
  { href: "/admin/export/bookings", i18nKey: "nav.exportCsv",  Icon: Download },
  { href: "/admin/settings",        i18nKey: "nav.settings",   Icon: Settings },
];

export default function AdminNavClient({
  basePrefix,
  children,
}: {
  basePrefix: string; // "/admin" or "/<slug>/admin"
  children: ReactNode;
}) {
  const pathname = usePathname();
  const t = useT();

  const linkHref = (canonical: string) =>
    canonical === "/admin" ? basePrefix : canonical.replace(/^\/admin/, basePrefix);

  const isActive = (canonical: string) => {
    const h = linkHref(canonical);
    if (h === basePrefix) return pathname === h;
    return pathname?.startsWith(h);
  };

  return (
    <div className="min-h-[100dvh]">
      <style>{`
        @keyframes adminGlowLine {
          0%,100% { opacity:.55; transform:scaleX(.9); }
          50% { opacity:.95; transform:scaleX(1); }
        }
        .admin-nav::-webkit-scrollbar { display:none; }
        .admin-pill {
          transition: background-color .18s ease, transform .18s ease, box-shadow .25s ease, border-color .25s ease;
          will-change: transform, box-shadow;
        }
        .admin-pill:hover { transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) {
          .admin-pill { transition: none !important; }
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-[--color-border]/70 bg-[--color-card]/70 backdrop-blur-sm">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-2.5 flex justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -z-10 h-14 w-[62%] rounded-full blur-3xl opacity-25"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 50%, rgba(255,120,200,.26), rgba(176,136,248,.22) 45%, transparent 70%)",
            }}
          />
          <nav className="admin-nav flex flex-wrap justify-center gap-2 overflow-x-auto max-w-4xl" aria-label={t("nav.aria")}>
            {NAV_ITEMS.map(({ href, i18nKey, Icon }) => {
              const active = isActive(href);
              const label = t(i18nKey);
              const finalHref = linkHref(href);
              return (
                <Link
                  key={href}
                  href={finalHref}
                  title={label}
                  className={[
                    "admin-pill group relative inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm",
                    "border bg-black/25",
                    active
                      ? "border-[var(--accent-400)]/60 ring-1 ring-[var(--accent-400)]/45 shadow-[0_10px_30px_-16px_rgb(var(--accent-glow)/0.55)]"
                      : "border-[--color-border]/70 hover:bg-black/35 hover:border-[var(--accent-300)]/30",
                  ].join(" ")}
                  style={{
                    boxShadow: active
                      ? "inset 0 0 0 1px rgba(255,255,255,.06), 0 1px 0 rgba(255,255,255,.06)"
                      : "inset 0 0 0 1px rgba(255,255,255,.04)",
                  }}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? "opacity-100" : "opacity-90"}`} />
                  <span className="whitespace-nowrap" suppressHydrationWarning>
                    {label}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 -bottom-[3px] h-[2px] w-16 -translate-x-1/2 rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(147,51,234,0) 0%, var(--accent-600) 50%, rgba(255,99,189,0) 100%)",
                        animation: "adminGlowLine 3.2s ease-in-out infinite",
                        filter: "drop-shadow(0 0 6px rgb(var(--accent-glow)/0.35))",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}