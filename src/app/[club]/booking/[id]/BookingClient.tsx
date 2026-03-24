"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardSubtle } from "@/components/ui/Card";
import { useT } from "@/components/I18nProvider";

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type BookingPayload =
  | null
  | {
      id: string;
      status: string;
      partySize: number;
      totalPrice: number;

      reservedUnits: number;
      bookingStartAt: string;
      bookingEndAt: string;
      durationMinSnapshot: number | null;
      unitPriceSnapshot: number | null;
      pricingLabelSnapshot: string | null;

      timeSlot: {
        startAt: string;
        endAt: string | null;
        activity: {
          name: string;
          mode: ActivityMode;
        };
      };
    };

function formatMoney(cents: number, currencyGlyph: string) {
  return `${currencyGlyph}${(cents / 100).toFixed(2)}`;
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

  if (!booking) {
    return (
      <main className="py-24 text-center">
        <h1 className="text-3xl font-semibold mb-3">
          {t("booking.notFoundTitle")}
        </h1>
        <p className="opacity-70 text-base">{t("booking.notFoundText")}</p>
        <div className="mt-8">
          <Link href={`/${tenantSlug}`}>
            <Button
              size="lg"
              variant="primary"
              className="relative inline-flex h-12 items-center rounded-[12px] px-6 text-[--color-brand-foreground]
                         bg-[linear-gradient(90deg,var(--accent-600),var(--accent-500),var(--accent-600))] bg-[length:200%_100%]
                         shadow-[0_16px_40px_-20px_color-mix(in_oklab,var(--accent-500),transparent_65%)]
                         hover:scale-[1.02] transition"
              style={{ animation: "shimmerAlt 5.5s ease-in-out infinite" } as any}
            >
              {t("booking.returnHome")}
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const mode = booking.timeSlot.activity.mode;

  const actualStart = new Date(booking.bookingStartAt);
  const actualEnd = new Date(booking.bookingEndAt);

  const rawStatus = booking.status.toLowerCase();

  const isDbPaid =
    rawStatus === "paid" ||
    rawStatus === "confirmed" ||
    rawStatus === "succeeded";

  const isDbCancelled =
    rawStatus === "cancelled" || rawStatus === "canceled";

  const isPending = rawStatus === "pending";
  const isUrlSuccess = urlStatus === "success";
  const isUrlCancelled = urlStatus === "cancelled";

  // If Stripe redirects back with success but webhook hasn't updated yet,
  // refresh the server component a few times instead of showing cancelled.
  useEffect(() => {
    if (!(isUrlSuccess && isPending)) return;

    let attempts = 0;
    const maxAttempts = 8;

    const timer = setInterval(() => {
      attempts += 1;
      router.refresh();

      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [isUrlSuccess, isPending, router]);

  // DB status is the source of truth.
  const isPaid = isDbPaid;
  const isCancelled = isDbCancelled || (isUrlCancelled && !isDbPaid);

  const statusLabel = (() => {
    if (isPaid) return t("booking.paid") ?? "Paid";
    if (isCancelled) return t("booking.cancelled") ?? "Cancelled";
    if (isPending && isUrlSuccess) {
      return t("booking.processing") ?? "Processing";
    }
    if (isPending) return t("booking.pending") ?? "Pending";
    return booking.status;
  })();

  let title: string;
  let descriptionLines: string[];

  if (isPaid) {
    title = t("booking.thankYou");
    descriptionLines = [
      t("booking.success1"),
      `${t("booking.success2")} ${t("booking.confirmed")}.`,
      t("booking.success3"),
    ];
  } else if (isCancelled) {
    title = t("booking.cancelledTitle") ?? "Booking cancelled";
    descriptionLines = [
      t("booking.cancelled1") ?? "Your booking was cancelled.",
      t("booking.cancelled2") ??
        "If you think this is a mistake, please try again or contact the business.",
    ];
  } else {
    title = t("booking.processing");
    descriptionLines = [
      t("booking.pending1"),
      t("booking.pending2"),
      t("booking.pending3"),
    ];
  }

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

  return (
    <main className="mx-auto max-w-3xl px-6 py-28 flex flex-col items-center text-center relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--accent-500),transparent_88%),transparent_70%)]" />

      <div
        className={`relative mb-8 flex items-center justify-center rounded-full size-28 ${
          isPaid
            ? "bg-emerald-500/10 text-emerald-400"
            : isCancelled
            ? "bg-red-500/10 text-red-400"
            : "bg-amber-400/10 text-amber-400"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="-1 4.5 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`size-14 ${
            isPaid ? "animate-[pulse_2s_ease-in-out_infinite]" : ""
          }`}
        >
          {isPaid ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          ) : isCancelled ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 6.75l10.5 10.5M17.25 6.75l-10.5 10.5"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m-3-7a9 9 0 100 18 9 9 0 000-18z"
            />
          )}
        </svg>
      </div>

      <div className="relative mb-2">
        <h1 className="text-4xl font-semibold">{title}</h1>
        <div
          className="absolute left-1/2 -bottom-2 h-[3px] w-40 -translate-x-1/2 rounded-full
                     bg-gradient-to-r from-transparent via-[var(--accent-400)] to-transparent
                     animate-[pulse_7s_ease-in-out_infinite]"
        />
      </div>

      <div className="text-base opacity-85 mt-5 mb-8 max-w-lg leading-relaxed space-y-1.5">
        {descriptionLines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>

      <div className="mb-10 text-lg font-medium opacity-75">
        {t("booking.status")}:{" "}
        <span
          className={
            isPaid
              ? "text-emerald-400 font-semibold"
              : isCancelled
              ? "text-red-400 font-semibold"
              : "text-amber-300 font-semibold"
          }
        >
          {statusLabel}
        </span>
      </div>

      <Card
        className="
          relative w-full max-w-2xl text-left space-y-4 p-8 shadow-lg rounded-2xl overflow-hidden
          border border-transparent
          [background:
            linear-gradient(var(--color-card),var(--color-card))_padding-box,
            linear-gradient(90deg,
              color-mix(in_oklab,var(--accent-300),transparent_65%),
              color-mix(in_oklab,var(--accent-400),transparent_70%),
              color-mix(in_oklab,var(--accent-300),transparent_65%)
            )_border-box
          ]
        "
      >
        <CardTitle className="text-2xl">{t("booking.summary")}</CardTitle>

        <CardSubtle className="text-lg">
          <b>{t("booking.activity")}:</b>{" "}
          <span
            className="font-medium"
            style={{
              color: "color-mix(in oklab, var(--accent-400), white 15%)",
              textShadow:
                "0 0 8px color-mix(in oklab, var(--accent-500), transparent 80%), 0 0 16px color-mix(in oklab, var(--accent-600), transparent 85%)",
            }}
          >
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
      </Card>

      <div className="mt-10">
        <Link href={`/${tenantSlug}`}>
          <Button
            size="lg"
            variant="primary"
            className="relative inline-flex h-14 items-center rounded-[12px] px-8 text-lg font-medium
                       text-[--color-brand-foreground]
                       bg-[linear-gradient(90deg,var(--accent-600),var(--accent-500),var(--accent-600))] bg-[length:200%_100%]
                       shadow-[0_18px_48px_-20px_color-mix(in_oklab,var(--accent-500),transparent_65%)]
                       hover:scale-[1.02] transition"
            style={{ animation: "shimmerAlt 5.5s ease-in-out infinite" } as any}
          >
            {t("booking.returnHome")}
          </Button>
        </Link>
      </div>
    </main>
  );
}