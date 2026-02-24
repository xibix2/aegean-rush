// src/components/admin/SlotGeneratorClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useT } from "@/components/I18nProvider";

type Activity = {
  id: string;
  name: string;
  durationMin: number | null;
  basePrice: number | null; // cents
  maxParty: number | null;  // used as default capacity
};

type Props = {
  activities: Activity[];
  created?: number;
  defaults: { from: string; to: string; time: string };
  action: (formData: FormData) => Promise<void>;
};

export default function SlotGeneratorClient({
  activities,
  created,
  defaults,
  action,
}: Props) {
  const t = useT();

  // ------- State for activity + derived fields -------
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");

  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === selectedActivityId) ?? null,
    [activities, selectedActivityId],
  );

  // Initialize from selected activity (or sensible defaults)
  const [durationMin, setDurationMin] = useState<number>(
    selectedActivity?.durationMin ?? 60,
  );
  const [capacity, setCapacity] = useState<number>(
    selectedActivity?.maxParty ?? 4,
  );
  const [priceEuro, setPriceEuro] = useState<number>(
    selectedActivity?.basePrice != null ? selectedActivity.basePrice / 100 : 0,
  );

  const handleActivityChange = useCallback(
    (value: string) => {
      setSelectedActivityId(value);
      const act = activities.find((a) => a.id === value) ?? null;
      if (!act) return;

      // When activity changes, sync all 3 fields from its defaults
      setDurationMin(act.durationMin ?? 60);
      setCapacity(act.maxParty ?? 4);
      setPriceEuro(act.basePrice != null ? act.basePrice / 100 : 0);
    },
    [activities],
  );

  const handleDurationChange = (val: string) => {
    const n = Number(val);
    setDurationMin(Number.isFinite(n) && n > 0 ? n : 0);
  };

  const handleCapacityChange = (val: string) => {
    const n = Number(val);
    setCapacity(Number.isFinite(n) && n > 0 ? n : 1);
  };

  const handlePriceChange = (val: string) => {
    const n = Number(val.replace(",", "."));
    setPriceEuro(Number.isFinite(n) && n >= 0 ? n : 0);
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.day-dot{transition:box-shadow .2s ease,background-color .2s ease,transform .2s ease;}
.day-dot:where(.checked){box-shadow:0 0 12px 2px rgb(var(--accent-glow)/0.55);transform:translateZ(0);}
          `.trim(),
        }}
      />

      <h1 className="text-3xl md:text-[32px] font-semibold tracking-tight">
        <span className="text-accent-gradient">{t("slots.generator.title")}</span>
      </h1>

      {/* Status */}
      {typeof created === "number" && created > 0 && (
        <div role="status" className="rounded-xl u-border u-surface px-4 py-2 text-sm glow-soft">
          {t("slots.generator.created")} <strong>{created}</strong>{" "}
          {t("slots.generator.slots")}.
        </div>
      )}
      {created === 0 && (
        <div role="status" className="rounded-xl u-border u-surface px-4 py-2 text-sm glow-soft">
          {t("slots.generator.none")}
        </div>
      )}

      {/* Form */}
      <form
        action={action}
        lang="en-GB"
        className="relative rounded-2xl u-border bg-[--color-card] p-5 md:p-6 glow-soft"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--accent-600), transparent 60%), color-mix(in oklab, var(--accent-500), transparent 55%), color-mix(in oklab, var(--accent-600), transparent 60%))",
            padding: 1,
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <div className="grid md:grid-cols-2 gap-3 relative z-10">
          {/* Activity */}
          <label className="text-sm">
            {t("slots.generator.activity")}
            <select
              name="activityId"
              required
              value={selectedActivityId}
              onChange={(e) => handleActivityChange(e.target.value)}
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
            >
              <option value="" disabled>
                {t("slots.generator.select")}
              </option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          {/* Times */}
          <label className="text-sm">
            {t("slots.generator.time")}
            <input
              name="times"
              type="time"
              step={60}
              defaultValue={defaults.time}
              lang="en-GB"
              inputMode="none"
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
            />
          </label>

          {/* From / To */}
          <label className="text-sm">
            {t("slots.generator.from")}
            <input
              type="date"
              name="from"
              lang="en-CA"
              defaultValue={defaults.from}
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
              required
            />
          </label>

          <label className="text-sm">
            {t("slots.generator.to")}
            <input
              type="date"
              name="to"
              lang="en-CA"
              defaultValue={defaults.to}
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
              required
            />
          </label>

          {/* Duration (controlled) */}
          <label className="text-sm">
            {t("slots.generator.duration")}
            <input
              type="number"
              name="durationMin"
              min={5}
              step={5}
              value={durationMin}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
            />
          </label>

          {/* Capacity (controlled, now synced with activity.maxParty) */}
          <label className="text-sm">
            {t("slots.generator.capacity")}
            <input
              type="number"
              name="capacity"
              min={1}
              value={capacity}
              onChange={(e) => handleCapacityChange(e.target.value)}
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
            />
          </label>

          {/* Price (controlled) */}
          <label className="text-sm">
            {t("slots.generator.price")}
            <input
              type="number"
              name="priceEuro"
              step="0.01"
              min={0}
              value={priceEuro}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
            />
          </label>
        </div>

        {/* Days of week */}
        <fieldset className="grid gap-2 mt-4 relative z-10">
          <div className="text-sm font-medium">{t("slots.generator.days")}</div>
          <div className="flex flex-wrap gap-2 text-sm">
            {([
              ["0", t("slots.generator.sun")],
              ["1", t("slots.generator.mon")],
              ["2", t("slots.generator.tue")],
              ["3", t("slots.generator.wed")],
              ["4", t("slots.generator.thu")],
              ["5", t("slots.generator.fri")],
              ["6", t("slots.generator.sat")],
            ] as const).map(([v, l]) => {
              const def = ["1", "2", "3", "4", "5"].includes(v);
              return (
                <label
                  key={v}
                  className="relative inline-flex items-center gap-2 rounded-full px-3 py-2 u-border u-surface select-none"
                >
                  <input
                    type="checkbox"
                    name="days"
                    value={v}
                    defaultChecked={def}
                    className="sr-only peer"
                  />
                  <span
                    className="
                      day-dot inline-block size-3 rounded-full
                      bg-[color-mix(in_oklab,var(--accent-500),transparent_40%)]
                      peer-checked:bg-[var(--accent-500)]
                    "
                  />
                  <span className="opacity-85">{l}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3 relative z-10">
          <button className="btn-accent inline-flex h-11 items-center justify-center px-6 text-sm font-medium">
            {t("slots.generator.button")}
          </button>

          <a
            href="/admin/slots"
            className="inline-flex h-11 items-center justify-center rounded-[12px] px-4 text-sm u-border u-surface hover:opacity-90 transition"
          >
            {t("slots.generator.back")}
          </a>
        </div>
      </form>
    </main>
  );
}