"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getT } from "@/components/I18nProvider";

type ActivityDurationOption = {
  id: string;
  label: string | null;
  durationMin: number;
  priceCents: number;
};

type ActivityDetails = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  durationMin: number;
  minParty: number;
  maxParty: number;
  basePrice: number | null;
  requiresInstructor: boolean;
  locationId: string;
  coverImageUrl: string | null;
  mode: "FIXED_SEAT_EVENT" | "DYNAMIC_RENTAL" | "HYBRID_UNIT_BOOKING";
  meetingPoint: string | null;
  includedText: string | null;
  bringText: string | null;
  cancellationText: string | null;
  ageInfo: string | null;
  skillLevel: string | null;
  safetyInfo: string | null;
  pricingNotes: string | null;
  guestsPerUnit: number | null;
  maxUnitsPerBooking: number | null;
  slotIntervalMin: number | null;
  durationOptions: ActivityDurationOption[];
};

type TFn = (key: string) => string;

const RESERVED = new Set([
  "api",
  "clubs",
  "admin",
  "login",
  "forgot-password",
  "reset-password",
  "signup",
  "privacy",
  "terms",
  "contact",
  "timetable",
  "pricing",
  "about",
  "book",
  "export",
  "_next",
  "activities",
  "courts",
  "locations",
]);

function splitLines(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/\n|•|-/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatMoney(currency: string, cents: number | null | undefined) {
  if (typeof cents !== "number") return null;
  return `${currency}${(cents / 100).toFixed(2)}`;
}

export default function ActivityDetailsClient({
  tenantSlug,
  lang,
  currency,
  date,
  activity,
}: {
  tenantSlug?: string;
  lang: string;
  currency: string;
  date: string;
  activity: ActivityDetails;
}) {
  const [t, setT] = useState<TFn>(() => (key: string) => key);
  const [derivedTenantSlug, setDerivedTenantSlug] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (tenantSlug) return;

    try {
      const path = window.location.pathname || "";
      const segs = path.split("/").filter(Boolean);
      const first = segs[0];
      if (first && !RESERVED.has(first)) {
        setDerivedTenantSlug(first);
      }
    } catch {}
  }, [tenantSlug]);

  const effectiveTenantSlug = tenantSlug || derivedTenantSlug;

  const base = useMemo(
    () => (effectiveTenantSlug ? `/${effectiveTenantSlug}` : ""),
    [effectiveTenantSlug]
  );

  const tenantHref = (path: string) =>
    path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tt = await getT(lang);
        if (alive) setT(() => tt as TFn);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  const bookingHref = `${tenantHref("/timetable")}?activityId=${activity.id}&date=${date}&partySize=1`;
  const basePrice = formatMoney(currency, activity.basePrice);

  const includedItems = splitLines(activity.includedText);
  const bringItems = splitLines(activity.bringText);

  const overviewItems: string[] = [];

  if (activity.durationMin) {
    overviewItems.push(`${activity.durationMin} ${t("activities.minutes")}`);
  }

  if (activity.mode === "FIXED_SEAT_EVENT") {
    overviewItems.push(`${activity.minParty}-${activity.maxParty} guests`);
  }

  if (activity.mode === "DYNAMIC_RENTAL") {
    if (activity.maxUnitsPerBooking) {
      overviewItems.push(`Up to ${activity.maxUnitsPerBooking} units`);
    }
    if (activity.slotIntervalMin) {
      overviewItems.push(`${activity.slotIntervalMin} min interval`);
    }
  }

  if (activity.mode === "HYBRID_UNIT_BOOKING") {
    if (activity.guestsPerUnit) {
      overviewItems.push(`${activity.guestsPerUnit} guests / unit`);
    }
    if (activity.maxUnitsPerBooking) {
      overviewItems.push(`Up to ${activity.maxUnitsPerBooking} units`);
    }
  }

  if (activity.skillLevel) {
    overviewItems.push(activity.skillLevel);
  }

  if (activity.requiresInstructor) {
    overviewItems.push("Instructor guided");
  }

  const infoCards = [
    activity.meetingPoint
      ? { title: "Meeting point", body: activity.meetingPoint }
      : null,
    activity.ageInfo ? { title: "Age info", body: activity.ageInfo } : null,
    activity.safetyInfo ? { title: "Safety", body: activity.safetyInfo } : null,
    activity.cancellationText
      ? { title: "Cancellation", body: activity.cancellationText }
      : null,
    activity.pricingNotes
      ? { title: "Pricing notes", body: activity.pricingNotes }
      : null,
  ].filter(Boolean) as { title: string; body: string }[];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#070b16] shadow-[0_24px_80px_-45px_rgba(0,0,0,0.95)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[260px] sm:min-h-[340px]">
            {activity.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activity.coverImageUrl}
                alt={activity.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full min-h-[260px] place-items-center bg-white/[0.03] text-sm text-white/45 sm:min-h-[340px]">
                {t("activities.preview")}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/5" />

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Link
                href={tenantHref("/activities")}
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/12 bg-black/35 px-4 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-black/45"
              >
                ← Back
              </Link>

              <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/12 bg-black/35 px-4 text-sm text-white/75 backdrop-blur">
                {activity.mode === "FIXED_SEAT_EVENT"
                  ? "Experience"
                  : activity.mode === "DYNAMIC_RENTAL"
                  ? "Rental"
                  : "Hybrid"}
              </span>
            </div>
          </div>

          <div className="relative p-5 sm:p-6 lg:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.06),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.06),transparent_30%)]" />

            <div className="relative z-10">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {activity.name}
              </h1>

              {activity.description && (
                <p className="mt-3 text-sm leading-relaxed text-white/66 sm:text-[15px]">
                  {activity.description}
                </p>
              )}

              {overviewItems.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {overviewItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/78"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {activity.durationOptions.length > 0 ? (
                <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
                  <h2 className="text-sm font-semibold text-white">
                    Duration & pricing
                  </h2>

                  <div className="mt-3 space-y-2">
                    {activity.durationOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2.5"
                      >
                        <div>
                          <div className="text-sm font-medium text-white/88">
                            {opt.label || `${opt.durationMin} ${t("activities.minutes")}`}
                          </div>
                          <div className="text-xs text-white/45">
                            {opt.durationMin} {t("activities.minutes")}
                          </div>
                        </div>

                        <div className="text-sm font-semibold text-white">
                          {formatMoney(currency, opt.priceCents)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : basePrice ? (
                <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                    Starting from
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    {basePrice}
                  </div>
                </div>
              ) : null}

              {includedItems.length > 0 && (
                <div className="mt-5">
                  <h2 className="text-sm font-semibold text-white">What’s included</h2>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/64">
                    {includedItems.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bringItems.length > 0 && (
                <div className="mt-5">
                  <h2 className="text-sm font-semibold text-white">What to bring</h2>
                  <ul className="mt-2 space-y-1.5 text-sm text-white/64">
                    {bringItems.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Ready to book?
                  </p>
                  <p className="mt-1 text-xs text-white/48">
                    Check live availability and pick your time.
                  </p>
                </div>

                <Link
                  href={bookingHref}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-5 text-sm font-medium text-white shadow-[0_18px_50px_-18px_rgba(236,72,153,0.7)] transition hover:scale-[1.02]"
                >
                  {t("activities.select")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {infoCards.length > 0 && (
        <section className="mt-5 grid gap-3 md:grid-cols-2">
          {infoCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.25rem] border border-white/10 bg-[#070b16] p-4"
            >
              <h2 className="text-sm font-semibold text-white">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/64">
                {card.body}
              </p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}