"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Home,
  Mail,
  RefreshCcw,
  Waves,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardSubtle } from "@/components/ui/Card";
import { useT } from "@/components/I18nProvider";
import { cancelBookingAction } from "./actions";

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type BookingPayload =
  | null
  | {
      id: string;
      publicToken: string;
      status: string;
      partySize: number;
      totalPrice: number;
      reservedUnits: number;
      bookingStartAt: string;
      bookingEndAt: string;
      durationMinSnapshot: number | null;
      unitPriceSnapshot: number | null;
      pricingLabelSnapshot: string | null;
      cancelledAt: string | null;
      canCancel: boolean;
      timeSlot: {
        startAt: string;
        endAt: string | null;
        activity: {
          name: string;
          mode: ActivityMode;
        };
      };
    };

type CancelActionState = {
  ok: boolean;
  error: string | null;
};

const initialCancelState: CancelActionState = {
  ok: false,
  error: null,
};

function formatMoney(cents: number, currencyGlyph: string) {
  return `${currencyGlyph}${(cents / 100).toFixed(2)}`;
}

function CancelSubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-5 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Processing..." : "Cancel / refund booking"}
    </button>
  );
}

function StatusIcon({
  isPaid,
  isCancelled,
}: {
  isPaid: boolean;
  isCancelled: boolean;
}) {
  if (isPaid) return <CheckCircle2 className="size-16" />;
  if (isCancelled) return <XCircle className="size-16" />;
  return <Clock3 className="size-16" />;
}

export default function BookingClient({
  tenantSlug,
  currencyGlyph,
  booking,
}: {
  tenantSlug: string;
  currencyGlyph: string;
  booking: BookingPayload;
}) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStatus = (searchParams.get("status") || "").toLowerCase();

  const [cancelState, cancelFormAction] = useFormState(
    cancelBookingAction,
    initialCancelState
  );

  const rawStatus = booking?.status.toLowerCase() ?? "";

  const isDbPaid =
    rawStatus === "paid" ||
    rawStatus === "confirmed" ||
    rawStatus === "succeeded";

  const isDbCancelled = rawStatus === "cancelled" || rawStatus === "canceled";
  const isPending = rawStatus === "pending";
  const isUrlSuccess = urlStatus === "success";
  const isUrlCancelled = urlStatus === "cancelled";

  const isPaid = isDbPaid;
  const isCancelled = isDbCancelled || (isUrlCancelled && !isDbPaid);
  const isUnpaid = !isPaid;

  useEffect(() => {
    if (cancelState.ok) router.refresh();
  }, [cancelState.ok, router]);

  useEffect(() => {
    if (!(isUrlSuccess && isPending)) return;

    let attempts = 0;
    const maxAttempts = 8;

    const timer = setInterval(() => {
      attempts += 1;
      router.refresh();

      if (attempts >= maxAttempts) clearInterval(timer);
    }, 1500);

    return () => clearInterval(timer);
  }, [isUrlSuccess, isPending, router]);

  if (!booking) {
    return (
      <main className="relative mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.16),transparent_65%)]" />

        <div className="mb-8 flex size-28 items-center justify-center rounded-full border border-red-300/20 bg-red-500/10 text-red-300 shadow-[0_0_60px_rgba(248,113,113,0.12)]">
          <HelpCircle className="size-14" />
        </div>

        <h1 className="text-4xl font-semibold text-white">Booking not found</h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/68">
          We couldn’t find this booking. If you just completed payment or think
          something went wrong, contact us and we’ll help you immediately.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/${tenantSlug}/contact`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 text-sm font-medium text-white shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
          >
            <Mail className="size-4" />
            Contact us
          </Link>

          <Link
            href={`/${tenantSlug}/activities`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white/88 transition hover:bg-white/[0.08]"
          >
            <Waves className="size-4 text-sky-300" />
            Back to activities
          </Link>
        </div>
      </main>
    );
  }

  const mode = booking.timeSlot.activity.mode;
  const actualStart = new Date(booking.bookingStartAt);
  const actualEnd = new Date(booking.bookingEndAt);

  const statusLabel = (() => {
    if (isPaid) return t("booking.paid") ?? "Paid";
    if (isCancelled) return "Payment not completed";
    if (isPending && isUrlSuccess) return "Checking payment";
    if (isPending) return "Payment pending";
    return booking.status;
  })();

  const title = isPaid
    ? t("booking.thankYou")
    : isCancelled
    ? "Payment not completed"
    : "Payment not confirmed yet";

  const descriptionLines = isPaid
    ? [
        t("booking.success1"),
        `${t("booking.success2")} ${t("booking.confirmed")}.`,
        t("booking.success3"),
      ]
    : isCancelled
    ? [
        "Your booking is NOT confirmed.",
        "No successful payment was received for this booking attempt.",
        "Please book again or contact us if you believe money was taken.",
      ]
    : [
        "Your booking is NOT confirmed yet.",
        "We are still waiting for payment confirmation.",
        "Do not come to the activity unless you receive a confirmation email.",
      ];

  const bookingTypeLabel =
    mode === "FIXED_SEAT_EVENT"
      ? t("booking.guests") ?? "Guests"
      : mode === "DYNAMIC_RENTAL"
      ? "Units"
      : "Guests / Units";

  const bookingTypeValue =
    mode === "FIXED_SEAT_EVENT"
      ? `${booking.partySize}`
      : mode === "DYNAMIC_RENTAL"
      ? `${booking.reservedUnits}`
      : `${booking.partySize} / ${booking.reservedUnits}`;

  const unitPriceText =
    typeof booking.unitPriceSnapshot === "number"
      ? formatMoney(booking.unitPriceSnapshot, currencyGlyph)
      : null;

  const durationText =
    booking.pricingLabelSnapshot ||
    (booking.durationMinSnapshot ? `${booking.durationMinSnapshot} min` : null);

  const iconTone = isPaid
    ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_70px_rgba(16,185,129,0.14)]"
    : isCancelled
    ? "border-red-300/20 bg-red-500/10 text-red-300 shadow-[0_0_70px_rgba(248,113,113,0.14)]"
    : "border-amber-300/20 bg-amber-400/10 text-amber-300 shadow-[0_0_70px_rgba(251,191,36,0.12)]";

  return (
    <main className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
      <div
        className={`absolute inset-0 -z-10 ${
          isPaid
            ? "bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_68%)]"
            : isCancelled
            ? "bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.18),transparent_68%)]"
            : "bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_68%)]"
        }`}
      />

      <div className="pointer-events-none absolute top-12 h-64 w-64 rounded-full bg-white/[0.03] blur-3xl" />

      <div
        className={`relative mb-8 flex size-28 items-center justify-center rounded-full border ${iconTone}`}
      >
        <StatusIcon isPaid={isPaid} isCancelled={isCancelled} />
      </div>

      <div className="relative mb-2">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <div
          className={`absolute left-1/2 -bottom-3 h-[3px] w-44 -translate-x-1/2 rounded-full ${
            isPaid
              ? "bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
              : isCancelled
              ? "bg-gradient-to-r from-transparent via-red-300 to-transparent"
              : "bg-gradient-to-r from-transparent via-amber-300 to-transparent"
          }`}
        />
      </div>

      <div className="mb-8 mt-6 max-w-xl space-y-1.5 text-base leading-relaxed text-white/75">
        {descriptionLines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      {isUnpaid && (
        <div className="mb-8 w-full max-w-2xl rounded-[2rem] border border-red-400/25 bg-red-500/[0.09] p-5 text-center shadow-[0_24px_80px_-50px_rgba(248,113,113,0.45)] sm:p-6">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-red-300/20 bg-red-500/15 text-red-200">
            <AlertTriangle className="size-7" />
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight text-red-200">
            Booking NOT confirmed
          </h2>

          <p className="mt-3 text-base font-medium text-white">
            This activity is not reserved yet.
          </p>

          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Only bookings with successful payment and a confirmation email are
            valid. If you did not receive a confirmation email, please book
            again or contact us.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Link
              href={`/${tenantSlug}/activities`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-4 text-sm font-medium text-white shadow-[0_18px_50px_-18px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
            >
              <RefreshCcw className="size-4" />
              Book again
            </Link>

            <Link
              href={`/${tenantSlug}/contact`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-sm font-medium text-white/88 transition hover:bg-white/[0.1]"
            >
              <Mail className="size-4 text-sky-300" />
              Contact us
            </Link>

            <Link
              href={`/${tenantSlug}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-sm font-medium text-white/78 transition hover:bg-white/[0.08]"
            >
              <Home className="size-4 text-white/70" />
              Home
            </Link>
          </div>

          <p className="mt-4 text-xs text-white/45">
            Booking attempt code:{" "}
            <span className="font-medium text-white/75">
              {booking.publicToken}
            </span>
          </p>
        </div>
      )}

      <div className="mb-6 text-lg font-medium text-white/75">
        {t("booking.status")}:{" "}
        <span
          className={
            isPaid
              ? "font-semibold text-emerald-300"
              : isCancelled
              ? "font-semibold text-red-300"
              : "font-semibold text-amber-300"
          }
        >
          {statusLabel}
        </span>
      </div>

      {isPaid ? (
        <>
          <div className="mb-10 max-w-2xl rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
            You are viewing your confirmed booking details. Online cancellation
            is only available at least 48 hours before the booking start time.
          </div>

          <Card className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-transparent p-6 text-left shadow-lg sm:p-8 [background:linear-gradient(var(--color-card),var(--color-card))_padding-box,linear-gradient(90deg,color-mix(in_oklab,var(--accent-300),transparent_65%),color-mix(in_oklab,var(--accent-400),transparent_70%),color-mix(in_oklab,var(--accent-300),transparent_65%))_border-box]">
            <CardTitle className="text-2xl">{t("booking.summary")}</CardTitle>

            <div className="mt-4 space-y-4">
              <CardSubtle className="text-lg">
                <b>{t("booking.activity")}:</b>{" "}
                <span className="font-medium text-white">
                  {booking.timeSlot.activity.name}
                </span>
              </CardSubtle>

              <CardSubtle className="text-lg">
                <b>{t("booking.date")}:</b>{" "}
                {format(actualStart, "PPPP p")} – {format(actualEnd, "p")}
              </CardSubtle>

              {durationText && mode !== "FIXED_SEAT_EVENT" && (
                <CardSubtle className="text-lg">
                  <b>Duration:</b> {durationText}
                </CardSubtle>
              )}

              <CardSubtle className="text-lg">
                <b>{bookingTypeLabel}:</b> {bookingTypeValue}
              </CardSubtle>

              {unitPriceText && mode !== "FIXED_SEAT_EVENT" && (
                <CardSubtle className="text-lg">
                  <b>Unit price:</b> {unitPriceText}
                </CardSubtle>
              )}

              <CardSubtle className="text-lg">
                <b>{t("booking.total")}:</b>{" "}
                <span className="font-semibold">
                  {formatMoney(booking.totalPrice, currencyGlyph)}
                </span>
              </CardSubtle>
            </div>
          </Card>
        </>
      ) : (
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left">
          <h3 className="text-base font-semibold text-white">
            Attempt details
          </h3>

          <div className="mt-3 space-y-2 text-sm text-white/62">
            <p>
              <span className="text-white/85">Activity:</span>{" "}
              {booking.timeSlot.activity.name}
            </p>
            <p>
              <span className="text-white/85">Selected time:</span>{" "}
              {format(actualStart, "PPPP p")} – {format(actualEnd, "p")}
            </p>
            <p>
              <span className="text-white/85">Status:</span> Not confirmed
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 w-full max-w-2xl">
        {cancelState.error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {cancelState.error}
          </div>
        ) : null}

        {cancelState.ok ? (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Your booking has been updated successfully.
          </div>
        ) : null}

        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {booking.canCancel && isPaid ? (
            <form action={cancelFormAction}>
              <input type="hidden" name="club" value={tenantSlug} />
              <input type="hidden" name="token" value={booking.publicToken} />
              <CancelSubmitButton />
            </form>
          ) : null}

          {isPaid && (
            <Link href={`/${tenantSlug}`}>
              <Button
                size="lg"
                variant="primary"
                className="relative inline-flex h-14 items-center rounded-[12px] px-8 text-lg font-medium text-[--color-brand-foreground] bg-[linear-gradient(90deg,var(--accent-600),var(--accent-500),var(--accent-600))] bg-[length:200%_100%] shadow-[0_18px_48px_-20px_color-mix(in_oklab,var(--accent-500),transparent_65%)] hover:scale-[1.02] transition"
                style={
                  { animation: "shimmerAlt 5.5s ease-in-out infinite" } as any
                }
              >
                {t("booking.returnHome")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}