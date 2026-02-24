"use client";

import CoverPicker from "@/components/ui/CoverPicker";
import { useT } from "@/components/I18nProvider";
import * as React from "react";

type ActivityShape = {
  id: string;
  name: string;
  durationMin: number;
  basePriceEuro: number;
  maxParty: number;
  description: string;
  locationId: string;
  active: boolean;
};

export function ActivityFormClient({
  activity,
  updateAction,
  deleteAction,
}: {
  activity: ActivityShape;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  const t = useT();

  return (
    <form
      action={updateAction}
      className="relative overflow-hidden rounded-2xl u-border u-surface backdrop-blur-md p-6 sm:p-8 space-y-6 glow-soft"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* LEFT */}
        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">{t("admin.activities.form.name")}</label>
            <input
              name="name"
              defaultValue={activity.name}
              required
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">{t("admin.activities.form.duration")}</label>
            <input
              name="durationMin"
              type="number"
              min={10}
              step={5}
              defaultValue={activity.durationMin}
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">{t("admin.activities.form.price")}</label>
            <input
              name="basePriceEuro"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              defaultValue={activity.basePriceEuro.toFixed(2)}
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">{t("admin.activities.form.capacity")}</label>
            <input
              name="maxParty"
              type="number"
              min={1}
              step={1}
              defaultValue={activity.maxParty}
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">{t("admin.activities.form.location")}</label>
            <input
              name="locationId"
              defaultValue={activity.locationId}
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm mt-1">
            <input type="checkbox" name="active" defaultChecked={activity.active} className="size-4" />
            {t("admin.activities.form.active")}
          </label>
        </div>

        {/* RIGHT: square cover picker only */}
        <div className="flex flex-col gap-3">
          <label className="text-sm opacity-80">{t("admin.activities.form.cover")}</label>
          <CoverPicker name="coverFile" size={280} />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm opacity-80">{t("admin.activities.form.description")}</label>
        <textarea
          name="description"
          defaultValue={activity.description}
          placeholder={t("admin.activities.form.descriptionPlaceholder")}
          className="min-h[110px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button className="h-10 inline-flex items-center justify-center rounded-xl px-6 text-sm font-medium btn-accent">
          {t("admin.activities.form.save")}
        </button>

        <button
          formAction={deleteAction}
          className="inline-flex items-center justify-center rounded-xl px-6 py-2 text-sm font-medium
                     border border-red-400/30 bg-red-500/10 text-red-200
                     shadow-[0_0_18px_-10px_rgba(244,63,94,0.55)]
                     hover:bg-red-500/15 hover:shadow-[0_0_26px_-10px_rgba(244,63,94,0.65)]
                     transition"
        >
          {t("admin.activities.form.delete")}
        </button>
      </div>
    </form>
  );
}