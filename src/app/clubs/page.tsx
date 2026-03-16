// src/app/clubs/page.tsx
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { CourtsHeaderClient } from "@/components/home/CourtsHeaderClient";
import ClubsSearchClient from "./SearchClient"; // ← new client component

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Businesses — Aegean Rush",
  description:
    "Browse all activity providers available on the platform, see live availability and book your next experience.",
};

export default async function ClubsPage() {
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return (
    <div className="space-y-12 md:space-y-16">

      {/* BACK BUTTON */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white 
                     px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 
                     transition bg-black/20"
        >
          ← Back
        </Link>
      </div>

      {/* HEADER */}
      <section className="relative space-y-7">
        <div className="text-center space-y-3">
          <CourtsHeaderClient />
          <p className="mx-auto max-w-3xl text-sm text-white/75">
            Explore all activity providers available on the platform. Search by name or browse the full list.
          </p>
        </div>

        {/* CLIENT SEARCH */}
        <ClubsSearchClient initialClubs={clubs} />
      </section>
    </div>
  );
}