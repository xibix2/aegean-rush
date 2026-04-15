"use client";

import CoverPicker from "@/components/ui/CoverPicker";
import { useT } from "@/components/I18nProvider";
import * as React from "react";

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type DurationOptionShape = {
  id?: string;
  label: string;
  durationMin: number;
  priceEuro: number;
  priceCents?: number;
  isActive?: boolean;
  sortOrder?: number;
};

type ActivityShape = {
  id: string;
  name: string;
  mode: ActivityMode;

  durationMin: number;
  basePriceEuro: number;
  minParty: number;
  maxParty: number;

  description: string;
  locationId: string;
  active: boolean;
  coverImageUrl?: string | null;

  meetingPoint?: string;
  includedText?: string;
  bringText?: string;
  cancellationText?: string;
  ageInfo?: string;
  skillLevel?: string;
  safetyInfo?: string;
  pricingNotes?: string;

  guestsPerUnit?: number;
  maxUnitsPerBooking?: number;
  slotIntervalMin?: number;

  durationOptions?: DurationOptionShape[];
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

  const [mode, setMode] = React.useState<ActivityMode>(activity.mode);
  const [durationOptions, setDurationOptions] = React.useState<
    DurationOptionShape[]
  >(
    activity.durationOptions?.length
      ? activity.durationOptions
      : activity.mode === "FIXED_SEAT_EVENT"
      ? []
      : [
          {
            label: "Standard",
            durationMin: activity.durationMin || 60,
            priceEuro: activity.basePriceEuro || 0,
            isActive: true,
            sortOrder: 0,
          },
        ]
  );
  const [formKey, setFormKey] = React.useState(activity.id);

  React.useEffect(() => {
    setFormKey(activity.id);
    setMode(activity.mode);
    setDurationOptions(
      activity.durationOptions?.length
        ? activity.durationOptions
        : activity.mode === "FIXED_SEAT_EVENT"
        ? []
        : [
            {
              label: "Standard",
              durationMin: activity.durationMin || 60,
              priceEuro: activity.basePriceEuro || 0,
              isActive: true,
              sortOrder: 0,
            },
          ]
    );
  }, [activity]);

  const addDurationOption = () => {
    setDurationOptions((prev) => [
      ...prev,
      {
        label: "",
        durationMin: 60,
        priceEuro: 0,
        isActive: true,
        sortOrder: prev.length,
      },
    ]);
  };

  const updateDurationOption = (
    index: number,
    patch: Partial<DurationOptionShape>
  ) => {
    setDurationOptions((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              ...patch,
            }
          : item
      )
    );
  };

  const removeDurationOption = (index: number) => {
    setDurationOptions((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({
          ...item,
          sortOrder: i,
        }))
    );
  };

  const durationOptionsJson = JSON.stringify(
    durationOptions.map((opt, index) => ({
      id: opt.id,
      label: opt.label?.trim() || null,
      durationMin: Number(opt.durationMin) || 0,
      priceEuro: Number(opt.priceEuro) || 0,
      isActive: opt.isActive ?? true,
      sortOrder: typeof opt.sortOrder === "number" ? opt.sortOrder : index,
    }))
  );

  const isFixed = mode === "FIXED_SEAT_EVENT";
  const isRental = mode === "DYNAMIC_RENTAL";
  const isHybrid = mode === "HYBRID_UNIT_BOOKING";

  return (
    <form
      key={formKey}
      action={updateAction}
      encType="multipart/form-data"
      className="relative overflow-hidden rounded-2xl u-border u-surface backdrop-blur-md p-6 sm:p-8 space-y-6 glow-soft"
    >
      <input
        type="hidden"
        name="durationOptionsJson"
        value={durationOptionsJson}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">Activity type</label>
            <select
              name="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as ActivityMode)}
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            >
              <option value="FIXED_SEAT_EVENT">Fixed seat event</option>
              <option value="DYNAMIC_RENTAL">Dynamic rental</option>
              <option value="HYBRID_UNIT_BOOKING">Hybrid unit booking</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">
              {t("admin.activities.form.name")}
            </label>
            <input
              name="name"
              defaultValue={activity.name}
              required
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Minimum party</label>
              <input
                name="minParty"
                type="number"
                min={1}
                step={1}
                defaultValue={activity.minParty}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">
                {isFixed
                  ? t("admin.activities.form.capacity")
                  : "Maximum party"}
              </label>
              <input
                name="maxParty"
                type="number"
                min={1}
                step={1}
                defaultValue={activity.maxParty}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">
                {t("admin.activities.form.duration")}
              </label>
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
              <label className="text-sm opacity-80">
                {t("admin.activities.form.price")}
              </label>
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">
              {t("admin.activities.form.location")}
            </label>
            <input
              name="locationId"
              defaultValue={activity.locationId}
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm mt-1">
            <input
              type="checkbox"
              name="active"
              defaultChecked={activity.active}
              className="size-4"
            />
            {t("admin.activities.form.active")}
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm opacity-80">
            {t("admin.activities.form.cover")}
          </label>
          <CoverPicker name="coverFile" size={280} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm opacity-80">
          {t("admin.activities.form.description")}
        </label>
        <textarea
          name="description"
          defaultValue={activity.description}
          placeholder={t("admin.activities.form.descriptionPlaceholder")}
          className="min-h-[110px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
        />
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border border-white/10 bg-black/15 p-4">
          <div className="text-sm font-medium mb-4">Booking configuration</div>

          {isFixed && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm opacity-80">
                  Slot interval (minutes)
                </label>
                <input
                  name="slotIntervalMin"
                  type="number"
                  min={5}
                  step={5}
                  defaultValue={activity.slotIntervalMin ?? 30}
                  className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
              </div>
            </div>
          )}

          {(isRental || isHybrid) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm opacity-80">
                  Max units per booking
                </label>
                <input
                  name="maxUnitsPerBooking"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={activity.maxUnitsPerBooking ?? 1}
                  className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm opacity-80">
                  Window interval hint (minutes)
                </label>
                <input
                  name="slotIntervalMin"
                  type="number"
                  min={5}
                  step={5}
                  defaultValue={activity.slotIntervalMin ?? 30}
                  className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
              </div>

              {isHybrid && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm opacity-80">Guests per unit</label>
                  <input
                    name="guestsPerUnit"
                    type="number"
                    min={1}
                    step={1}
                    defaultValue={activity.guestsPerUnit ?? 1}
                    className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {(isRental || isHybrid) && (
          <div className="rounded-xl border border-white/10 bg-black/15 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Duration options</div>
              <button
                type="button"
                onClick={addDurationOption}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 transition"
              >
                Add option
              </button>
            </div>

            {durationOptions.length === 0 ? (
              <div className="text-sm opacity-65">
                No duration options yet. Add at least one option for rentals or
                hybrid activities.
              </div>
            ) : (
              <div className="grid gap-3">
                {durationOptions.map((opt, index) => (
                  <div
                    key={opt.id ?? index}
                    className="grid gap-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-[1.2fr_.8fr_.8fr_auto]"
                  >
                    <input
                      value={opt.label}
                      onChange={(e) =>
                        updateDurationOption(index, { label: e.target.value })
                      }
                      placeholder="Label"
                      className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                    />

                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={opt.durationMin}
                      onChange={(e) =>
                        updateDurationOption(index, {
                          durationMin: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="Minutes"
                      className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                    />

                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={opt.priceEuro}
                      onChange={(e) =>
                        updateDurationOption(index, {
                          priceEuro: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="Price €"
                      className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                    />

                    <button
                      type="button"
                      onClick={() => removeDurationOption(index)}
                      className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/15 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-black/15 p-4">
          <div className="text-sm font-medium mb-4">Experience details</div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Meeting point</label>
              <input
                name="meetingPoint"
                defaultValue={activity.meetingPoint ?? ""}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Skill level</label>
              <input
                name="skillLevel"
                defaultValue={activity.skillLevel ?? ""}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Age info</label>
              <input
                name="ageInfo"
                defaultValue={activity.ageInfo ?? ""}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Pricing notes</label>
              <input
                name="pricingNotes"
                defaultValue={activity.pricingNotes ?? ""}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>
          </div>

          <div className="grid gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Included</label>
              <textarea
                name="includedText"
                defaultValue={activity.includedText ?? ""}
                className="min-h-[90px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">What to bring</label>
              <textarea
                name="bringText"
                defaultValue={activity.bringText ?? ""}
                className="min-h-[90px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Cancellation policy</label>
              <textarea
                name="cancellationText"
                defaultValue={activity.cancellationText ?? ""}
                className="min-h-[90px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Safety info</label>
              <textarea
                name="safetyInfo"
                defaultValue={activity.safetyInfo ?? ""}
                className="min-h-[90px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>
          </div>
        </div>
      </div>

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