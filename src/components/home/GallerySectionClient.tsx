// src/components/home/GallerySectionClient.tsx
"use client";

import { useState } from "react";
import { Camera, Sparkles } from "lucide-react";

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
  const restImages = images.filter((_, index) => index !== activeIndex).slice(0, 4);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-5 py-12 backdrop-blur-xl sm:px-6 md:px-8 md:py-14">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-[65%] -translate-x-1/2 blur-3xl opacity-35"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.16) 0%, rgba(56,189,248,0.12) 42%, transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
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

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
          <button
            type="button"
            onClick={() => setActiveIndex(activeIndex)}
            className="group relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-black/20 text-left shadow-[0_30px_90px_-45px_rgba(0,0,0,0.95)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.imageUrl}
                alt={activeImage.altText || activeImage.caption || "Gallery image"}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            </div>

            {activeImage.caption ? (
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <p className="max-w-xl text-base font-medium text-white md:text-lg">
                  {activeImage.caption}
                </p>
              </div>
            ) : null}
          </button>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {restImages.map((image) => {
              const originalIndex = images.findIndex((item) => item.id === image.id);

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(originalIndex)}
                  className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 text-left shadow-[0_25px_70px_-45px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.imageUrl}
                      alt={image.altText || image.caption || "Gallery image"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                  </div>

                  {image.caption ? (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="line-clamp-2 text-sm font-medium text-white">
                        {image.caption}
                      </p>
                    </div>
                  ) : null}
                </button>
              );
            })}

            {restImages.length === 0 && (
              <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-6 text-sm leading-relaxed text-white/55">
                Add more gallery images from the admin panel for a richer visual section.
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