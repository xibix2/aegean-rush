//components/ui/ActivityCarousel
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Plus, Clock, Users, MapPin } from "lucide-react";
import { formatMoneyCentsClient } from "@/lib/money-client";
import { getT } from "@/components/I18nProvider";

type Activity = {
  id: string;
  name: string;
  description?: string | null;
  basePrice?: number | null;
  coverImageUrl?: string | null;
  slug?: string | null;
  durationMin?: number | null;
  maxParty?: number | null;
  locationId?: string | null;
};

type TFn = (key: string) => string;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const GAP_PX = 24;

function detectTenantBase(): string {
  if (typeof window === "undefined") return "";
  const seg = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  const RESERVED = new Set(["api", "privacy", "terms", "contact"]);
  return seg && !RESERVED.has(seg) ? `/${seg}` : "";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function ActivityCarousel({
  activities,
  lang: langProp,
  basePrefix,
}: {
  activities: Activity[];
  lang?: string;
  basePrefix?: string;
}) {
  const [t, setT] = useState<TFn>(() => (k: string) => k);

  const detected = useMemo(() => detectTenantBase(), []);
  const tenantBase = basePrefix ?? detected;

  useEffect(() => {
    let alive = true;
    const cookieLang = getCookie("ui_lang") || "en";
    const lang = langProp || cookieLang;
    (async () => {
      try {
        const tt = await getT(lang);
        if (alive) setT(() => tt as TFn);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [langProp]);

  const base = Array.isArray(activities) ? activities : [];

  const data = useMemo<Activity[]>(
    () => [
      {
        id: "__NEW__",
        name: t("carousel.new"),
        description: t("carousel.new.desc"),
        basePrice: null,
        coverImageUrl: null,
        slug: null,
      },
      ...base,
    ],
    [base, t]
  );

  if (data.length === 0) return null;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  cardRefs.current = new Array(data.length).fill(null);
  imgRefs.current = new Array(data.length).fill(null);

  const [cardW, setCardW] = useState<number>(320);
  const [viewportW, setViewportW] = useState<number>(0);
  const [index, setIndex] = useState<number>(data.length > 1 ? 1 : 0);
  const [anim, setAnim] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      setViewportW(viewportRef.current?.clientWidth ?? 0);
      const anyCard = cardRefs.current.find(Boolean);
      if (anyCard) {
        const w = (anyCard as HTMLElement).clientWidth;
        if (w) setCardW(w);
      }
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    cardRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [data.length]);

  const unit = cardW + GAP_PX;
  const translateX = useMemo(() => {
    const trackOffset = index * unit;
    const centerOffset = trackOffset + cardW / 2;
    const viewportCenter = viewportW / 2;
    return viewportCenter - centerOffset;
  }, [cardW, viewportW, index, unit]);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    node.style.transition = anim ? `transform 480ms ${EASE}` : "none";
    node.style.transform = `translate3d(${translateX}px, 0, 0)`;
  }, [translateX, anim]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        setAnim(true);
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        setAnim(true);
        setIndex((i) => Math.min(data.length - 1, i + 1));
      }
    },
    [data.length]
  );

  const goPrev = () => {
    setAnim(true);
    setIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    setAnim(true);
    setIndex((i) => Math.min(data.length - 1, i + 1));
  };

  const isActive = (i: number) => i === index;
  const atStart = index === 0;
  const atEnd = index === data.length - 1;

  const getCardZIndex = (i: number) => {
    if (hoverIndex === i) return 40;
    if (index === i) return 30;
    return 10;
  };

  return (
    <div className="relative mx-auto max-w-6xl" role="region" aria-label={t("carousel.aria")}>
      {!atStart && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[--color-background] to-transparent rounded-l-2xl z-10" />
      )}
      {!atEnd && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[--color-background] to-transparent rounded-r-2xl z-10" />
      )}

      <div
        ref={viewportRef}
        className="overflow-x-hidden overflow-y-visible px-2 md:px-4 py-8 md:py-10 focus:outline-none"
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ ["--card-w" as any]: "clamp(260px, 28vw, 340px)" } as React.CSSProperties}
      >
        <div
          ref={trackRef}
          className="flex items-stretch will-change-transform transform-gpu"
          style={{
            gap: `${GAP_PX}px`,
            transition: anim ? `transform 480ms ${EASE}` : "none",
            transform: `translate3d(${translateX}px, 0, 0)`,
          }}
        >
          {data.map((a, i) => {
            const isNew = a.id === "__NEW__";
            const price =
              !isNew && typeof a.basePrice === "number"
                ? `${formatMoneyCentsClient(a.basePrice)}`
                : undefined;
            const img = a.coverImageUrl ?? null;
            const active = isActive(i);

            return (
              <div
                key={`${a.id}-${i}`}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex((curr) => (curr === i ? null : curr))}
                className={[
                  "relative w-[var(--card-w)] flex-shrink-0 transition-all duration-500 transform-gpu",
                  active ? "scale-[1.065] -translate-y-1" : "scale-[0.965] opacity-90",
                ].join(" ")}
                style={{
                  backfaceVisibility: "hidden",
                  zIndex: getCardZIndex(i),
                }}
              >
                {isNew ? (
                  <Link
                    prefetch={false}
                    href={`${tenantBase}/admin/activities/new`}
                    className="block h-full rounded-3xl border border-white/15 bg-[--color-card]/60 overflow-hidden relative group"
                    title={t("carousel.new")}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `
                          linear-gradient(
                            135deg,
                            color-mix(in oklab, var(--accent-500), black 55%),
                            color-mix(in oklab, var(--accent-600), black 70%)
                          ),
                          radial-gradient(70% 120% at 50% -10%, color-mix(in oklab, var(--accent-500), transparent 88%), transparent 70%),
                          radial-gradient(60% 120% at 0% 100%,  color-mix(in oklab, var(--accent-600), transparent 90%), transparent 70%),
                          radial-gradient(60% 120% at 100% 100%, color-mix(in oklab, var(--accent-600), transparent 90%), transparent 70%)
                        `,
                      }}
                    />
                    <div
                      className="absolute inset-0 mix-blend-overlay opacity-[0.06]"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.35'/%3E%3Ccircle cx='20' cy='14' r='1' fill='%23ffffff' fill-opacity='0.3'/%3E%3Ccircle cx='12' cy='26' r='1' fill='%23ffffff' fill-opacity='0.28'/%3E%3Ccircle cx='30' cy='32' r='1' fill='%23ffffff' fill-opacity='0.28'/%3E%3C/svg%3E\")",
                      }}
                    />

                    <div className="relative flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                        <Plus className="h-9 w-9 opacity-90" />
                      </div>
                      <div className="text-[1.3rem] font-semibold leading-tight">
                        {t("carousel.new")}
                      </div>
                      <div className="mt-2 text-[0.95rem] opacity-75 max-w-[260px]">
                        {t("carousel.new.desc")}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    prefetch={false}
                    href={`${tenantBase}/admin/activities/${a.id}`}
                    className="block h-full rounded-2xl border border-[--color-border] overflow-hidden bg-[--color-card] group"
                    title={`${t("carousel.edit")} ${a.name}`}
                  >
                    <div className="relative h-44 w-full bg-[--color-muted] overflow-hidden">
                      {img ? (
                        <img
                          ref={(el) => {
                            imgRefs.current[i] = el;
                          }}
                          src={img}
                          alt={a.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-sm opacity-60">
                          {t("carousel.preview")}
                        </div>
                      )}
                      {active && (
                        <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]" />
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold leading-tight line-clamp-1">
                          {a.name}
                        </h3>
                        {typeof price === "string" && (
                          <span className="text-sm opacity-70 whitespace-nowrap">
                            {price}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] opacity-85">
                        {typeof a.durationMin === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 opacity-80" />
                            {a.durationMin} {t("carousel.min")}
                          </span>
                        )}
                        {typeof a.maxParty === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 opacity-80" />
                            {a.maxParty} {t("carousel.spots")}
                          </span>
                        )}
                        {(a.locationId || a.slug) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 opacity-80" />
                            {a.locationId || a.slug}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {data.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={atStart}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full p-2 backdrop-blur-md
              ${atStart ? "bg-black/20 text-white/50 cursor-not-allowed" : "bg-black/40 text-white hover:bg-black/55"}`}
            aria-label={t("carousel.prev")}
            title={t("carousel.prev")}
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={atEnd}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full p-2 backdrop-blur-md
              ${atEnd ? "bg-black/20 text-white/50 cursor-not-allowed" : "bg-black/40 text-white hover:bg-black/55"}`}
            aria-label={t("carousel.next")}
            title={t("carousel.next")}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}