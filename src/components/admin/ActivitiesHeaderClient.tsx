"use client";

import { useT } from "@/components/I18nProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function ActivitiesHeaderClient() {
  const t = useT();
  const pathname = usePathname();

  return (
    <header className="admin-page-header">
      <div>
        <div className="admin-page-kicker">Business catalogue</div>
        <h1 className="admin-page-title">{t("admin.activities.title")}</h1>
        <p className="admin-page-subtitle">{t("admin.activities.subtitle")}</p>
      </div>
      <Link
        href={`${pathname}/new`}
        className="btn-accent relative z-10 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
      >
        <Plus className="h-4 w-4" />
        Add activity
      </Link>
    </header>
  );
}
