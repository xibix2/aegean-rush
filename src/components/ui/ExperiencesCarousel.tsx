"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Waves,
  CircleDot,
} from "lucide-react";
import { formatMoneyCentsClient } from "@/lib/money-client";
import { useT } from "@/components/I18nProvider";

type ActivityMode =
  | "FIXED_SEAT_EVENT"
  | "DYNAMIC_RENTAL"
  | "HYBRID_UNIT_BOOKING";

type Court = {
  id: string;
  name: string;
  description?: string | null;
  basePrice?: number | null;
  mode?: ActivityMode | null;
  durationMin?: number | null;
  locationId?: string | null;
  coverImageUrl?: string | null;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const GAP_PX = 18;

function getPriceLabel(c: Court) {
  if (typeof c.basePrice !== "number") return null;

  const amount = formatMoneyCentsClient(c.basePrice);

  if (c.mode === "DYNAMIC_RENTAL") return `${amount}/hr`;
  if (c.mode === "FIXED_SEAT_EVENT") return `${amount} per person`;
  if (c.mode === "HYBRID_UNIT_BOOKING") {
    if (c.durationMin) return `${amount} / ${c.durationMin} min`;
    return `${amount} from`;
  }

  return amount;
}

function getBadgeLabel(mode?: ActivityMode | null) {
  if (mode === "DYNAMIC_RENTAL") return "Rental";
  if (mode === "FIXED_SEAT_EVENT") return "Excursion";
  if (mode === "HYBRID_UNIT_BOOKING") return "Flexible";
  return "Experience";
}

export default function CourtsCarousel({
  courts,
  tomorrow,
  tenantSlug,
}: {
  courts: Court[];
  tomorrow: string;
  tenantSlug?: string;
}) {
  const t = useT();
  if (!courts?.length) return null;

  const tenantBase = tenantSlug ? `/${tenantSlug}` : "";

  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  cardRefs.current = new Array(courts.length).fill(null);
  imgRefs.current = new Array(courts.length).fill(null);

  const [cardW, setCardW] = useState(300);
  const [viewportW, setViewportW] = useState(0);
  const [index, setIndex] = useState(Math.floor(courts.length / 2));
  const [anim, setAnim] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      setViewportW(viewportRef.current?.clientWidth ?? 0);
      const anyCard = cardRefs.current.find(Boolean);
      if (anyCard) setCardW(anyCard.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    cardRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [courts.length]);

  const translateX = useMemo(() => {
    const unit = cardW + GAP_PX;
    const trackOffset = index * unit;
    const centerOffset = trackOffset + cardW / 2;
    const viewportCenter = viewportW / 2;
    return viewportCenter - centerOffset;
  }, [cardW, viewportW, index]);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    node.style.transition = anim ? `transform 650ms ${EASE}` : "none";
    node.style.transform = `translate3d(${translateX}px,0,0)`;
  }, [translateX, anim]);

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(courts.length - 1, i + 1));

  const isActive = (i: number) => i === index;
  const atStart = index === 0;
  const atEnd = index === courts.length - 1;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
  };

  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStartX(e.touches[0].clientX);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) delta > 0 ? goPrev() : goNext();
    setTouchStartX(null);
  };

  const onCardMouseMove =
    (i: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      const img = imgRefs.current[i];
      if (!img) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const percentX = (x / rect.width) * 2 - 1;
      const percentY = (y / rect.height) * 2 - 1;

      const dx = Math.max(-4, Math.min(4, percentX * 4));
      const dy = Math.max(-4, Math.min(4, percentY * 4));

      img.style.transform = `scale(1.04) translate(${dx}px, ${dy}px)`;
    };

  const onCardMouseLeave = (i: number) => () => {
    const img = imgRefs.current[i];
    if (img) img.style.transform = "scale(1) translate(0,0)";
  };

  return (
    <div
      className="relative mx-auto max-w-6xl select-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {!atStart && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#060a14] via-[#060a14]/80 to-transparent" />
      )}
      {!atEnd && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#060a14] via-[#060a14]/80 to-transparent" />
      )}

      <div
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden px-2 py-4 sm:px-4 md:px-6 md:py-6"
        style={
          { ["--card-w" as any]: "clamp(240px, 26vw, 310px)" } as React.CSSProperties
        }
      >
        <div
          ref={trackRef}
          className="flex items-stretch will-change-transform transform-gpu"
          style={{
            gap: `${GAP_PX}px`,
            transition: anim ? `transform 650ms ${EASE}` : "none",
            transform: `translate3d(${translateX}px,0,0)`,
          }}
        >
          {courts.map((c, i) => {
            const active = isActive(i);
            const priceLabel = getPriceLabel(c);
            const img = c.coverImageUrl ?? null;

            return (
              <div
                key={c.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onMouseMove={onCardMouseMove(i)}
                onMouseLeave={onCardMouseLeave(i)}
                className={[
                  "group relative w-[var(--card-w)] flex-shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl transition-all duration-500 transform-gpu",
                  active
                    ? "scale-[1.02] -translate-y-1 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.8)]"
                    : "scale-[0.95] opacity-75",
                ].join(" ")}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                  {img ? (
                    <>
                      <img
                        ref={(el) => {
                          imgRefs.current[i] = el;
                        }}
                        src={img}
                        alt={c.name}
                        className="h-full w-full object-cover transition-transform duration-500 will-change-transform"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                    </>
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[linear-gradient(180deg,#0b1324,#08101d)] text-sm text-white/60">
                      Activity preview
                    </div>
                  )}

                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-black/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
                      <Waves className="size-3 text-cyan-300" />
                      {getBadgeLabel(c.mode)}
                    </span>
                  </div>

                  {priceLabel && (
                    <div className="absolute right-3 top-3">
                      <div className="rounded-full border border-pink-300/20 bg-black/35 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md">
                        {priceLabel}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative p-4">
                  <h3 className="text-lg font-semibold leading-tight text-white">
                    {c.name}
                  </h3>

                  <p className="mt-2 min-h-[40px] text-sm leading-5 text-white/68 line-clamp-2">
                    {c.description || "Premium Aegean sea experience."}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-white/70">
                    <MapPin className="size-4 text-pink-300" />
                    <span>{c.locationId || t("courts.defaultLocation")}</span>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <Link
                      href={`${tenantBase}/timetable?activityId=${encodeURIComponent(
                        c.id
                      )}&date=${encodeURIComponent(tomorrow)}&partySize=1`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-[0_14px_40px_-16px_rgba(236,72,153,0.8)] transition duration-300 hover:scale-[1.03]"
                    >
                      <CircleDot className="size-4" />
                      <span>{t("courts.selectBtn")}</span>
                    </Link>

                    <Link
                      href={`${tenantBase}/activities`}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm font-medium text-white/82 backdrop-blur-md transition hover:bg-white/[0.08]"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {courts.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index
                ? "w-7 bg-gradient-to-r from-pink-400 to-cyan-300"
                : "w-2 bg-white/20 hover:bg-white/45"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {courts.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={atStart}
            className={`absolute left-2 top-[42%] z-20 -translate-y-1/2 rounded-full border border-white/10 p-2.5 backdrop-blur-xl transition md:left-3 ${
              atStart
                ? "cursor-not-allowed bg-white/5 text-white/30"
                : "bg-black/35 text-white hover:scale-105 hover:bg-black/55"
            }`}
            aria-label={t("courts.prev")}
          >
            <ChevronLeft className="size-4" />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={atEnd}
            className={`absolute right-2 top-[42%] z-20 -translate-y-1/2 rounded-full border border-white/10 p-2.5 backdrop-blur-xl transition md:right-3 ${
              atEnd
                ? "cursor-not-allowed bg-white/5 text-white/30"
                : "bg-black/35 text-white hover:scale-105 hover:bg-black/55"
            }`}
            aria-label={t("courts.next")}
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}