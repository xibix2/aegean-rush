// src/app/page.tsx
import Link from "next/link";
import prisma from "@/lib/prisma";
import { CalendarDays, ShieldCheck, Zap, Waves, Anchor, Star } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const CLUBS = [
  {
    slug: "paradise-watersports",
    eyebrow: "Watersports & beach activities",
    title: "Paradise Watersports",
    description:
      "Jet ski, parasailing, crazy sofa, flyfish, wakeboard and more high-energy sea activities.",
    cta: "View watersports",
    icon: Waves,
    gradient:
      "from-cyan-400/25 via-blue-500/10 to-pink-500/25",
    image:
      "/images/paradise-watersports-cover.png",
    tags: ["Jet Ski", "Parasailing", "Crazy Sofa"],
  },
  {
    slug: "poseidon-rent-a-boat",
    eyebrow: "Boat rentals & jet boat rides",
    title: "Poseidon Rent A Boat",
    description:
      "Rent a boat, explore the coast, or book fast jet boat experiences with instant confirmation.",
    cta: "View boats & jet boat",
    icon: Anchor,
    gradient:
      "from-blue-500/25 via-cyan-500/10 to-purple-500/25",
    image:
      "/images/poseidon-rent-a-boat-cover.png",
    tags: ["Boat Rental", "Jet Boat", "Private Trips"],
  },
];

export default async function Home() {
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  const liveSlugs = new Set(clubs.map((club) => club.slug));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-4 sm:px-6 md:space-y-16 md:pt-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 px-5 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-8 md:px-12 md:py-14">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, rgba(236,72,153,0.25), transparent 35%), radial-gradient(circle at 85% 20%, rgba(56,189,248,0.22), transparent 38%), radial-gradient(circle at 50% 100%, rgba(14,165,233,0.18), transparent 45%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
            <Star className="size-3.5 text-pink-300" />
            Hersonissos sea adventures
          </div>

          <h1 className="text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl md:text-7xl">
            Book your sea adventure in Crete
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base md:text-lg">
            Choose watersports, boat rentals, or jet boat experiences. Book online
            before you arrive and skip the stress.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2 text-xs text-white/75 sm:mx-auto sm:max-w-2xl sm:grid-cols-3">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              Real-time availability
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              Secure checkout
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              Instant confirmation
            </div>
          </div>
        </div>
      </section>

      {/* TWO MAIN CHOICES */}
      <section className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[--color-accent]">
            Choose what you want
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Watersports or boats?
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {CLUBS.map((club) => {
            const Icon = club.icon;
            const href = liveSlugs.has(club.slug) ? `/${club.slug}` : "/clubs";

            return (
              <Link
                key={club.slug}
                href={href}
                className="group relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 shadow-[0_24px_70px_rgba(0,0,0,0.55)] transition hover:-translate-y-1 hover:border-white/25"
              >
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-gradient-to-br ${club.gradient}`}
                />

                <div
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-45"
                  style={{ backgroundImage: `url(${club.image})` }}
                />

                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20"
                />

                <div className="relative z-10 flex min-h-[430px] flex-col justify-end p-6 sm:p-7">
                  <div className="mb-auto flex items-center justify-between">
                    <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                      {club.eyebrow}
                    </div>

                    <div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur">
                      <Icon className="size-5 text-cyan-200" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {club.title}
                    </h3>

                    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
                      {club.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {club.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-400 px-6 text-sm font-bold text-white shadow-[0_12px_40px_rgba(236,72,153,0.35)]">
                      {club.cta} →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TRUST */}
      <section className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-3 sm:p-5">
        <div className="rounded-2xl bg-black/25 p-4">
          <CalendarDays className="mb-3 size-5 text-cyan-300" />
          <h3 className="text-sm font-bold text-white">Book before you arrive</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/65">
            No waiting around. Reserve your activity online.
          </p>
        </div>

        <div className="rounded-2xl bg-black/25 p-4">
          <ShieldCheck className="mb-3 size-5 text-pink-300" />
          <h3 className="text-sm font-bold text-white">Secure payment</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/65">
            Safe online checkout with instant confirmation.
          </p>
        </div>

        <div className="rounded-2xl bg-black/25 p-4">
          <Zap className="mb-3 size-5 text-yellow-300" />
          <h3 className="text-sm font-bold text-white">Fast check-in</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/65">
            Show your booking and get straight to the water.
          </p>
        </div>
      </section>

      {/* SMALL FOOTER BUSINESS LINK */}
      <section className="text-center text-xs text-white/45">
        Own an activity business?{" "}
        <Link href="/signup" className="text-[--color-accent] hover:underline">
          Partner with Aegean Rush
        </Link>
      </section>
    </main>
  );
}