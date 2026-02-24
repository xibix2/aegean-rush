"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getT } from "@/components/I18nProvider";

type ActivityCard = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  durationMin: number | null;
  maxParty: number | null;
  basePrice: number | null; // cents
  coverImageUrl: string | null;
  locationId: string | null;
};

type TFn = (key: string) => string;

// Keep in sync with middleware RESERVED (only used as a safe fallback)
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

export default function ActivitiesClient({
  tenantSlug,
  lang,
  currency,
  date,
  activities,
}: {
  tenantSlug?: string;
  lang: string;
  currency: string; // single-glyph symbol from cookie
  date: string; // YYYY-MM-DD (tomorrow)
  activities: ActivityCard[];
}) {
  const [t, setT] = useState<TFn>(() => (key: string) => key);

  // ✅ Fallback tenant slug (only used if prop is missing)
  const [derivedTenantSlug, setDerivedTenantSlug] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    // If tenantSlug wasn't passed correctly, derive it from the URL after hydration.
    if (tenantSlug) return;

    try {
      const path = window.location.pathname || "";
      const segs = path.split("/").filter(Boolean);
      const first = segs[0];
      if (first && !RESERVED.has(first)) {
        setDerivedTenantSlug(first);
      }
    } catch {
      // ignore
    }
  }, [tenantSlug]);

  const effectiveTenantSlug = tenantSlug || derivedTenantSlug;

  // Build base from props only (SSR-stable) — with a safe client fallback
  const base = useMemo(
    () => (effectiveTenantSlug ? `/${effectiveTenantSlug}` : ""),
    [effectiveTenantSlug],
  );

  const tenantHref = (path: string) =>
    path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tt = await getT(lang);
        if (alive) setT(() => tt as TFn);
      } catch {
        // fallback is the identity translator
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes fadeUp {
  0% { opacity: 0; transform: translateY(8px) scale(0.995); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes shimmerAlt {
  0%   { background-position:   0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position:   0% 50%; }
}
.card-appear { animation: fadeUp .5s ease-out both; }
.card-appear + .card-appear { animation-delay: .05s; }
`.trim(),
        }}
      />

      {/* Header / hero section */}
      <section className="relative rounded-2xl overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          aria-hidden
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--accent-600), transparent 35%), color-mix(in oklab, var(--accent-500), transparent 40%), color-mix(in oklab, var(--accent-600), transparent 35%))",
            padding: "1px",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div
          className="relative rounded-[calc(theme(borderRadius.2xl)-1px)] px-5 sm:px-7 py-5"
          style={{
            background:
              "radial-gradient(800px 360px at 50% -10%, color-mix(in oklab, var(--accent-600), transparent 86%), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.04), color-mix(in oklab, var(--accent-600), transparent 92%) 40%, rgba(255,255,255,0.025) 100%)",
            boxShadow:
              "0 20px 60px -30px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)",
            backdropFilter: "saturate(120%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
            aria-hidden
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.28'/%3E%3Ccircle cx='20' cy='14' r='1' fill='%23ffffff' fill-opacity='0.23'/%3E%3Ccircle cx='12' cy='26' r='1' fill='%23ffffff' fill-opacity='0.2'/%3E%3Ccircle cx='30' cy='32' r='1' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--accent-400), white 10%) 0%, var(--accent-600) 70%)",
                    boxShadow:
                      "0 0 18px 2px color-mix(in oklab, var(--accent-500), transparent 45%)",
                  }}
                />
                <h1 className="text-xl sm:text-2xl font-semibold">
                  {t("activities.title")}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t("activities.subtitle")}
              </p>
            </div>

            {/* Back button — tenant aware (SSR-stable + safe fallback) */}
            <Link
              href={tenantHref("/")}
              title={t("activities.backTitle")}
              className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm border border-[--color-border] bg-white/5 backdrop-blur transition hover:scale-[1.02] focus:outline-none"
            >
              <span aria-hidden>←</span> {t("activities.back")}
            </Link>
          </div>
        </div>

        <div
          className="pointer-events-none absolute -bottom-4 left-12 right-12 h-8 rounded-full"
          aria-hidden
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--accent-500), transparent 80%), color-mix(in oklab, var(--accent-600), transparent 84%) 45%, transparent 70%)",
            filter: "blur(22px)",
          }}
        />
      </section>

      <div className="mt-10 md:mt-12" />

      {/* Empty state */}
      {activities.length === 0 && (
        <div className="rounded-xl border border-[--color-border] p-6 text-sm text-center">
          {t("activities.empty")}{" "}
          <Link href={tenantHref("/admin/activities")} className="underline">
            Admin → Activities
          </Link>
          .
        </div>
      )}

      {/* Activity cards */}
      <section className="grid grid-cols-1 gap-6">
        {activities.map((a, idx) => {
          const img = a.coverImageUrl ?? null;
          const price =
            typeof a.basePrice === "number"
              ? `${currency}${(a.basePrice / 100).toFixed(2)}`
              : undefined;

          return (
            <article
              key={a.id}
              className="card-appear relative overflow-hidden rounded-2xl border border-[--color-border] bg-[--color-card] transition duration-300 hover:-translate-y-0.5"
              style={{
                animationDelay: `${0.03 * idx}s`,
                boxShadow:
                  "0 16px 40px -20px color-mix(in oklab, var(--accent-500), transparent 72%)",
              }}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-[40%]">
                  <div className="relative h-52 w-full bg-[--color-muted]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={a.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs opacity-60">
                        {t("activities.preview")}
                      </div>
                    )}

                    {/* Price chip */}
                    {price && (
                      <span
                        className="absolute right-3 top-3 rounded-full px-2 py-1 text-[11px] font-medium text-white/90 backdrop-blur border border-white/10"
                        style={{
                          background:
                            "linear-gradient(90deg, color-mix(in oklab, var(--accent-600), transparent 36%), color-mix(in oklab, var(--accent-500), transparent 36%))",
                          boxShadow:
                            "0 8px 22px -12px color-mix(in oklab, var(--accent-500), transparent 55%), inset 0 0 0 1px rgba(255,255,255,.04)",
                        }}
                      >
                        {price}/hr
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="sm:w-[60%] p-5 pt-4">
                  <h2 className="text-lg font-semibold">{a.name}</h2>

                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span>
                      ⏱ {a.durationMin} {t("activities.minutes")}
                    </span>
                    <span>
                      🧍 {t("activities.spots")}: {a.maxParty}
                    </span>
                    <span>📍 {a.locationId ?? t("activities.club")}</span>
                  </div>

                  {a.description && (
                    <p className="mt-3 text-sm text-muted-foreground/90">
                      {a.description}
                    </p>
                  )}

                  <div className="mt-5">
                    <Link
                      href={`${tenantHref("/timetable")}?activityId=${a.id}&date=${date}&partySize=1`}
                      className="inline-flex h-11 items-center justify-center rounded-[12px] px-5 text-sm font-medium text-[--color-brand-foreground] bg-[linear-gradient(90deg,var(--accent-600),var(--accent-500),var(--accent-600))] bg-[length:200%_100%] transition-[transform,filter] duration-300 hover:scale-[1.02] will-change-transform"
                      style={{
                        animation:
                          "shimmerAlt 4.8s ease-in-out infinite" as any,
                      }}
                    >
                      {t("activities.select")}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}