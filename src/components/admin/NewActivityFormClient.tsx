"use client";

import { useEffect, useMemo, useState } from "react";
import CoverPicker from "@/components/ui/CoverPicker";
import { useT } from "@/components/I18nProvider";

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type DurationOptionRow = {
  id: string;
  label: string;
  durationMin: string;
  priceEuro: string;
};

type ModeCard = {
  value: ActivityMode;
  title: string;
  subtitle: string;
  examples: string;
};

function makeRow(seed = 0): DurationOptionRow {
  return {
    id: `row-${Date.now()}-${seed}-${Math.random().toString(36).slice(2, 8)}`,
    label: "",
    durationMin: "",
    priceEuro: "",
  };
}

export function NewActivityFormClient({
  createAction,
}: {
  createAction: (formData: FormData) => Promise<void>;
}) {
  const t = useT();

  const [mode, setMode] = useState<ActivityMode>("FIXED_SEAT_EVENT");
  const [durationOptions, setDurationOptions] = useState<DurationOptionRow[]>([
    makeRow(1),
  ]);

  const isFixed = mode === "FIXED_SEAT_EVENT";
  const isRental = mode === "DYNAMIC_RENTAL";
  const isHybrid = mode === "HYBRID_UNIT_BOOKING";

  const modeCards = useMemo<ModeCard[]>(
    () => [
      {
        value: "FIXED_SEAT_EVENT",
        title: "Fixed Event",
        subtitle: "Sell seats for a scheduled experience",
        examples: "Boat trips, cruises, diving departures",
      },
      {
        value: "DYNAMIC_RENTAL",
        title: "Rental",
        subtitle: "Rent equipment or vehicles by time",
        examples: "Boat rental, paddleboards, kayaks",
      },
      {
        value: "HYBRID_UNIT_BOOKING",
        title: "Hybrid",
        subtitle: "Timed unit booking with guest count",
        examples: "Jet skis, buggies, tandem rides",
      },
    ],
    []
  );

  useEffect(() => {
    if (isFixed) {
      setDurationOptions([makeRow(1)]);
    }
  }, [isFixed]);

  function updateDurationRow(
    id: string,
    field: keyof Omit<DurationOptionRow, "id">,
    value: string
  ) {
    setDurationOptions((rows: DurationOptionRow[]) =>
      rows.map((row: DurationOptionRow) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  }

  function addDurationRow() {
    setDurationOptions((rows: DurationOptionRow[]) => [
      ...rows,
      makeRow(rows.length + 1),
    ]);
  }

  function removeDurationRow(id: string) {
    setDurationOptions((rows: DurationOptionRow[]) =>
      rows.length <= 1
        ? rows
        : rows.filter((row: DurationOptionRow) => row.id !== id)
    );
  }

  return (
    <form
      action={createAction}
      encType="multipart/form-data"
      className="relative overflow-hidden rounded-2xl u-border u-surface backdrop-blur-md p-6 sm:p-8 space-y-8 glow-soft"
    >
      <input type="hidden" name="mode" value={mode} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Activity type</h2>
          <p className="text-sm opacity-70 mt-1">
            Choose how this experience is sold and booked.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {modeCards.map((card: ModeCard) => {
            const selected = mode === card.value;

            return (
              <button
                key={card.value}
                type="button"
                onClick={() => setMode(card.value)}
                className={[
                  "text-left rounded-2xl p-5 transition border",
                  selected
                    ? "border-[var(--accent-500)] bg-[color-mix(in_oklab,var(--accent-500),transparent_92%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent-500),transparent_35%)]"
                    : "u-border u-surface hover:opacity-95",
                ].join(" ")}
                aria-pressed={selected}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold">{card.title}</div>
                  <div
                    className={[
                      "size-4 rounded-full border",
                      selected
                        ? "border-[var(--accent-500)] bg-[var(--accent-500)]"
                        : "border-white/25",
                    ].join(" ")}
                  />
                </div>

                <div className="mt-2 text-sm opacity-85">{card.subtitle}</div>
                <div className="mt-3 text-xs opacity-60">{card.examples}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Core details</h2>
          <p className="text-sm opacity-70 mt-1">
            The main information guests will use to understand this activity.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm opacity-80">
                  {t("admin.activities.form.name")}
                </label>
                <input
                  name="name"
                  required
                  className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                  placeholder="e.g. Sunset Boat Cruise"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm opacity-80">
                  {t("admin.activities.form.location")}
                </label>
                <input
                  name="locationId"
                  placeholder="e.g. hersonissos-port"
                  className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm opacity-80">Meeting point</label>
                <input
                  name="meetingPoint"
                  placeholder="e.g. Marina kiosk A"
                  className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm opacity-80">
                  {t("admin.activities.form.description")}
                </label>
                <textarea
                  name="description"
                  placeholder={t("admin.activities.form.descriptionPlaceholder")}
                  className="min-h-[110px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm mt-1">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="size-4"
                />
                {t("admin.activities.form.active")}
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm opacity-80">
              {t("admin.activities.form.cover")}
            </label>
            <CoverPicker name="coverFile" size={280} />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Guest information
          </h2>
          <p className="text-sm opacity-70 mt-1">
            Help guests know what is included, what to bring, and what to
            expect before arrival.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">Included</label>
            <textarea
              name="includedText"
              placeholder="e.g. fuel, life jackets, safety briefing"
              className="min-h-[96px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">What to bring</label>
            <textarea
              name="bringText"
              placeholder="e.g. swimwear, towel, sunscreen"
              className="min-h-[96px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">Cancellation policy</label>
            <textarea
              name="cancellationText"
              placeholder="e.g. Free cancellation up to 24 hours before start"
              className="min-h-[96px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">Safety information</label>
            <textarea
              name="safetyInfo"
              placeholder="e.g. Basic swimming ability recommended"
              className="min-h-[96px] rounded-lg u-border u-surface px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">Age information</label>
            <input
              name="ageInfo"
              placeholder="e.g. 8+ with guardian, 18+ to drive"
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm opacity-80">Skill level</label>
            <input
              name="skillLevel"
              placeholder="e.g. Beginner-friendly"
              className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Booking setup
          </h2>
          <p className="text-sm opacity-70 mt-1">
            Configure pricing, capacity, time structure, and booking behavior.
          </p>
        </div>

        {isFixed && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Duration (minutes)</label>
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
              <label className="text-sm opacity-80">Price per guest (€)</label>
              <input
                name="basePriceEuro"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="e.g. 40.00"
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Minimum guests</label>
              <input
                name="minParty"
                type="number"
                min={1}
                step={1}
                defaultValue={1}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Maximum guests</label>
              <input
                name="maxParty"
                type="number"
                min={1}
                step={1}
                defaultValue={8}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>
          </div>
        )}

        {isRental && (
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
                defaultValue={30}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Max units per booking</label>
              <input
                name="maxUnitsPerBooking"
                type="number"
                min={1}
                step={1}
                defaultValue={1}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Minimum guests</label>
              <input
                name="minParty"
                type="number"
                min={1}
                step={1}
                defaultValue={1}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Maximum guests</label>
              <input
                name="maxParty"
                type="number"
                min={1}
                step={1}
                defaultValue={6}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Pricing notes</label>
              <input
                name="pricingNotes"
                placeholder="e.g. Price is per boat"
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <input type="hidden" name="durationMin" value={60} />
            <input type="hidden" name="basePriceEuro" value={0} />
          </div>
        )}

        {isHybrid && (
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
                defaultValue={15}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Guests per unit</label>
              <input
                name="guestsPerUnit"
                type="number"
                min={1}
                step={1}
                defaultValue={2}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Max units per booking</label>
              <input
                name="maxUnitsPerBooking"
                type="number"
                min={1}
                step={1}
                defaultValue={2}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Maximum guests</label>
              <input
                name="maxParty"
                type="number"
                min={1}
                step={1}
                defaultValue={6}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Minimum guests</label>
              <input
                name="minParty"
                type="number"
                min={1}
                step={1}
                defaultValue={1}
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm opacity-80">Pricing notes</label>
              <input
                name="pricingNotes"
                placeholder="e.g. Price is per jet ski"
                className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
              />
            </div>

            <input type="hidden" name="durationMin" value={60} />
            <input type="hidden" name="basePriceEuro" value={0} />
          </div>
        )}
      </section>

      {!isFixed && (
        <section className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Duration & pricing options
              </h2>
              <p className="text-sm opacity-70 mt-1">
                Add the time options guests can choose from.
              </p>
            </div>

            <button
              type="button"
              onClick={addDurationRow}
              className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium u-border u-surface hover:opacity-90 transition"
            >
              + Add option
            </button>
          </div>

          <div className="grid gap-4">
            {durationOptions.map((row: DurationOptionRow, index: number) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-2xl u-border u-surface p-4 sm:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm opacity-80">Label</label>
                  <input
                    name="durationOptionLabel"
                    value={row.label}
                    onChange={(e) =>
                      updateDurationRow(row.id, "label", e.target.value)
                    }
                    placeholder={
                      index === 0 ? "e.g. Standard ride" : "Optional label"
                    }
                    className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm opacity-80">Duration (min)</label>
                  <input
                    name="durationOptionDurationMin"
                    type="number"
                    min={5}
                    step={5}
                    value={row.durationMin}
                    onChange={(e) =>
                      updateDurationRow(row.id, "durationMin", e.target.value)
                    }
                    placeholder="15"
                    className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm opacity-80">Price (€)</label>
                  <input
                    name="durationOptionPriceEuro"
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.priceEuro}
                    onChange={(e) =>
                      updateDurationRow(row.id, "priceEuro", e.target.value)
                    }
                    placeholder="50.00"
                    className="h-10 rounded-lg u-border u-surface px-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeDurationRow(row.id)}
                    className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm u-border u-surface hover:opacity-90 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="text-sm opacity-65">
          {isFixed && "Guests book seats on a scheduled departure."}
          {isRental && "Guests choose a start time and rental duration."}
          {isHybrid &&
            "Guests choose a start time, duration, and number of units."}
        </div>

        <button className="inline-flex items-center justify-center h-11 rounded-xl px-6 text-sm font-medium btn-accent">
          {t("admin.activities.new.create")}
        </button>
      </div>
    </form>
  );
}