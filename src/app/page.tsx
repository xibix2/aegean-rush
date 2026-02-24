// src/app/page.tsx
import Link from "next/link";
import prisma from "@/lib/prisma";
import { HeroSectionClient } from "@/components/home/HeroSectionClient2";
import { CourtsHeaderClient } from "@/components/home/CourtsHeaderClient";
import { ClubsGrid } from "@/components/home/ClubsGrid";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function Home() {
  const clubs = await prisma.club.findMany({
    where: {
      // e.g. active: true,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return (
    <div className="space-y-16 md:space-y-20">
      {/* 1. Hero / main header */}
      <HeroSectionClient />

      {/* 2. Segment section: players vs club managers */}
      <section className="relative mx-auto max-w-6xl py-4">
        {/* Big ambient glow behind both cards */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-4 h-40 rounded-[3rem]"
          style={{
            background:
              "radial-gradient(90% 190% at 50% 0%, color-mix(in oklab, var(--accent-500) 26%, transparent), transparent 70%)",
            filter: "blur(52px)",
            opacity: 0.9,
          }}
        />

        <div className="relative space-y-7">
          {/* Section heading */}
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[--color-accent]">
              Who is TennisPro for?
            </p>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
              One platform for players and club managers
            </h2>
            <p className="mx-auto max-w-3xl text-sm text-white/75">
              Players can discover clubs and book courts in seconds. Club
              managers get a complete booking and payment system with no
              technical headaches.
            </p>
          </div>

          {/* Two-column cards */}
          <div className="grid gap-6 md:grid-cols-2 items-stretch">
            {/* Players card */}
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[--color-card]/85 shadow-[0_22px_65px_rgba(0,0,0,0.65)] backdrop-blur-sm transition-transform hover:-translate-y-1">
              {/* top accent strip */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-1 left-0 right-0 h-[3px]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--accent-500), transparent)",
                }}
              />

              <div className="relative flex h-full flex-col justify-between p-6 sm:p-7 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* label chip with glowing dot */}
                    <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/75">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: "var(--color-accent)",
                          boxShadow:
                            "0 0 0 3px color-mix(in oklab, var(--color-accent) 16%, transparent)",
                        }}
                      />
                      <span className="leading-none text-center">Players</span>
                    </div>

                    {/* icon badge */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">
                      🎾
                    </div>
                  </div>

                  <h3 className="text-base font-semibold">
                    For players & social groups
                  </h3>
                  <p className="text-sm text-white/78">
                    Browse partner clubs, see live court availability, and book
                    your next session in seconds. No phone calls, no
                    spreadsheets.
                  </p>
                </div>

                <div className="pt-2 mt-10">
                  <Link
                    href="/clubs"
                    className="relative inline-flex h-11 items-center gap-2 px-6 rounded-xl font-semibold text-black btn-accent overflow-hidden"
                  >
                    {/* Glow Behind */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 50%, rgba(255,215,130,0.45), rgba(255,180,80,0.18), transparent 70%)",
                        filter: "blur(14px)",
                        opacity: 0.85,
                        animation: "goldenPulse 6s ease-in-out infinite",
                      }}
                    />
                    <span className="relative z-10">View clubs</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Club managers card */}
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[--color-card]/85 shadow-[0_22px_65px_rgba(0,0,0,0.65)] backdrop-blur-sm transition-transform hover:-translate-y-1">
              {/* top accent strip */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-1 left-0 right-0 h-[3px]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--accent-500), transparent)",
                }}
              />

              <div className="relative flex h-full flex-col justify-between p-6 sm:p-7 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* label chip with glowing dot */}
                    <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/75">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: "var(--color-accent)",
                          boxShadow:
                            "0 0 0 3px color-mix(in oklab, var(--color-accent) 16%, transparent)",
                        }}
                      />
                      <span className="leading-none text-center">
                        Club owners
                      </span>
                    </div>

                    {/* icon badge */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">
                      📊
                    </div>
                  </div>

                  <h3 className="text-base font-semibold">
                    For club owners & managers
                  </h3>
                  <p className="text-sm text-white/78">
                    Accept online bookings, manage schedules, and get paid
                    automatically. Branded pages for your club with full control
                    over pricing and capacity.
                  </p>
                </div>

                {/* CTA BUTTONS */}
                <div className="mt-16 flex flex-wrap gap-4">
                  {/* CLUB SIGN UP — glowing */}
                  <Link
                    href="/signup"
                    className="relative inline-flex h-11 items-center gap-2 px-6 rounded-xl font-semibold text-black btn-accent overflow-hidden"
                  >
                    {/* Glow behind */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 50%, rgba(255,215,130,0.45), rgba(255,180,80,0.18), transparent 70%)",
                        filter: "blur(14px)",
                        opacity: 0.85,
                        animation: "goldenPulse 6s ease-in-out infinite",
                      }}
                    />
                    <span className="relative z-10">Club sign up</span>
                  </Link>

                  {/* CLUB LOGIN — outlined but elegant */}
                  <a
                    href="/login"
                    className="relative inline-flex h-11 items-center px-6 rounded-xl border border-[--color-border] bg-black/20 text-white/90 font-medium hover:border-[--color-accent] hover:text-white transition"
                  >
                    Club login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Clubs list */}
      <section id="clubs" className="relative space-y-8">
        <div className="text-center space-y-3">
          <CourtsHeaderClient />
          <p className="mx-auto max-w-3xl text-sm text-white/75">
            These are the clubs currently live on TennisPro. Pick one to view
            courts, pricing and book your next session.
          </p>
        </div>

        {clubs.length === 0 ? (
          <div className="mx-auto max-w-5xl rounded-2xl border border-[--color-border] bg-[--color-card]/60 p-6 text-sm text-center opacity-85">
            No clubs are live yet. Check back soon, or{" "}
            <Link
              href="/admin/signup"
              className="text-[--color-accent] underline-offset-2 hover:underline"
            >
              add your club to TennisPro
            </Link>
            .
          </div>
        ) : (
          <ClubsGrid clubs={clubs} />
        )}
      </section>
    </div>
  );
}