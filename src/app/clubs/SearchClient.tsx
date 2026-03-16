"use client";

import { useMemo, useState } from "react";
import { ClubsGrid } from "@/components/home/ClubsGrid";

export default function ClubsSearchClient({
  initialClubs,
}: {
  initialClubs: { id: string; name: string; slug: string }[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return initialClubs;
    return initialClubs.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, initialClubs]);

  return (
    <div className="space-y-10">
      {/* SEARCH BAR */}
      <div className="flex justify-center">
        <input
          type="text"
          placeholder="Search businesses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm placeholder-white/40 focus:outline-none focus:border-[--color-accent]"
        />
      </div>

      {/* BUSINESSES GRID */}
      <ClubsGrid clubs={filtered} />
    </div>
  );
}
