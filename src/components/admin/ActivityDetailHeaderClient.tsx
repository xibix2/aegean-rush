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
    <div className="flex items-center justify-between gap-4">
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
      
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight animate-[softFadeUp_1s_ease-out]">
          <span className="text-accent-gradient">{name}</span>
        </h1>
        <p className="mt-2 text-sm opacity-70">
          {t("admin.activities.detailSubtitle")}
        </p>
      </div>

      <Link
        href={backHref}
        className="shrink-0 rounded-full u-border u-surface px-4 py-1.5 text-sm opacity-90 hover:opacity-100 transition"
      >
        ← {t("admin.activities.back")}
      </Link>
    </div>
  );
}