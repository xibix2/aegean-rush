"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/I18nProvider";

export function ActivityDetailHeaderClient({ name }: { name: string }) {
  const t = useT();
  const pathname = usePathname();

  const slug = pathname.split("/")[1];
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
      
      <div className="relative z-10 min-w-0">
        <div className="admin-page-kicker">Activity setup</div>
        <h1 className="admin-page-title animate-[softFadeUp_1s_ease-out]">
          {name}
        </h1>
        <p className="admin-page-subtitle">
          {t("admin.activities.detailSubtitle")}
        </p>
      </div>

      <Link
        href={backHref}
        className="relative z-10 shrink-0 rounded-xl u-border u-surface px-4 py-2 text-sm opacity-90 transition hover:opacity-100"
      >
        ← {t("admin.activities.back")}
      </Link>
    </header>
  );
}
