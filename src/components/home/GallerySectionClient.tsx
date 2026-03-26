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

  const resolvedTitle = title || "Moments from the water";
  const resolvedSubtitle =
    subtitle || "Showcase your boats, jet skis, rides, and best views.";

  if (!images.length) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-14 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
            <Sparkles className="size-3.5 text-pink-300" />
            Gallery
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {resolvedTitle}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
            {resolvedSubtitle}
          </p>

          <div className="mt-10 rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 px-6 py-16 text-white/45">
            No gallery images added yet.
          </div>
        </div>
      </section>
    );
  }

  const activeImage = images[activeIndex];
  const prevIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
  const nextIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;

  const prevImage = images[prevIndex];
  const nextImage = images[nextIndex];

  const goPrev = () => setActiveIndex(prevIndex);
  const goNext = () => setActiveIndex(nextIndex);

  return (
    <section className="relative overflow-hidden rounded-[2.1rem] border border-white/10 bg-[#0b0d14] px-5 py-12 backdrop-blur-xl sm:px-6 md:px-8 md:py-14">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes galleryGlow {
  0%,100% { opacity: .22; transform: scale(1); }
  50% { opacity: .4; transform: scale(1.04); }
}
@keyframes galleryFloat {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes galleryShimmer {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
@media (prefers-reduced-motion: reduce) {
  .gallery-anim { animation: none !important; }
}
          `.trim(),
        }}
      />

      <div
        className="gallery-anim pointer-events-none absolute left-1/2 top-0 h-44 w-[70%] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.16) 0%, rgba(56,189,248,0.10) 42%, transparent 72%)",
          animation: "galleryGlow 8s ease-in-out infinite",
        }}
      />
      <div
        className="gallery-anim pointer-events-none absolute bottom-[-4rem] left-[12%] h-40 w-40 rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.20) 0%, transparent 70%)",
          animation: "galleryFloat 10s ease-in-out infinite",
        }}
      />
      <div
        className="gallery-anim pointer-events-none absolute right-[10%] top-[18%] h-36 w-36 rounded-full blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)",
          animation: "galleryFloat 12s ease-in-out infinite",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
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

        <div className="relative mt-12 flex items-center justify-center">
          {images.length > 1 && (
            <>
              <div className="pointer-events-none absolute left-0 top-1/2 hidden h-[72%] w-[18%] -translate-y-1/2 overflow-hidden rounded-[1.75rem] border border-white/6 opacity-35 blur-[1px] lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prevImage.imageUrl}
                  alt={prevImage.altText || prevImage.caption || "Previous image"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45" />
              </div>

              <div className="pointer-events-none absolute right-0 top-1/2 hidden h-[72%] w-[18%] -translate-y-1/2 overflow-hidden rounded-[1.75rem] border border-white/6 opacity-35 blur-[1px] lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nextImage.imageUrl}
                  alt={nextImage.altText || nextImage.caption || "Next image"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45" />
              </div>
            </>
          )}

          <div className="relative z-10 w-full max-w-4xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.95)]">
              <div className="relative aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={activeImage.id}
                  src={activeImage.imageUrl}
                  alt={activeImage.altText || activeImage.caption || "Gallery image"}
                  className="h-full w-full object-cover transition duration-700"
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.14)_35%,rgba(0,0,0,0.55)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_34%)]" />

                <div
                  className="gallery-anim absolute inset-0 opacity-20"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)",
                    animation: "galleryShimmer 7s linear infinite",
                  }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/55"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="size-5" />
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105 hover:bg-black/55"
                      aria-label="Next image"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8">
                  {activeImage.caption ? (
                    <p className="max-w-2xl text-lg font-medium text-white md:text-2xl">
                      {activeImage.caption}
                    </p>
                  ) : (
                    <p className="max-w-2xl text-lg font-medium text-white/88 md:text-2xl">
                      A premium glimpse into the experience.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-7 flex items-center justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-10 bg-gradient-to-r from-pink-400 via-fuchsia-300 to-cyan-300 shadow-[0_0_18px_rgba(236,72,153,0.35)]"
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