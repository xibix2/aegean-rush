// src/components/home/GallerySectionClient.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

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

  const resolvedTitle = title || "Moments from the water";
  const resolvedSubtitle =
    subtitle || "Photos and visuals that bring your experience to life.";

  const activeImage = images[activeIndex];

  const sideImages = useMemo(() => {
    if (images.length <= 1) return [];
    return images.filter((_, index) => index !== activeIndex).slice(0, 4);
  }, [images, activeIndex]);

  const goPrev = () =>
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );

  const goNext = () =>
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );

  if (!images.length) {
    return (
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-14 backdrop-blur-xl">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-44 w-[68%] -translate-x-1/2 blur-3xl opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(236,72,153,0.18) 0%, rgba(56,189,248,0.12) 42%, transparent 72%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-white/70 backdrop-blur-xl">
            <Sparkles className="size-3.5 text-pink-300" />
            Gallery
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {resolvedTitle}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
            {resolvedSubtitle}
          </p>

          <div className="mt-10 rounded-[1.8rem] border border-dashed border-white/10 bg-black/20 px-6 py-16 text-white/45">
            No gallery images added yet.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-5 py-10 backdrop-blur-xl sm:px-6 sm:py-12 md:px-8 md:py-14">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes galleryFloat {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes galleryGlow {
  0%,100% { opacity: .28; }
  50% { opacity: .48; }
}
@media (prefers-reduced-motion: reduce) {
  .gallery-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div
        className="gallery-anim pointer-events-none absolute left-[12%] top-[8%] h-28 w-28 rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)",
          animation: "galleryGlow 8s ease-in-out infinite",
        }}
      />
      <div
        className="gallery-anim pointer-events-none absolute right-[10%] top-[18%] h-32 w-32 rounded-full blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.24) 0%, transparent 70%)",
          animation: "galleryFloat 10s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 30%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-white/70 backdrop-blur-xl">
            <Sparkles className="size-3.5 text-pink-300" />
            Gallery
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {resolvedTitle}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
            {resolvedSubtitle}
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_0.85fr] lg:items-start">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 shadow-[0_35px_90px_-40px_rgba(0,0,0,0.9)]">
            <div className="relative aspect-[16/10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.imageUrl}
                alt={
                  activeImage.altText ||
                  activeImage.caption ||
                  "Featured gallery image"
                }
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
              />

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.78)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_32%)]" />

              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/80 backdrop-blur-xl">
                <Sparkles className="size-3.5 text-pink-300" />
                Featured shot
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70 backdrop-blur-md">
                    <ArrowUpRight className="size-3.5 text-cyan-300" />
                    Signature visual
                  </div>

                  <p className="mt-4 text-lg font-medium text-white md:text-2xl">
                    {activeImage.caption || "Experience the atmosphere before the booking even begins."}
                  </p>

                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
                    A more editorial, immersive showcase that makes the club feel premium, alive, and worth exploring.
                  </p>
                </div>
              </div>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/55"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/55"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {sideImages.map((image) => {
              const originalIndex = images.findIndex((item) => item.id === image.id);

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(originalIndex)}
                  className="group relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/20 text-left shadow-[0_25px_70px_-45px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.imageUrl}
                      alt={image.altText || image.caption || "Gallery image"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.18)_36%,rgba(0,0,0,0.82)_100%)]" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="line-clamp-2 text-sm font-medium text-white md:text-base">
                      {image.caption || "Explore another side of the experience."}
                    </p>
                  </div>
                </button>
              );
            })}

            {images.length === 1 && (
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-sm leading-relaxed text-white/60">
                  Add more images from the admin panel to turn this into a richer visual showcase.
                </p>
              </div>
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-8 bg-gradient-to-r from-pink-400 to-cyan-300"
                    : "w-2 bg-white/20 hover:bg-white/45"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/45">
          <Camera className="size-4" />
          {images.length} {images.length === 1 ? "photo" : "photos"}
        </div>
      </div>
    </section>
  );
}