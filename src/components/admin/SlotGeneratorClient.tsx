"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/components/I18nProvider";

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type ActivityDurationOption = {
  id: string;
  label: string | null;
  durationMin: number;
  priceCents: number;
};

type Activity = {
  id: string;
  name: string;
  mode: ActivityMode;
  durationMin: number | null;
  basePrice: number | null;
  maxParty: number | null;
  slotIntervalMin: number | null;
  maxUnitsPerBooking: number | null;
  guestsPerUnit: number | null;
  durationOptions: ActivityDurationOption[];
};

type SlotRow = {
  id: string;
  activityId: string;
  activityName: string;
  activityMode: ActivityMode;
  startAtISO: string;
  endAtISO: string | null;
  status: "open" | "closed";
  capacity: number;
  priceCents: number;
  paid: number;
  pending: number;
  remaining: number;
};

type Props = {
  activities: Activity[];
  slots: SlotRow[];
  selectedDate: string;
  created?: number;
  defaults: {
    from: string;
    to: string;
    departureTime: string;
    availableFromTime: string;
    availableToTime: string;
  };
  backHref: string;
  action: (formData: FormData) => Promise<void>;
};

function formatEuroFromCents(cents: number | null | undefined) {
  if (cents == null) return "0.00";
  return (cents / 100).toFixed(2);
}

export default function SlotGeneratorClient({
  activities,
  slots,
  selectedDate,
  created,
  defaults,
  backHref,
  action,
}: Props) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialActivityId = searchParams.get("activityId") || "";
  const initialStatus =
    searchParams.get("status") === "open" || searchParams.get("status") === "closed"
      ? (searchParams.get("status") as "open" | "closed")
      : "all";

  const [selectedActivityId, setSelectedActivityId] = useState<string>(initialActivityId);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(initialStatus);

  const selectedActivity = useMemo<Activity | null>(
    () => activities.find((a) => a.id === selectedActivityId) ?? null,
    [activities, selectedActivityId]
  );

  const firstDurationOption = selectedActivity?.durationOptions?.[0] ?? null;

  const [durationMin, setDurationMin] = useState<number>(60);
  const [capacity, setCapacity] = useState<number>(4);
  const [priceEuro, setPriceEuro] = useState<number>(0);

  const isFixed = selectedActivity?.mode === "FIXED_SEAT_EVENT";
  const isRental = selectedActivity?.mode === "DYNAMIC_RENTAL";
  const isHybrid = selectedActivity?.mode === "HYBRID_UNIT_BOOKING";

  const helperText = isFixed
    ? "Generate scheduled departures where guests reserve seats."
    : isRental
    ? "Generate daily rental availability windows. Guests will later choose a start time and duration inside that window."
    : isHybrid
    ? "Generate daily unit-availability windows. Guests will later choose a start time, duration, and number of units inside that window."
    : "Choose an activity to configure slot generation.";

  const selectedModeBadge = isFixed
    ? "Fixed Event"
    : isRental
    ? "Rental"
    : isHybrid
    ? "Hybrid"
    : null;

  const pushFiltersToUrl = useCallback(
    (next: {
      date?: string;
      activityId?: string;
      status?: "all" | "open" | "closed";
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      const nextDate = next.date ?? selectedDate;
      const nextActivityId = next.activityId ?? selectedActivityId;
      const nextStatus = next.status ?? statusFilter;

      params.set("date", nextDate);

      if (nextActivityId) params.set("activityId", nextActivityId);
      else params.delete("activityId");

      if (nextStatus !== "all") params.set("status", nextStatus);
      else params.delete("status");

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, selectedDate, selectedActivityId, statusFilter]
  );

  const handleActivityChange = useCallback(
    (value: string) => {
      setSelectedActivityId(value);
      pushFiltersToUrl({ activityId: value });

      const act = activities.find((a) => a.id === value) ?? null;
      if (!act) return;

      const firstOption = act.durationOptions?.[0] ?? null;

      if (act.mode === "FIXED_SEAT_EVENT") {
        setDurationMin(act.durationMin ?? 60);
        setCapacity(act.maxParty ?? 4);
        setPriceEuro(act.basePrice != null ? act.basePrice / 100 : 0);
        return;
      }

      setCapacity(act.maxUnitsPerBooking ?? 1);
      setDurationMin(firstOption?.durationMin ?? act.durationMin ?? 60);
      setPriceEuro(
        firstOption?.priceCents != null
          ? firstOption.priceCents / 100
          : act.basePrice != null
          ? act.basePrice / 100
          : 0
      );
    },
    [activities, pushFiltersToUrl]
  );

  const handleCapacityChange = (val: string) => {
    const n = Number(val);
    setCapacity(Number.isFinite(n) && n > 0 ? n : 1);
  };

  const handleStatusChange = (value: "all" | "open" | "closed") => {
    setStatusFilter(value);
    pushFiltersToUrl({ status: value });
  };

  const handleDateChange = (value: string) => {
    pushFiltersToUrl({ date: value });
  };

  useEffect(() => {
    const act = activities.find((a) => a.id === selectedActivityId) ?? null;
    if (!act) return;

    const firstOption = act.durationOptions?.[0] ?? null;

    if (act.mode === "FIXED_SEAT_EVENT") {
      setDurationMin(act.durationMin ?? 60);
      setCapacity(act.maxParty ?? 4);
      setPriceEuro(act.basePrice != null ? act.basePrice / 100 : 0);
      return;
    }

    setCapacity(act.maxUnitsPerBooking ?? 1);
    setDurationMin(firstOption?.durationMin ?? act.durationMin ?? 60);
    setPriceEuro(
      firstOption?.priceCents != null
        ? firstOption.priceCents / 100
        : act.basePrice != null
        ? act.basePrice / 100
        : 0
    );
  }, [activities, selectedActivityId]);

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (statusFilter !== "all" && slot.status !== statusFilter) return false;
      if (selectedActivityId && slot.activityId !== selectedActivityId) return false;
      return true;
    });
  }, [slots, statusFilter, selectedActivityId]);

  const groupedSlots = useMemo(() => {
    const map = new Map<string, { activityName: string; activityMode: ActivityMode; rows: SlotRow[] }>();

    for (const slot of filteredSlots) {
      if (!map.has(slot.activityId)) {
        map.set(slot.activityId, {
          activityName: slot.activityName,
          activityMode: slot.activityMode,
          rows: [],
        });
      }
      map.get(slot.activityId)!.rows.push(slot);
    }

    return Array.from(map.entries()).map(([activityId, value]) => ({
      activityId,
      ...value,
    }));
  }, [filteredSlots]);

  const summary = useMemo(() => {
    const openCount = slots.filter((s) => s.status === "open").length;
    const closedCount = slots.filter((s) => s.status === "closed").length;
    return {
      total: slots.length,
      open: openCount,
      closed: closedCount,
    };
  }, [slots]);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.day-dot{transition:box-shadow .2s ease,background-color .2s ease,transform .2s ease;}
.day-dot:where(.checked){box-shadow:0 0 12px 2px rgb(var(--accent-glow)/0.55);transform:translateZ(0);}
          `.trim(),
        }}
      />

      <div className="space-y-2">
        <h1 className="text-3xl md:text-[32px] font-semibold tracking-tight">
          <span className="text-accent-gradient">{t("slots.generator.title")}</span>
        </h1>
        <p className="text-sm opacity-70">
          Create availability and scan daily slot status quickly.
        </p>
      </div>

      {typeof created === "number" && created > 0 && (
        <div
          role="status"
          className="rounded-xl u-border u-surface px-4 py-2 text-sm glow-soft"
        >
          {t("slots.generator.created")} <strong>{created}</strong>{" "}
          {t("slots.generator.slots")}.
        </div>
      )}

      {created === 0 && (
        <div
          role="status"
          className="rounded-xl u-border u-surface px-4 py-2 text-sm glow-soft"
        >
          {t("slots.generator.none")}
        </div>
      )}

      <section className="rounded-2xl u-border bg-[--color-card] p-5 md:p-6 glow-soft space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Day operations</h2>
            <p className="text-sm opacity-70">
              {format(new Date(`${selectedDate}T00:00:00`), "eeee, d MMM yyyy")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full u-border u-surface px-3 py-1.5">
              Total {summary.total}
            </span>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
              Open {summary.open}
            </span>
            <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-red-200">
              Closed {summary.closed}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[180px_minmax(220px,1fr)_auto]">
          <label className="text-sm">
            Date
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
            />
          </label>

          <label className="text-sm">
            Filter by activity
            <select
              value={selectedActivityId}
              onChange={(e) => handleActivityChange(e.target.value)}
              className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
            >
              <option value="">All activities</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="text-sm mb-1">Status</div>
            <div className="flex flex-wrap gap-2">
              {(["all", "open", "closed"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStatusChange(value)}
                  className={`rounded-full px-3 py-2 text-sm border transition ${
                    statusFilter === value
                      ? "border-pink-400/35 bg-pink-400/10 text-pink-100"
                      : "u-border u-surface opacity-85 hover:opacity-100"
                  }`}
                >
                  {value === "all" ? "All" : value === "open" ? "Open" : "Closed"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {groupedSlots.length === 0 ? (
          <div className="rounded-xl u-border u-surface px-4 py-4 text-sm opacity-75">
            No slots match the current filters.
          </div>
        ) : (
          <div className="grid gap-4">
            {groupedSlots.map((group) => (
              <div key={group.activityId} className="rounded-2xl u-border u-surface overflow-hidden">
                <div className="border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{group.activityName}</div>
                    <span className="rounded-full px-2.5 py-1 text-xs u-border u-surface opacity-85">
                      {group.activityMode === "FIXED_SEAT_EVENT"
                        ? "Fixed event"
                        : group.activityMode === "DYNAMIC_RENTAL"
                        ? "Rental"
                        : "Hybrid"}
                    </span>
                  </div>

                  <div className="text-xs opacity-75">
                    {group.rows.length} slot{group.rows.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="grid gap-3 p-4">
                  {group.rows.map((slot) => {
                    const start = new Date(slot.startAtISO);
                    const end = slot.endAtISO ? new Date(slot.endAtISO) : null;
                    const isClosed = slot.status === "closed";

                    return (
                      <div
                        key={slot.id}
                        className={`grid gap-4 rounded-xl border px-4 py-4 md:grid-cols-[1.1fr_1fr_auto] md:items-center ${
                          isClosed
                            ? "border-red-500/20 bg-red-500/[0.06]"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div>
                          <div className="text-lg font-semibold">
                            {format(start, "HH:mm")}
                            {end ? `–${format(end, "HH:mm")}` : ""}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            {isClosed ? (
                              <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2.5 py-1 text-red-200">
                                Closed
                              </span>
                            ) : (
                              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">
                                Open
                              </span>
                            )}
                            <span className="opacity-65">ID: {slot.id.slice(0, 8)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full u-border u-surface px-2.5 py-1">
                            Cap {slot.capacity}
                          </span>
                          <span className="rounded-full u-border u-surface px-2.5 py-1">
                            Paid {slot.paid}
                          </span>
                          <span className="rounded-full u-border u-surface px-2.5 py-1">
                            Pending {slot.pending}
                          </span>
                          {!isClosed && (
                            <span className="rounded-full border border-pink-400/25 bg-pink-400/10 px-2.5 py-1 text-pink-100">
                              Left {slot.remaining}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <div className="text-sm opacity-75">
                            € {formatEuroFromCents(slot.priceCents)}
                          </div>
                          <a
                            href={`/admin/slots/${slot.id}`}
                            className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm u-border u-surface hover:opacity-90 transition"
                          >
                            Open slot
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Generate slots</h2>
              <p className="text-sm opacity-70">
                Create or regenerate availability for selected activities.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
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
                {activities.map((a: Activity) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>

            {isFixed ? (
              <label className="text-sm">
                Departure time
                <input
                  name="times"
                  type="time"
                  step={60}
                  defaultValue={defaults.departureTime}
                  lang="en-GB"
                  inputMode="none"
                  className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Available from
                  <input
                    name="windowStartTime"
                    type="time"
                    step={60}
                    defaultValue={defaults.availableFromTime}
                    lang="en-GB"
                    inputMode="none"
                    className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
                  />
                </label>

                <label className="text-sm">
                  Available to
                  <input
                    name="windowEndTime"
                    type="time"
                    step={60}
                    defaultValue={defaults.availableToTime}
                    lang="en-GB"
                    inputMode="none"
                    className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
                  />
                </label>
              </div>
            )}

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
          </div>

          {selectedActivity && (
            <div className="rounded-2xl u-border u-surface p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-medium">{selectedActivity.name}</div>
                {selectedModeBadge && (
                  <span className="rounded-full px-2.5 py-1 text-xs u-border u-surface opacity-85">
                    {selectedModeBadge}
                  </span>
                )}
              </div>

              <div
                className={`grid gap-3 text-sm ${
                  isFixed ? "sm:grid-cols-3" : "sm:grid-cols-2"
                }`}
              >
                <div className="rounded-xl u-border u-surface px-3 py-2">
                  <div className="opacity-65">
                    {isFixed ? "Default duration" : "Shortest option"}
                  </div>
                  <div className="mt-1 font-medium">
                    {firstDurationOption?.durationMin ??
                      selectedActivity.durationMin ??
                      60}{" "}
                    min
                  </div>
                </div>

                <div className="rounded-xl u-border u-surface px-3 py-2">
                  <div className="opacity-65">
                    {isFixed ? "Default seat price" : "Pricing starts from"}
                  </div>
                  <div className="mt-1 font-medium">
                    €{" "}
                    {firstDurationOption?.priceCents != null
                      ? formatEuroFromCents(firstDurationOption.priceCents)
                      : formatEuroFromCents(selectedActivity.basePrice)}
                  </div>
                </div>

                {isFixed ? (
                  <div className="rounded-xl u-border u-surface px-3 py-2">
                    <div className="opacity-65">Guest capacity</div>
                    <div className="mt-1 font-medium">
                      {selectedActivity.maxParty ?? 4}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl u-border u-surface px-3 py-2">
                    <div className="opacity-65">
                      {isHybrid ? "Guests per unit" : "Max units per booking"}
                    </div>
                    <div className="mt-1 font-medium">
                      {isHybrid
                        ? selectedActivity.guestsPerUnit ?? 1
                        : selectedActivity.maxUnitsPerBooking ?? 1}
                    </div>
                  </div>
                )}
              </div>

              {(isRental || isHybrid) &&
                selectedActivity.durationOptions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Configured duration options
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedActivity.durationOptions.map(
                        (opt: ActivityDurationOption) => (
                          <div
                            key={opt.id}
                            className="rounded-full px-3 py-1.5 text-xs u-border u-surface opacity-90"
                          >
                            {opt.label ? `${opt.label} · ` : ""}
                            {opt.durationMin} min · €{" "}
                            {formatEuroFromCents(opt.priceCents)}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {isHybrid && selectedActivity.guestsPerUnit && (
                <div className="text-sm opacity-75">
                  Each unit supports up to{" "}
                  <strong>{selectedActivity.guestsPerUnit}</strong> guest
                  {selectedActivity.guestsPerUnit === 1 ? "" : "s"}.
                </div>
              )}
            </div>
          )}

          {isFixed ? (
            <div className="rounded-xl u-border u-surface px-4 py-3 text-sm opacity-80">
              This generator will create scheduled departures using the activity’s
              default duration, seat price, and guest capacity.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-sm">
                Units available
                <input
                  type="number"
                  name="capacity"
                  min={1}
                  value={capacity}
                  onChange={(e) => handleCapacityChange(e.target.value)}
                  className="mt-1 w-full rounded-lg u-border u-surface px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--accent-500)]/40"
                />
              </label>

              <div className="rounded-xl u-border u-surface px-4 py-3 text-sm opacity-80 flex items-center">
                Daily availability windows use the activity’s configured
                duration options and pricing during booking.
              </div>
            </div>
          )}

          <fieldset className="grid gap-2">
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

          <div className="rounded-xl u-border u-surface px-4 py-3 text-sm opacity-80">
            {helperText}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button className="btn-accent inline-flex h-11 items-center justify-center px-6 text-sm font-medium">
              {t("slots.generator.button")}
            </button>

            <a
              href={backHref}
              className="inline-flex h-11 items-center justify-center rounded-[12px] px-4 text-sm u-border u-surface hover:opacity-90 transition"
            >
              {t("slots.generator.back")}
            </a>
          </div>
        </div>
      </form>
    </main>
  );
}