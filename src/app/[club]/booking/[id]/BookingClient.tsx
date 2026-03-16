"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardSubtle } from "@/components/ui/Card";
import { useT } from "@/components/I18nProvider";

type BookingPayload =
  | null
  | {
      id: string;
      status: string;
      partySize: number;
      totalPrice: number; // cents
      timeSlot: {
        startAt: string; // ISO
        endAt: string | null; // ISO
        activity: { name: string };
      };
    };

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

  const start = new Date(booking.timeSlot.startAt);
  const end = booking.timeSlot.endAt
    ? new Date(booking.timeSlot.endAt)
    : new Date(start.getTime() + 90 * 60 * 1000);

  const rawStatus = booking.status.toLowerCase();
  const isPaidFromDb =
    rawStatus === "paid" ||
    rawStatus === "confirmed" ||
    rawStatus === "succeeded";
  const isPaidFromUrl = urlStatus === "success";
  const isCancelled = rawStatus === "cancelled" || urlStatus === "cancelled";
  const isPaid = !isCancelled && (isPaidFromDb || isPaidFromUrl);

  const statusLabel = (() => {
    if (isPaid) return t("booking.paid") ?? "Paid";
    if (isCancelled) return t("booking.cancelled") ?? "Cancelled";
    if (rawStatus === "pending") return t("booking.pending") ?? "Pending";
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
          {format(start, "PPPP p")} – {format(end, "p")}
        </CardSubtle>

        <CardSubtle className="text-lg">
          <b>{t("booking.guests") ?? "Guests"}:</b> {booking.partySize}
        </CardSubtle>

        <CardSubtle className="text-lg">
          <b>{t("booking.total")}:</b>{" "}
          <span className="font-semibold">
            {currencyGlyph}
            {(booking.totalPrice / 100).toFixed(2)}
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