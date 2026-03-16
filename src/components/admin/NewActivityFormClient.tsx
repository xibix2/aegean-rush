"use client";

import CoverPicker from "@/components/ui/CoverPicker";
import { useT } from "@/components/I18nProvider";

export function NewActivityFormClient({
  createAction,
}: {
  createAction: (formData: FormData) => Promise<void>;
}) {
  const t = useT();

  return (
    <form
      action={createAction}
      className="relative overflow-hidden rounded-2xl u-border u-surface backdrop-blur-md p-6 sm:p-8 space-y-6 glow-soft"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">
              {t("admin.activities.form.name")}
            </label>
            <input
              name="name"
              required
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">
              {t("admin.activities.form.duration")}
            </label>
            <input
              name="durationMin"
              type="number"
              min={10}
              step={5}
              defaultValue={60}
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">
              {t("admin.activities.form.price")}
            </label>
            <input
              name="basePriceEuro"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="e.g., 15.00"
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">
              {t("admin.activities.form.capacity")}
            </label>
            <input
              name="maxParty"
              type="number"
              min={1}
              step={1}
              defaultValue={4}
              placeholder="e.g., 4"
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">
              {t("admin.activities.form.location")}
            </label>
            <input
              name="locationId"
              placeholder="Location identifier"
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm mt-1">
            <input type="checkbox" name="active" defaultChecked className="size-4" />
            {t("admin.activities.form.active")}
          </label>
        </div>

        {/* RIGHT SIDE: Cover Image */}
        <div className="flex flex-col gap-3">
          <label className="text-sm opacity-80">
            {t("admin.activities.form.cover")}
          </label>
          <CoverPicker name="coverFile" size={280} />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm opacity-80">
          {t("admin.activities.form.description")}
        </label>
        <textarea
          name="description"
          placeholder={t("admin.activities.form.descriptionPlaceholder")}
          className="min-h-[110px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
        />
      </div>

      {/* Create Button */}
      <button className="mt-2 inline-flex items-center justify-center h-10 rounded-xl px-6 text-sm font-medium btn-accent">
        {t("admin.activities.new.create")}
      </button>
    </form>
  );
}