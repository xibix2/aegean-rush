// src/components/ui/CourtsCarousel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { formatMoneyCentsClient } from "@/lib/money-client";
import { useT } from "@/components/I18nProvider";

type Court = {
  id: string;
  name: string;
  description?: string | null;
  basePrice?: number | null; // cents
  locationId?: string | null;
  coverImageUrl?: string | null;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const GAP_PX = 24;

export default function CourtsCarousel({
  courts,
  tomorrow,
  tenantSlug, // 👈 NEW
}: {
  courts: Court[];
  tomorrow: string; // "YYYY-MM-DD"
  tenantSlug?: string; // 👈 NEW (when present, we prefix links with /{slug})
}) {
  const t = useT();
  if (!courts?.length) return null;

  const tenantBase = tenantSlug ? `/${tenantSlug}` : ""; // 👈 build base once

  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  cardRefs.current = new Array(courts.length).fill(null);
  imgRefs.current = new Array(courts.length).fill(null);

  const [cardW, setCardW] = useState(320);
  const [viewportW, setViewportW] = useState(0);
  const [index, setIndex] = useState(Math.floor(courts.length / 2));
  const [anim, setAnim] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      setViewportW(viewportRef.current?.clientWidth ?? 0);
      const anyCard = cardRefs.current.find((el) => !!el);
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
    node.style.transition = anim ? `transform 500ms ${EASE}` : "none";
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
      const y = e.clientY - rect.top;
      const percentY = (y / rect.height) * 2 - 1;
      const dy = Math.max(-4, Math.min(4, percentY * 4));
      img.style.transform = `translateY(${dy}px) scale(1.01)`;
    };
  const onCardMouseLeave = (i: number) => () => {
    const img = imgRefs.current[i];
    if (img) img.style.transform = "translateY(0) scale(1)";
  };

  return (
    <div
      className="relative mx-auto max-w-6xl select-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {!atStart && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[--color-background] to-transparent z-10" />
      )}
      {!atEnd && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[--color-background] to-transparent z-10" />
      )}

      <div
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden px-6 md:px-10 py-10"
        style={
          { ["--card-w" as any]: "clamp(260px, 28vw, 340px)" } as React.CSSProperties
        }
      >
        <div
          ref={trackRef}
          className="flex items-stretch will-change-transform transform-gpu"
          style={{
            gap: `${GAP_PX}px`,
            transition: anim ? `transform 500ms ${EASE}` : "none",
            transform: `translate3d(${translateX}px,0,0)`,
          }}
        >
          {courts.map((c, i) => {
            const active = isActive(i);
            const price =
              typeof c.basePrice === "number"
                ? `${formatMoneyCentsClient(c.basePrice)}/hr`
                : undefined;
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
                  "w-[var(--card-w)] flex-shrink-0 rounded-2xl border border-[--color-border] bg-[--color-card] overflow-hidden transition-all duration-500 transform-gpu",
                  active
                    ? "scale-[1.05] -translate-y-1 ring-1 ring-white/5 shadow-2xl"
                    : "scale-[0.96] opacity-90",
                ].join(" ")}
              >
                {/* Image */}
                <div className="relative aspect-[16/10] w-full bg-[--color-muted] overflow-hidden">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      ref={(el) => {
                        imgRefs.current[i] = el;
                      }}
                      src={img}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-300 will-change-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-sm opacity-60">
                      {t("courts.preview")}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold leading-tight">{c.name}</h3>
                    {price && (
                      <span className="text-sm opacity-70 whitespace-nowrap">{price}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm opacity-75 line-clamp-2">
                    {c.description || t(" ")}
                  </p>
                  <div className="mt-3 text-sm opacity-70 inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {c.locationId || t("courts.defaultLocation")}
                  </div>

                  {/* Tenant-aware timetable link */}
                  <div className="mt-5">
                    <Link
                      href={`${tenantBase}/timetable?activityId=${encodeURIComponent(
                        c.id
                      )}&date=${encodeURIComponent(tomorrow)}&partySize=1`}
                      className="btn-accent inline-flex h-11 items-center gap-2 px-6"
                    >
                      <span>{t("courts.selectBtn")}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="mt-4 flex justify-center gap-2">
        {courts.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-4 bg-[--accent-500]" : "w-2 bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Nav arrows */}
      {courts.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={atStart}
            className={`absolute left-6 top-[45%] -translate-y-1/2 z-20 rounded-full p-2 backdrop-blur-md
              ${
                atStart
                  ? "bg-black/20 text-white/50 cursor-not-allowed"
                  : "bg-black/40 text-white hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-400]/60"
              }`}
            aria-label={t("courts.prev")}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={atEnd}
            className={`absolute right-6 top-[45%] -translate-y-1/2 z-20 rounded-full p-2 backdrop-blur-md
              ${
                atEnd
                  ? "bg-black/20 text-white/50 cursor-not-allowed"
                  : "bg-black/40 text-white hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-400]/60"
              }`}
            aria-label={t("courts.next")}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}