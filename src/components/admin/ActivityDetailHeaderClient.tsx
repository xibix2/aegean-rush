"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/I18nProvider";

export function ActivityDetailHeaderClient({ name }: { name: string }) {
  const t = useT();
  const pathname = usePathname();

  // extract tenant slug from current path
  const slug = pathname.split("/")[1];
  const backHref = slug ? `/${slug}/admin/activities` : "/admin/activities";

  return (
    <div className="flex items-center justify-between">
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
      <h1 className="text-3xl font-semibold tracking-tight animate-[softFadeUp_1s_ease-out]">
        <span className="text-accent-gradient">{name}</span>
      </h1>
      <Link
        href={backHref}
        className="rounded-full u-border u-surface px-4 py-1.5 text-sm opacity-90 hover:opacity-100 transition"
      >
        ← {t("admin.activities.back")}
      </Link>
    </div>
  );
}