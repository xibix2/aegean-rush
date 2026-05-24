// src/app/[club]/page.tsx
import type { Metadata } from "next";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ club: string }>;
}): Promise<Metadata> {
  const { club } = await params;

  const tenant = await prisma.club.findFirst({
    where: {
      slug: club,
    },
    select: {
      name: true,
      location: true,
      logoKey: true,
    },
  });

  if (!tenant) {
    return {
      title: "Aegean Rush",
    };
  }

  const title = `${tenant.name} | Watersports & Boat Activities in ${
    tenant.location ?? "Crete"
  }`;

  const description = `Book watersports, boat rentals and experiences with ${tenant.name}. Fast online booking through Aegean Rush.`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      type: "website",
      url: `https://www.aegeanrush.com/${club}`,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

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
      <div className="space-y-10 sm:space-y-14 md:space-y-20">
        <HeroSectionClient tenantSlug={slug} />

        <section id="courts" className="relative scroll-mt-24 space-y-5 text-center sm:space-y-8 md:scroll-mt-36">
          <CourtsHeaderClient />
          <Suspense fallback={<CourtsSkeleton />}>
            <CourtsSection tenantSlug={slug} />
          </Suspense>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10 sm:space-y-14 md:space-y-20">
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
              typeof heroData?.microText === "string" ? heroData.microText : null;

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
                className="relative scroll-mt-24 space-y-5 text-center sm:space-y-8 md:scroll-mt-36"
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
              <section key={section.id} className="scroll-mt-24 md:scroll-mt-36">
                <GallerySectionClient
                  title={section.title}
                  subtitle={section.subtitle}
                  images={section.galleryImages}
                />
              </section>
            );

          case "HOW_IT_WORKS":
            return (
              <section key={section.id} className="scroll-mt-24 md:scroll-mt-36">
                <HowItWorksSectionClient
                  title={section.title}
                  subtitle={section.subtitle}
                  items={section.featureItems}
                />
              </section>
            );

          case "WHY_CHOOSE_US":
            return (
              <section key={section.id} className="scroll-mt-24 md:scroll-mt-36">
                <WhyChooseUsSectionClient
                  title={section.title}
                  subtitle={section.subtitle}
                  items={section.featureItems}
                />
              </section>
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
              <section key={section.id} className="scroll-mt-24 md:scroll-mt-36">
                <LocationSectionClient
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
              </section>
            );
          }

          case "FAQ":
            return (
              <section
                key={section.id}
                id="faq"
                className="scroll-mt-24 md:scroll-mt-36"
              >
                <FaqSectionClient
                  title={section.title}
                  subtitle={section.subtitle}
                  items={section.faqItems}
                />
              </section>
            );

          case "FINAL_CTA":
            return (
              <section key={section.id} className="scroll-mt-24 md:scroll-mt-36">
                <FinalCtaSectionClient
                  clubSlug={slug}
                  title={section.title}
                  subtitle={section.subtitle}
                  body={section.body}
                  primaryCtaLabel={section.primaryCtaLabel}
                  primaryCtaHref={section.primaryCtaHref}
                  secondaryCtaLabel={section.secondaryCtaLabel}
                  secondaryCtaHref={section.secondaryCtaHref}
                />
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}