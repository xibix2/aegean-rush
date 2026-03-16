"use client";

import { format } from "date-fns";
import { useT } from "@/components/I18nProvider";

/** DB mapping for consistent state logic */
const DB = {
  PENDING: "pending",
  CONFIRMED: "paid",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

type BookingPayload = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  partySize: number;
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
      activityName: string;
      capacity: number;
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

  const paid = slot.bookings
    .filter((b) => b.status === DB.CONFIRMED)
    .reduce((s, b) => s + b.partySize, 0);

  const freshPending = slot.bookings
    .filter((b) => {
      if (b.status !== DB.PENDING) return false;
      const mins = (Date.now() - new Date(b.createdAtISO).getTime()) / 60000;
      return mins < 30;
    })
    .reduce((s, b) => s + b.partySize, 0);

  const remaining = Math.max(0, slot.capacity - paid - freshPending);

  const fmtMoney = (cents: number | null | undefined) =>
    `${currency}${(((cents ?? 0) as number) / 100).toFixed(2)}`;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
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

          {/* Quick stats */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <StatPill label={t("admin.slot.statsCapacity")} value={slot.capacity} />
            <StatPill label={t("admin.slot.statsPaid")} value={paid} tone="emerald" />
            <StatPill
              label={t("admin.slot.statsPendingFresh")}
              value={freshPending}
              tone="amber"
            />
            <StatPill label={t("admin.slot.statsRemaining")} value={remaining} tone="pink" />
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

      {/* Add booking (admin) */}
      <section
        className="rounded-2xl border border-white/10 bg-[--card]/50 backdrop-blur-md p-5 shadow-[0_0_40px_-20px_rgba(255,99,189,0.25)]"
        style={{ ["--card" as any]: "rgba(20,20,30,.55)" }}
      >
        <h2 className="text-sm font-medium opacity-85 mb-4">
          {t("admin.slot.addTitle")}
        </h2>

        <form
          action={createAdminBooking}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <input type="hidden" name="slotId" value={slot.id} />

          {/* Customer name */}
          <div className="md:col-span-2">
            <label className="block text-sm opacity-80 mb-1" htmlFor="name">
              {t("admin.slot.customerName")}
            </label>
            <input
              id="name"
              name="name"
              required
              aria-label={t("admin.slot.aria.customerName")}
              className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50"
              placeholder={t("admin.slot.namePlaceholder")}
            />
          </div>

          {/* Customer email */}
          <div className="md:col-span-2">
            <label className="block text-sm opacity-80 mb-1" htmlFor="email">
              {t("admin.slot.customerEmail")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              aria-label={t("admin.slot.aria.customerEmail")}
              className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50"
              placeholder={t("admin.slot.emailPlaceholder")}
            />
          </div>

          {/* Party size */}
          <div>
            <label className="block text-sm opacity-80 mb-1" htmlFor="partySize">
              {t("admin.slot.partySize")}
            </label>
            <input
              id="partySize"
              name="partySize"
              type="number"
              min={1}
              max={slot.capacity}
              defaultValue={1}
              aria-label={t("admin.slot.aria.partySize")}
              className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.05] px-3 focus:outline-none focus:ring-1 focus:ring-pink-400/50"
            />
          </div>

          {/* Paid checkbox + button */}
          <div className="md:col-span-5 flex flex-wrap items-center gap-3">
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
              className="ml-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-[0_0_25px_-8px_rgba(255,99,189,0.5)] transition hover:scale-[1.02]"
            >
              {t("admin.slot.addBookingBtn")}
            </button>
          </div>
        </form>

        <p className="text-xs opacity-60 mt-3">{t("admin.slot.capNote")}</p>
      </section>

      {/* Bookings list */}
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

            // Behaviour rules
            const canCancel = isPending || isPaid; // once cancelled/refunded, false
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
                {/* Customer */}
                <div className="text-sm">
                  <div className="font-medium">{b.customerName ?? "—"}</div>
                  <div className="opacity-75">{b.customerEmail ?? "—"}</div>
                  <div className="text-xs opacity-60 break-all mt-1">
                    {t("admin.slot.meta.bookingId")}: {b.id}
                  </div>
                </div>

                {/* Meta */}
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
                    <b className="opacity-85">{t("admin.slot.meta.party")}:</b>{" "}
                    {b.partySize}
                  </div>
                  <div>
                    <b className="opacity-85">{t("admin.slot.meta.total")}:</b>{" "}
                    {fmtMoney(b.totalPrice)}
                  </div>
                  <div className="text-xs opacity-60 break-all">
                    <b className="opacity-85">{t("admin.slot.meta.pi")}:</b>{" "}
                    {b.payment.providerIntentId ?? "—"}
                  </div>
                </div>

                {/* Actions */}
                <div className="md:ml-auto w-full md:max-w-[320px]">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Open (single button, always shown) */}
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

                    {/* Cancel (disabled when cancelled or refunded) */}
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

                    {/* Refund (enabled only when paid, disabled after cancel/refund) */}
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

      {/* Keyframes */}
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

/* =========================
   UI helpers
   ========================= */

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