// src/components/home/ClubsGrid.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const TAGLINES = [
  "Perfect courts for matches, coaching, and social play.",
  "Trusted by local players for easy online bookings.",
  "Great for league nights, training blocks, and casual hits.",
  "Reserve your next session without phone calls or spreadsheets.",
  "Ideal for after-work hits and weekend matchplay.",
  "Book practice blocks, match courts, and coaching sessions.",
  "Local hub for social tennis, ladders, and mini-tournaments.",
  "Designed for teams, clubs, and friendly rivalries.",
  "From casual rallies to serious competition — courts ready.",
  "Keep your group chat happy with guaranteed court times.",
  "Rain or shine, courts are just a few taps away.",
  "Built for busy players who hate waiting on the phone.",
];

const PAGE_SIZE = 9; // ⬅⬅⬅ CHANGED FROM 12 TO 9

export function ClubsGrid({ clubs }: { clubs: { id: string; name: string; slug: string }[] }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(clubs.length / PAGE_SIZE);
  const sliceStart = page * PAGE_SIZE;
  const sliceEnd = sliceStart + PAGE_SIZE;
  const current = clubs.slice(sliceStart, sliceEnd);

  return (
    <div className="w-full mx-auto max-w-6xl space-y-8">
      {/* GRID */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {current.map((club, idx) => {
          const tagline = TAGLINES[(sliceStart + idx) % TAGLINES.length];

          return (
            <a
              key={club.id}
              href={`/${club.slug}`}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-6 text-left shadow-[0_22px_45px_-30px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:border-[--color-accent]/80 hover:shadow-[0_26px_60px_-32px_rgba(0,0,0,1)]"
            >
              {/* Subtle glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{
                  background:
                    "radial-gradient(120% 140% at 0% 0%, rgba(236,72,153,0.18), transparent 55%), radial-gradient(120% 140% at 100% 100%, rgba(56,189,248,0.16), transparent 55%)",
                }}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[--color-accent]">
                  Partner club
                </div>

                <h3 className="text-base font-semibold leading-tight transition-colors group-hover:text-[--color-accent]">
                  {club.name}
                </h3>

                <p className="mt-3 text-xs text-white/70">
                  {tagline}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/60">
                  <span className="rounded-full bg-white/5 px-2 py-0.5">
                    Online booking
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5">
                    Instant confirmation
                  </span>
                </div>

                <span className="mt-4 inline-flex items-center text-xs font-semibold text-[--color-accent]">
                  View club
                  <span className="ml-1 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 bg-white/5 hover:border-[--color-accent] transition disabled:opacity-40 disabled:pointer-events-none"
            disabled={page === 0}
          >
            ← Prev
          </button>

          <span className="text-sm text-white/70">
            Page {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 bg-white/5 hover:border-[--color-accent] transition disabled:opacity-40 disabled:pointer-events-none"
            disabled={page === totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}