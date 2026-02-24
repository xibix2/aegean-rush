// src/app/[club]/page.tsx
import { Suspense } from "react";
import CourtsSection from "@/app/_sections/CourtsSection";
import CourtsSkeleton from "@/components/ui/CourtsSkeleton";
import { HeroSectionClient } from "@/components/home/HeroSectionClient";
import { CourtsHeaderClient } from "@/components/home/CourtsHeaderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClubHome({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params; // ✅ IMPORTANT in Next 15
  const slug = club;

  return (
    <div className="space-y-16 md:space-y-20">
      <HeroSectionClient tenantSlug={slug} />

      <section id="courts" className="relative space-y-8 text-center">
        <CourtsHeaderClient />
        <Suspense fallback={<CourtsSkeleton />}>
          <CourtsSection tenantSlug={slug} />
        </Suspense>
      </section>
    </div>
  );
}