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
import { WhyChooseUsSectionClient } from "@/components/home/WhyChooseUsSectionClient";
import { FaqSectionClient } from "@/components/home/FaqSectionClient";
import { FinalCtaSectionClient } from "@/components/home/FinalCtaSectionClient";
import { LocationSectionClient } from "@/components/home/LocationSectionClient";

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
      faqItems: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
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
              <WhyChooseUsSectionClient
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                items={section.featureItems}
              />
            );

          case "LOCATION": {
            const locationData =
              section.dataJson && typeof section.dataJson === "object"
                ? (section.dataJson as Record<string, unknown>)
                : null;

            const locationName =
              typeof locationData?.locationName === "string"
                ? locationData.locationName
                : null;

            const addressLine =
              typeof locationData?.addressLine === "string"
                ? locationData.addressLine
                : null;

            const googleMapsUrl =
              typeof locationData?.googleMapsUrl === "string"
                ? locationData.googleMapsUrl
                : null;

            const embedUrl =
              typeof locationData?.embedUrl === "string"
                ? locationData.embedUrl
                : null;

            const detailLine1 =
              typeof locationData?.detailLine1 === "string"
                ? locationData.detailLine1
                : null;

            const detailLine2 =
              typeof locationData?.detailLine2 === "string"
                ? locationData.detailLine2
                : null;

            const detailLine3 =
              typeof locationData?.detailLine3 === "string"
                ? locationData.detailLine3
                : null;

            return (
              <LocationSectionClient
                key={section.id}
                clubSlug={slug}
                badgeText={section.badgeText}
                title={section.title}
                subtitle={section.subtitle}
                body={section.body}
                primaryCtaLabel={section.primaryCtaLabel}
                primaryCtaHref={section.primaryCtaHref}
                secondaryCtaLabel={section.secondaryCtaLabel}
                secondaryCtaHref={section.secondaryCtaHref}
                locationName={locationName}
                addressLine={addressLine}
                googleMapsUrl={googleMapsUrl}
                embedUrl={embedUrl}
                detailLine1={detailLine1}
                detailLine2={detailLine2}
                detailLine3={detailLine3}
              />
            );
          }

          case "FAQ":
            return (
              <section key={section.id} id="faq" className="scroll-mt-28 md:scroll-mt-36">
                <FaqSectionClient
                  title={section.title}
                  subtitle={section.subtitle}
                  items={section.faqItems}
                />
              </section>
            );

          case "FINAL_CTA":
            return (
              <FinalCtaSectionClient
                key={section.id}
                clubSlug={slug}
                title={section.title}
                subtitle={section.subtitle}
                body={section.body}
                primaryCtaLabel={section.primaryCtaLabel}
                primaryCtaHref={section.primaryCtaHref}
                secondaryCtaLabel={section.secondaryCtaLabel}
                secondaryCtaHref={section.secondaryCtaHref}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}