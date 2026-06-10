// src/app/page.tsx
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Anchor, Waves } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const CLUBS = [
  {
    slug: "paradisewatersports",
    label: "Watersports & beach activities",
    title: "Paradise Watersports",
    description:
      "Jet ski, parasailing, crazy sofa, flyfish, wakeboard and more high-energy sea activities.",
    cta: "View watersports",
    icon: Waves,
    image: "/images/paradise-watersports-cover.png",
  },
  {
    slug: "poseidon-rent-a-boat",
    label: "Boat rentals & jet boat rides",
    title: "Poseidon Rent A Boat",
    description:
      "Rent a boat, explore the coast, or book fast jet boat experiences with instant confirmation.",
    cta: "Explore boats",
    icon: Anchor,
    image: "/images/poseidon-rent-a-boat-cover.png",
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
    <main className="mx-auto w-full max-w-6xl space-y-5 px-1 pb-10 pt-1 sm:px-5 md:space-y-10 md:px-6">
      {/* HERO */}
      <section className="relative min-h-[315px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 px-4 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-8 md:min-h-[500px] md:px-12 md:py-14">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(3,7,18,0.1), rgba(3,7,18,0.9)), radial-gradient(circle at 20% 10%, rgba(236,72,153,0.32), transparent 35%), radial-gradient(circle at 85% 20%, rgba(56,189,248,0.34), transparent 42%)",
          }}
        />

        <div className="relative z-10 flex min-h-[255px] flex-col items-center justify-center text-center md:min-h-[420px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
            Hersonissos sea adventures
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl">
            Book your sea adventure in Crete
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Choose watersports, boat rentals, or jet boat experiences. Book
            online before you arrive and skip the stress.
          </p>

          <a
            href="#choose"
            className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 px-6 text-sm font-black text-white shadow-[0_18px_55px_rgba(56,189,248,0.28)] sm:mt-7 sm:h-14 sm:px-8 sm:text-base"
          >
            Choose your adventure →
          </a>
        </div>
      </section>

      {/* CHOOSE */}
      <section id="choose" className="space-y-5">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/65">
            Choose what you want
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-5xl">
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
                className="group relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_26px_80px_rgba(0,0,0,0.7)] transition duration-300 hover:-translate-y-1 hover:border-white/25 md:min-h-[560px]"
              >
                {/* Image: much stronger, less faded */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center opacity-95 transition duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${club.image})` }}
                />

                {/* Dark overlay only where text is */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/5"
                />

                <div className="relative z-10 flex min-h-[430px] flex-col justify-end p-4 sm:p-7 md:min-h-[560px]">
                  <div className="absolute left-4 right-4 top-4 flex items-center gap-2 sm:left-7 sm:right-7 sm:top-7 sm:gap-3">
                    <div className="flex-1 rounded-full border border-white/15 bg-black/55 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/85 backdrop-blur-md">
                      {club.label}
                    </div>

                    <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/15 backdrop-blur-md">
                      <Icon className="size-7 text-cyan-200" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-4xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_5px_22px_rgba(0,0,0,0.8)] sm:text-6xl md:text-5xl">
                      {club.title}
                    </h3>

                    <p className="max-w-lg text-base leading-relaxed text-white/90 drop-shadow-[0_3px_14px_rgba(0,0,0,0.85)] sm:text-lg">
                      {club.description}
                    </p>

                    <div className="pt-3">
                      <span className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 px-6 text-sm font-black text-white shadow-[0_18px_50px_rgba(236,72,153,0.35)] sm:h-14 sm:px-8 sm:text-base">
                        {club.cta} →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TRUST - SHORT AND CLEAN */}
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-5 text-center">
        <p className="text-sm font-semibold text-white/85">
          Real-time availability · Secure checkout · Instant confirmation
        </p>
      </section>

      <section className="text-center text-xs text-white/45">
        Own an activity business?{" "}
        <Link href="/signup" className="text-[--color-accent] hover:underline">
          Partner with Aegean Rush
        </Link>
      </section>
    </main>
  );
}