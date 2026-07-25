"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/I18nProvider";

export function NewActivityHeaderClient() {
  const t = useT();
  const pathname = usePathname();

  // safer tenant slug extraction
  const parts = pathname.split("/").filter(Boolean);
  const slug = parts.length > 1 && parts[1] === "admin" ? parts[0] : null;

  const backHref = slug ? `/${slug}/admin/activities` : "/admin/activities";

  return (
    <header className="admin-page-header">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes softFadeUp {
  0% { opacity: 0; transform: translateY(8px); filter: blur(4px); }
  60% { opacity: 1; transform: translateY(-2px); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0); }
}
`.trim(),
        }}
      />

      <div className="relative z-10">
        <div className="admin-page-kicker">Catalogue setup</div>
        <h1 className="admin-page-title animate-[softFadeUp_1s_ease-out]">
          {t("admin.activities.new.title")}
        </h1>
        <p className="admin-page-subtitle">
          Configure availability, capacity and pricing in one place.
        </p>
      </div>

      <Link
        href={backHref}
        className="relative z-10 rounded-xl u-border u-surface px-4 py-2 text-sm opacity-90 transition hover:opacity-100"
      >
        ← {t("admin.activities.back")}
      </Link>
    </header>
  );
}
