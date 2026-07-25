"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  Menu,
  Receipt,
  Settings,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useT } from "@/components/I18nProvider";

type NavItem = {
  href: string;
  i18nKey: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        href: "/admin",
        i18nKey: "nav.dashboard",
        Icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/admin/planner",
        i18nKey: "nav.planner",
        Icon: CalendarDays,
      },
      {
        href: "/admin/bookings",
        i18nKey: "nav.bookings",
        Icon: Receipt,
      },
      {
        href: "/admin/slots",
        i18nKey: "nav.slots",
        Icon: CalendarClock,
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        href: "/admin/activities",
        i18nKey: "nav.activities",
        Icon: Activity,
      },
      {
        href: "/admin/stats",
        i18nKey: "nav.stats",
        Icon: BarChart3,
      },
      {
        href: "/admin/homepage",
        i18nKey: "nav.homepage",
        Icon: Globe2,
      },
      {
        href: "/admin/staff",
        i18nKey: "nav.staff",
        Icon: Users,
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        href: "/admin/export/bookings",
        i18nKey: "nav.exportCsv",
        Icon: Download,
      },
      {
        href: "/admin/billing",
        i18nKey: "nav.billing",
        Icon: CreditCard,
      },
      {
        href: "/admin/settings",
        i18nKey: "nav.settings",
        Icon: Settings,
      },
    ],
  },
];

export default function AdminNavClient({
  basePrefix,
  tenantName,
  tenantSlug,
  children,
}: {
  basePrefix: string;
  tenantName: string;
  tenantSlug: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkHref = (canonical: string) =>
    canonical === "/admin"
      ? basePrefix
      : canonical.replace(/^\/admin/, basePrefix);

  const isActive = (item: NavItem) => {
    const href = linkHref(item.href);
    return item.exact ? pathname === href : pathname?.startsWith(href);
  };

  const currentItem =
    NAV_GROUPS.flatMap((group) => group.items)
      .filter((item) => isActive(item))
      .sort((a, b) => b.href.length - a.href.length)[0] ??
    NAV_GROUPS[0].items[0];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/8 px-5 py-5">
        <Link
          href={basePrefix}
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent-400)] to-[var(--accent-700)] text-sm font-black text-white shadow-lg">
            AR
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50">
              Aegean Rush
            </span>
            <span className="block truncate text-sm font-semibold">
              {tenantName}
            </span>
          </span>
        </Link>
      </div>

      <nav
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
        aria-label={t("nav.aria")}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-40">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item);
                const href = linkHref(item.href);
                const label = t(item.i18nKey);

                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                      active
                        ? "bg-[color-mix(in_oklab,var(--accent-500),transparent_84%)] text-[var(--accent-400)] shadow-[inset_3px_0_0_var(--accent-500)]"
                        : "opacity-70 hover:bg-white/[0.05] hover:opacity-100",
                    ].join(" ")}
                  >
                    <item.Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-4 w-4 opacity-70" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/8 p-3">
        <Link
          href={`/${tenantSlug}`}
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm opacity-65 transition hover:bg-white/[0.05] hover:opacity-100"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
          <span>Open customer site</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-[var(--border)] bg-[color-mix(in_oklab,var(--card),black_5%)] lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[290px] border-r border-white/10 bg-[#0d0f14] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 opacity-60 hover:bg-white/10 hover:opacity-100"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),transparent_10%)] backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-[var(--border)] p-2 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-45">
                Admin workspace
              </div>
              <div className="truncate text-sm font-semibold">
                {t(currentItem.i18nKey)}
              </div>
            </div>

            <Link
              href={`${basePrefix}/planner`}
              className="hidden items-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--accent-500),transparent_60%)] bg-[color-mix(in_oklab,var(--accent-500),transparent_88%)] px-3 py-2 text-sm font-medium text-[var(--accent-400)] transition hover:bg-[color-mix(in_oklab,var(--accent-500),transparent_82%)] sm:flex"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Today board
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1640px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
