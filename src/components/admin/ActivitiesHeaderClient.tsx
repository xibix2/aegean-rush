"use client";

import { useT } from "@/components/I18nProvider";

export function ActivitiesHeaderClient() {
  const t = useT();

  return (
    <div className="text-center my-10">
      <h1 className="text-3xl md:text-4xl font-semibold">
        <span className="text-accent-gradient">
          {t("admin.activities.title")}
        </span>
      </h1>
      <p className="opacity-80 mt-2 text-sm">
        {t("admin.activities.subtitle")}
      </p>
    </div>
  );
}