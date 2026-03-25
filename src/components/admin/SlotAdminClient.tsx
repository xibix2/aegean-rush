"use client";

import { format } from "date-fns";
import { useMemo } from "react";
import { useT } from "@/components/I18nProvider";

/** DB mapping for consistent state logic */
const DB = {
  PENDING: "pending",
  CONFIRMED: "paid",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type DurationOptionPayload = {
  id: string;
  label: string | null;
  durationMin: number;
  priceCents: number;
};

type BookingPayload = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  partySize: number;
  reservedUnits: number;
  bookingStartAtISO: string;
  bookingEndAtISO: string;
  durationMinSnapshot: number | null;
  pricingLabelSnapshot: string | null;
  status: string;
  totalPrice: number;
  createdAtISO: string;
  payment: {
    providerIntentId: string | null;
    providerRef: string | null;
    stripePaymentIntentId: string | null;
    paymentIntentId: string | null;
  };
};

type SlotPayload =
  | {
      id: string;
      status: "open" | "closed";
      isClosed: boolean;
      activityName: string;
      activityMode: ActivityMode;
      capacity: number;
      minParty: number;
      maxParty: number;
      guestsPerUnit: number | null;
      maxUnitsPerBooking: number | null;
      slotIntervalMin: number | null;
      durationOptions: DurationOptionPayload[];
      startAtISO: string;
      endAtISO: string;
      bookings: BookingPayload[];
    }
  | null;

export default function SlotAdminClient({
  currency,
  slot,
  createAdminBooking,
  cancelBookingAction,
  refundBookingAction,
}: {
  currency: string;
  slot: SlotPayload;
  createAdminBooking: (fd: FormData) => Promise<void>;
  cancelBookingAction: (fd: FormData) => Promise<void>;
  refundBookingAction: (fd: FormData) => Promise<void>;
}) {
  const t = useT();

  if (!slot) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">{t("admin.slot.notFound")}</h1>
      </main>
    );
  }

  const start = new Date(slot.startAtISO);
  const end = new Date(slot.endAtISO);
  const mode = slot.activityMode;
  const isClosed = !!slot.isClosed;

  const paid = useMemo(() => {
    if (mode === "FIXED_SEAT_EVENT") {
      return slot.bookings
        .filter((b) => b.status === DB.CONFIRMED)
        .reduce((s, b) => s + b.partySize, 0);
    }

    return slot.bookings
      .filter((b) => b.status === DB.CONFIRMED)
      .reduce((s, b) => s + (b.reservedUnits || 0), 0);
  }, [slot.bookings, mode]);

  const freshPending = useMemo(() => {
    if (mode === "FIXED_SEAT_EVENT") {
      return slot.bookings
        .filter((b) => {
          if (b.status !== DB.PENDING) return false;
          const mins = (Date.now() - new Date(b.createdAtISO).getTime()) / 60000;
          return mins < 30;
        })
        .reduce((s, b) => s + b.partySize, 0);
    }

    return slot.bookings
      .filter((b) => {
        if (b.status !== DB.PENDING) return false;
        const mins = (Date.now() - new Date(b.createdAtISO).getTime()) / 60000;
        return mins < 30;
      })
      .reduce((s, b) => s + (b.reservedUnits || 0), 0);
  }, [slot.bookings, mode]);

  const remaining = Math.max(0, slot.capacity - paid - freshPending);

  const fmtMoney = (cents: number | null | undefined) =>
    `${currency}${(((cents ?? 0) as number) / 100).toFixed(2)}`;

  const firstDurationOption = slot.durationOptions[0];

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-white via-pink-200 to-violet-200 bg-clip-text text-transparent">
              {t("admin.slot.title")}
            </span>
          </h1>

          <div className="mt-2 text-sm opacity-85">
            <span className="opacity-75">{slot.activityName}</span>{" "}
            — {format(start, "eee, d MMM yyyy HH:mm")}–{format(end, "HH:mm")}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ModeBadge mode={mode} />
            {isClosed && <ClosedBadge />}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <StatPill
              label={mode === "FIXED_SEAT_EVENT" ? "Capacity" : "Units capacity"}
              value={slot.capacity}
            />
            <StatPill
              label={mode === "FIXED_SEAT_EVENT" ? "Paid" : "Paid units"}
              value={paid}
              tone="emerald"
            />
            <StatPill
              label={mode === "FIXED_SEAT_EVENT" ? "Pending (fresh)" : "Pending units"}
              value={freshPending}
              tone="amber"
            />
            <StatPill
              label={mode === "FIXED_SEAT_EVENT" ? "Remaining" : "Remaining units"}
              value={remaining}
              tone="pink"
            />
          </div>

          <div
            className="mt-3 h-[3px] w-44 rounded-full bg-gradient-to-r from-transparent via-pink-500/85 to-transparent"
            style={{ animation: "adminGlowLine 3.2s ease-in-out infinite" } as any}
          />
        </div>

        <a
          href={`/admin?date=${format(start, "yyyy-MM-dd")}`}
          className="rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] px-4 py-2 text-sm transition"
        >
          {t("admin.slot.back")}
        </a>
      </header>

      {isClosed && (
        <section className="rounded-2xl border border-red-500/25 bg-red-500/10 p-5 shadow-[0_0_35px_-20px_rgba(239,68,68,0.55)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-red-100">This slot is closed</h2>
              <p className="mt-1 text-sm text-red-100/80">
                It has been removed from availability. New bookings are disabled for this slot.
              </p>
            </div>

            <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-200">
              Closed for booking
            </span>
          </div>
        </section>
      )}

      <section
        className={`rounded-2xl border p-5 backdrop-blur-md shadow-[0_0_40px_-20px_rgba(255,99,189,0.25)] ${
          isClosed
            ? "border-red-500/20 bg-red-500/[0.04] opacity-75"
            : "border-white/10 bg-[--card]/50"
        }`}
        style={{ ["--card" as any]: "rgba(20,20,30,.55)" }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium opacity-85">{t("admin.slot.addTitle")}</h2>
          {isClosed && (
            <span className="text-xs text-red-200/85">Manual booking disabled while slot is closed</span>
          )}
        </div>

        <form action={createAdminBooking} className="space-y-4">
          <fieldset disabled={isClosed} className="space-y-4 disabled:opacity-60">
            <input type="hidden" name="slotId" value={slot.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm opacity-80 mb-1" htmlFor="name">
                  {t("admin.slot.customerName")}
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  aria-label={t("admin.slot.aria.customerName")}
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                  placeholder={t("admin.slot.namePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm opacity-80 mb-1" htmlFor="email">
                  {t("admin.slot.customerEmail")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  aria-label={t("admin.slot.aria.customerEmail")}
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                  placeholder={t("admin.slot.emailPlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm opacity-80 mb-1" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                  placeholder="+30..."
                />
              </div>

              {mode === "FIXED_SEAT_EVENT" && (
                <div>
                  <label className="block text-sm opacity-80 mb-1" htmlFor="partySize">
                    {t("admin.slot.partySize")}
                  </label>
                  <input
                    id="partySize"
                    name="partySize"
                    type="number"
                    min={slot.minParty || 1}
                    max={slot.maxParty || slot.capacity}
                    defaultValue={Math.max(slot.minParty || 1, 1)}
                    aria-label={t("admin.slot.aria.partySize")}
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {mode !== "FIXED_SEAT_EVENT" && (
                <div>
                  <label className="block text-sm opacity-80 mb-1" htmlFor="startTime">
                    Start time
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    defaultValue={toLocalDateTimeInputValue(start)}
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {mode !== "FIXED_SEAT_EVENT" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-sm opacity-80 mb-1"
                    htmlFor="durationOptionId"
                  >
                    Duration option
                  </label>
                  <select
                    id="durationOptionId"
                    name="durationOptionId"
                    defaultValue={firstDurationOption?.id ?? ""}
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                  >
                    {slot.durationOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label?.trim()
                          ? `${opt.label} — ${fmtMoney(opt.priceCents)}`
                          : `${opt.durationMin} min — ${fmtMoney(opt.priceCents)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {mode === "DYNAMIC_RENTAL" && (
                  <div>
                    <label className="block text-sm opacity-80 mb-1" htmlFor="units">
                      Units
                    </label>
                    <input
                      id="units"
                      name="units"
                      type="number"
                      min={1}
                      max={slot.maxUnitsPerBooking || slot.capacity}
                      defaultValue={1}
                      className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {mode === "HYBRID_UNIT_BOOKING" && (
                  <>
                    <div>
                      <label className="block text-sm opacity-80 mb-1" htmlFor="guests">
                        Guests
                      </label>
                      <input
                        id="guests"
                        name="guests"
                        type="number"
                        min={slot.minParty || 1}
                        max={slot.maxParty || 999}
                        defaultValue={Math.max(slot.minParty || 1, 1)}
                        className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm opacity-80 mb-1" htmlFor="units">
                        Units (optional)
                      </label>
                      <input
                        id="units"
                        name="units"
                        type="number"
                        min={1}
                        max={slot.maxUnitsPerBooking || slot.capacity}
                        defaultValue={1}
                        className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm opacity-85">
                <input
                  type="checkbox"
                  name="markPaid"
                  value="yes"
                  aria-label={t("admin.slot.aria.markPaid")}
                  className="size-4 rounded border-white/20 bg-white/5"
                />
                {t("admin.slot.markPaid")}
              </label>

              <button
                aria-label={t("admin.slot.aria.addBooking")}
                disabled={isClosed}
                className={`ml-auto inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-medium text-white transition ${
                  isClosed
                    ? "cursor-not-allowed border border-white/10 bg-white/[0.08] opacity-60"
                    : "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 shadow-[0_0_25px_-8px_rgba(255,99,189,0.5)] hover:scale-[1.02]"
                }`}
              >
                {isClosed ? "Slot closed" : t("admin.slot.addBookingBtn")}
              </button>
            </div>
          </fieldset>
        </form>

        <div className="mt-3 text-xs opacity-60 space-y-1">
          {mode === "FIXED_SEAT_EVENT" ? (
            <p>{t("admin.slot.capNote")}</p>
          ) : (
            <>
              <p>
                This slot is a daily/window container. Admin bookings use the same
                overlap and availability rules as customer checkout.
              </p>
              <p>
                Remaining shown above is unit-based for rental and hybrid activities.
              </p>
            </>
          )}
        </div>
      </section>

      <section
        className="rounded-2xl border border-white/10 bg-[--card]/50 backdrop-blur-md p-5 shadow-[0_0_40px_-20px_rgba(255,99,189,0.25)]"
        style={{ ["--card" as any]: "rgba(20,20,30,.55)" }}
      >
        <h2 className="text-sm font-medium opacity-85 mb-4">
          {t("admin.slot.listTitle")}
        </h2>

        <div className="grid gap-3">
          {slot.bookings.map((b) => {
            const status = String(b.status);
            const isPending = status === DB.PENDING;
            const isPaid = status === DB.CONFIRMED;
            const isCancelled = status === DB.CANCELLED;
            const isRefunded = status === DB.REFUNDED;

            const canCancel = isPending || isPaid;
            const canRefund = isPaid && !isCancelled && !isRefunded;

            const pi =
              b.payment.providerIntentId ||
              (b.payment.providerRef?.startsWith?.("pi_")
                ? b.payment.providerRef
                : undefined) ||
              b.payment.stripePaymentIntentId ||
              b.payment.paymentIntentId;

            const canStripeRefund = !!pi && pi.startsWith("pi_");

            return (
              <div
                key={b.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 grid md:grid-cols-3 gap-4 hover:bg-white/[0.05] transition"
              >
                <div className="text-sm">
                  <div className="font-medium">{b.customerName ?? "—"}</div>
                  <div className="opacity-75">{b.customerEmail ?? "—"}</div>
                  <div className="text-xs opacity-60 break-all mt-1">
                    {t("admin.slot.meta.bookingId")}: {b.id}
                  </div>
                </div>

                <div className="text-sm grid gap-1">
                  <div className="flex items-center gap-2">
                    <b className="opacity-85">{t("admin.slot.meta.status")}:</b>
                    <StatusPill
                      status={String(b.status)}
                      tConfirmed={t("admin.slot.pillConfirmed")}
                      tPending={t("admin.slot.pillPending")}
                      tCancelled={t("admin.slot.pillCancelled")}
                      tRefunded={t("admin.slot.pillRefunded")}
                    />
                  </div>

                  <div>
                    <b className="opacity-85">
                      {mode === "FIXED_SEAT_EVENT"
                        ? t("admin.slot.meta.party")
                        : mode === "DYNAMIC_RENTAL"
                        ? "Units"
                        : "Guests / Units"}
                      :
                    </b>{" "}
                    {mode === "FIXED_SEAT_EVENT"
                      ? b.partySize
                      : mode === "DYNAMIC_RENTAL"
                      ? b.reservedUnits
                      : `${b.partySize} / ${b.reservedUnits}`}
                  </div>

                  <div>
                    <b className="opacity-85">Booked for:</b>{" "}
                    {format(new Date(b.bookingStartAtISO), "HH:mm")}–
                    {format(new Date(b.bookingEndAtISO), "HH:mm")}
                  </div>

                  {b.pricingLabelSnapshot && (
                    <div>
                      <b className="opacity-85">Label:</b> {b.pricingLabelSnapshot}
                    </div>
                  )}

                  {!b.pricingLabelSnapshot && b.durationMinSnapshot != null && (
                    <div>
                      <b className="opacity-85">Duration:</b> {b.durationMinSnapshot} min
                    </div>
                  )}

                  <div>
                    <b className="opacity-85">{t("admin.slot.meta.total")}:</b>{" "}
                    {fmtMoney(b.totalPrice)}
                  </div>

                  <div className="text-xs opacity-60 break-all">
                    <b className="opacity-85">{t("admin.slot.meta.pi")}:</b>{" "}
                    {b.payment.providerIntentId ?? "—"}
                  </div>
                </div>

                <div className="md:ml-auto w-full md:max-w-[320px]">
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`/admin/bookings?view=&focus=${b.id}`}
                      title={t("admin.slot.openInBookings")}
                      aria-label={t("admin.slot.aria.openInBookings")}
                      className="h-9 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/[0.08]
                                text-xs font-medium px-3 transition focus:outline-none focus:ring-1 focus:ring-pink-400/40
                                flex items-center justify-center"
                    >
                      {t("admin.slot.openInBookings")}
                    </a>

                    <form action={cancelBookingAction} className="contents">
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="slotId" value={slot.id} />
                      <button
                        aria-label={t("admin.slot.aria.cancel")}
                        disabled={!canCancel || isCancelled || isRefunded}
                        className={`h-9 rounded-lg border border-white/10 bg-white/[0.05] text-xs font-medium px-3
                          flex items-center justify-center transition focus:outline-none focus:ring-1 focus:ring-pink-400/40
                          ${
                            !canCancel || isCancelled || isRefunded
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-white/[0.08]"
                          }`}
                      >
                        {t("admin.slot.cancel")}
                      </button>
                    </form>

                    {!isRefunded ? (
                      <form action={refundBookingAction} className="col-span-2">
                        <input type="hidden" name="bookingId" value={b.id} />
                        <input type="hidden" name="slotId" value={slot.id} />
                        <button
                          aria-label={
                            canStripeRefund
                              ? t("admin.slot.aria.refund")
                              : t("admin.slot.aria.markRefunded")
                          }
                          disabled={!canRefund}
                          className={`h-9 w-full rounded-lg border border-rose-400/30 bg-rose-400/10 text-rose-200
                            text-xs font-medium px-3 flex items-center justify-center transition
                            focus:outline-none focus:ring-1 focus:ring-rose-300/40
                            ${
                              !canRefund
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-rose-400/15"
                            }`}
                        >
                          {canStripeRefund
                            ? t("admin.slot.refundStripe")
                            : t("admin.slot.markRefunded")}
                        </button>
                      </form>
                    ) : (
                      <button
                        disabled
                        className="col-span-2 h-9 w-full rounded-lg border border-rose-400/20 bg-rose-400/5 text-rose-200/70 text-xs font-medium px-3 opacity-60 cursor-not-allowed"
                      >
                        {t("admin.slot.refunded")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {slot.bookings.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm opacity-80">
              {t("admin.slot.none")}
            </div>
          )}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes adminGlowLine {0%,100%{opacity:.55;transform:scaleX(.9)}50%{opacity:.95;transform:scaleX(1)}}
          `,
        }}
      />
    </main>
  );
}

function ClosedBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[12px] font-medium text-red-200">
      Closed
    </span>
  );
}

function ModeBadge({ mode }: { mode: ActivityMode }) {
  const meta =
    mode === "DYNAMIC_RENTAL"
      ? {
          label: "Rental",
          cls: "border-sky-400/30 bg-sky-400/10 text-sky-200",
        }
      : mode === "HYBRID_UNIT_BOOKING"
      ? {
          label: "Hybrid",
          cls: "border-teal-400/30 bg-teal-400/10 text-teal-200",
        }
      : {
          label: "Fixed event",
          cls: "border-violet-400/30 bg-violet-400/10 text-violet-200",
        };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function StatPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "emerald" | "amber" | "pink";
}) {
  const tones: Record<string, string> = {
    default: "border-white/15 bg-white/[0.06] text-white/90",
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    pink: "border-pink-400/30 bg-pink-400/10 text-pink-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[12px] ${tones[tone]}`}
    >
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function StatusPill({
  status,
  tConfirmed,
  tPending,
  tCancelled,
  tRefunded,
}: {
  status: string;
  tConfirmed: string;
  tPending: string;
  tCancelled: string;
  tRefunded: string;
}) {
  const s = status.toLowerCase();
  const cls =
    s === "paid"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : s === "pending"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : s === "cancelled"
      ? "border-zinc-400/30 bg-zinc-400/10 text-zinc-200"
      : "border-rose-400/30 bg-rose-400/10 text-rose-200";
  const label =
    s === "paid"
      ? tConfirmed
      : s === "pending"
      ? tPending
      : s === "cancelled"
      ? tCancelled
      : tRefunded;
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function toLocalDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}