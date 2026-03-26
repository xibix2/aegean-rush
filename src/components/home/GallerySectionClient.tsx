// src/components/home/GallerySectionClient.tsx
"use client";

import { useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

type GalleryImage = {
  id: string;
  imageUrl: string;
  altText: string | null;
  caption: string | null;
};

type GallerySectionClientProps = {
  title?: string | null;
  subtitle?: string | null;
  images: GalleryImage[];
};

export function GallerySectionClient({
  title,
  subtitle,
  images,
}: GallerySectionClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
            <Sparkles className="size-3.5 text-pink-300" />
            Gallery
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {title || "Moments from the water"}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            {subtitle || "Photos and visuals that bring your experience to life."}
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 px-6 py-12 text-white/45">
            No gallery images added yet.
          </div>
        </div>
      </section>
    );
  }

  const activeImage = images[activeIndex];

  const goPrev = () =>
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));

  const goNext = () =>
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-12 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-[60%] -translate-x-1/2 blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.22) 0%, rgba(56,189,248,0.14) 40%, transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
            <Sparkles className="size-3.5 text-pink-300" />
            Gallery
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {title || "Moments from the water"}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            {subtitle || "Photos and visuals that bring your experience to life."}
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.5fr_.9fr]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20">
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.imageUrl}
                alt={activeImage.altText || activeImage.caption || "Gallery image"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                {activeImage.caption ? (
                  <p className="text-sm text-white/80 md:text-base">{activeImage.caption}</p>
                ) : (
                  <p className="text-sm text-white/55 md:text-base">
                    Explore the atmosphere and style of this experience.
                  </p>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/55"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/55"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {images.map((image, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={[
                    "group relative overflow-hidden rounded-2xl border transition",
                    isActive
                      ? "border-pink-400/50 ring-1 ring-pink-400/30"
                      : "border-white/10 hover:border-white/20",
                  ].join(" ")}
                >
                  <div className="relative aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.imageUrl}
                      alt={image.altText || image.caption || `Gallery image ${index + 1}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <div
                      className={`absolute inset-0 transition ${
                        isActive ? "bg-black/10" : "bg-black/35"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-5 flex justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-7 bg-gradient-to-r from-pink-400 to-cyan-300"
                    : "w-2 bg-white/20 hover:bg-white/45"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/50">
          <Camera className="size-4" />
          {images.length} {images.length === 1 ? "photo" : "photos"}
        </div>
      </div>
    </section>
  );
}