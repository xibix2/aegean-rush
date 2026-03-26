// src/app/[club]/page.tsx
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import CourtsSection from "@/app/_sections/ExperiencesSection";
import CourtsSkeleton from "@/components/ui/CourtsSkeleton";
import { HeroSectionClient } from "@/components/home/HeroSectionClient";
import { CourtsHeaderClient } from "@/components/home/CourtsHeaderClient";
import { GallerySectionClient } from "@/components/home/GallerySectionClient";
import { HowItWorksSectionClient } from "@/components/home/HowItWorksSectionClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClubHome({
  params,
}: {
  params: Promise<{ club: string }>;
}) {
  const { club } = await params;
  const slug = club;

  const tenant = await requireTenant(slug);

  const homepageSections = await prisma.homepageSection.findMany({
    where: {
      clubId: tenant.id,
      enabled: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      type: true,
      enabled: true,
      sortOrder: true,
      title: true,
      subtitle: true,
      body: true,
      primaryCtaLabel: true,
      primaryCtaHref: true,
      secondaryCtaLabel: true,
      secondaryCtaHref: true,
      badgeText: true,
      dataJson: true,
      galleryImages: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          caption: true,
        },
      },
      featureItems: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          sortOrder: true,
        },
      },
    },
  });

  const hasHomepageSections = homepageSections.length > 0;

  if (!hasHomepageSections) {
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

  return (
    <div className="space-y-16 md:space-y-20">
      {homepageSections.map((section) => {
        switch (section.type) {
          case "HERO": {
            const heroData =
              section.dataJson && typeof section.dataJson === "object"
                ? (section.dataJson as Record<string, unknown>)
                : null;

            const highlightTitle =
              typeof heroData?.highlightTitle === "string"
                ? heroData.highlightTitle
                : null;

            const microText =
              typeof heroData?.microText === "string"
                ? heroData.microText
                : null;

            return (
              <HeroSectionClient
                key={section.id}
                tenantSlug={slug}
                badgeText={section.badgeText}
                title={section.title}
                highlightTitle={highlightTitle}
                subtitle={section.subtitle}
                primaryCtaLabel={section.primaryCtaLabel}
                primaryCtaHref={section.primaryCtaHref}
                secondaryCtaLabel={section.secondaryCtaLabel}
                secondaryCtaHref={section.secondaryCtaHref}
                microText={microText}
              />
            );
          }

          case "ACTIVITIES":
            return (
              <section
                key={section.id}
                id="courts"
                className="relative space-y-8 text-center"
              >
                <CourtsHeaderClient
                  badgeText={section.badgeText}
                  title={section.title}
                  subtitle={section.subtitle}
                />
                <Suspense fallback={<CourtsSkeleton />}>
                  <CourtsSection tenantSlug={slug} />
                </Suspense>
              </section>
            );

          case "GALLERY":
            return (
              <GallerySectionClient
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                images={section.galleryImages}
              />
            );

          case "HOW_IT_WORKS":
            return (
              <HowItWorksSectionClient
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                items={section.featureItems}
              />
            );

          case "WHY_CHOOSE_US":
            return (
              <section
                key={section.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-xl"
              >
                <div className="mx-auto max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/45">
                    Why choose us
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    {section.title || "Why choose us"}
                  </h2>
                  {section.subtitle ? (
                    <p className="mx-auto mt-4 max-w-2xl text-white/65">
                      {section.subtitle}
                    </p>
                  ) : null}
                </div>
              </section>
            );

          case "LOCATION":
            return (
              <section
                key={section.id}
                id="meeting-point"
                className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-xl"
              >
                <div className="mx-auto max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/45">
                    Meeting point
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    {section.title || "Meeting point"}
                  </h2>
                  {section.subtitle ? (
                    <p className="mx-auto mt-4 max-w-2xl text-white/65">
                      {section.subtitle}
                    </p>
                  ) : null}
                  {section.body ? (
                    <p className="mx-auto mt-3 max-w-2xl text-white/55">
                      {section.body}
                    </p>
                  ) : null}
                </div>
              </section>
            );

          case "FAQ":
            return (
              <section
                key={section.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-xl"
              >
                <div className="mx-auto max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/45">
                    FAQ
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    {section.title || "Frequently asked questions"}
                  </h2>
                  {section.subtitle ? (
                    <p className="mx-auto mt-4 max-w-2xl text-white/65">
                      {section.subtitle}
                    </p>
                  ) : null}
                </div>
              </section>
            );

          case "FINAL_CTA":
            return (
              <section
                key={section.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-xl"
              >
                <div className="mx-auto max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/45">
                    Ready when you are
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    {section.title || "Ready to book your experience?"}
                  </h2>
                  {section.subtitle ? (
                    <p className="mx-auto mt-4 max-w-2xl text-white/65">
                      {section.subtitle}
                    </p>
                  ) : null}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}