// prisma/seed-homepage.ts
import prisma from "@/lib/prisma";

async function main() {
  const clubs = await prisma.club.findMany({
    select: { id: true, slug: true, name: true, location: true },
  });

  for (const club of clubs) {
    const defaults = [
      {
        type: "HERO" as const,
        sortOrder: 0,
        enabled: true,
        badgeText: "Aegean thrill experiences",
        title: `Book unforgettable experiences with ${club.name}`,
        subtitle: "Real-time availability. Secure booking. Instant confirmation.",
        primaryCtaLabel: "Explore experiences",
        primaryCtaHref: `/${club.slug}/activities`,
        secondaryCtaLabel: "Find us",
        secondaryCtaHref: "#meeting-point",
      },
      {
        type: "GALLERY" as const,
        sortOrder: 1,
        enabled: true,
        title: "Moments from the water",
        subtitle: "Showcase your boats, jet skis, rides, and best views.",
      },
      {
        type: "ACTIVITIES" as const,
        sortOrder: 2,
        enabled: true,
        title: "Featured experiences",
        subtitle: "Choose your next Aegean adventure.",
      },
      {
        type: "HOW_IT_WORKS" as const,
        sortOrder: 3,
        enabled: true,
        title: "How it works",
        subtitle: "From choosing to booking, everything takes just a few steps.",
      },
      {
        type: "WHY_CHOOSE_US" as const,
        sortOrder: 4,
        enabled: true,
        title: "Why choose us",
        subtitle: "A faster, easier, and more trusted way to book your experience.",
      },
      {
        type: "LOCATION" as const,
        sortOrder: 5,
        enabled: true,
        title: "Meeting point",
        subtitle: club.location || "Easy to find before your experience starts.",
        body: "Arrive a little early so everything starts smoothly.",
        primaryCtaLabel: "View activities",
        primaryCtaHref: `/${club.slug}/activities`,
      },
      {
        type: "FAQ" as const,
        sortOrder: 6,
        enabled: true,
        title: "Frequently asked questions",
        subtitle: "Everything guests usually want to know before booking.",
      },
      {
        type: "FINAL_CTA" as const,
        sortOrder: 7,
        enabled: true,
        title: "Ready to book your experience?",
        subtitle: "Choose your activity and secure your spot in seconds.",
        primaryCtaLabel: "Explore experiences",
        primaryCtaHref: `/${club.slug}/activities`,
      },
    ];

    for (const section of defaults) {
      await prisma.homepageSection.upsert({
        where: {
          clubId_type: {
            clubId: club.id,
            type: section.type,
          },
        },
        update: {},
        create: {
          clubId: club.id,
          ...section,
        },
      });
    }

    const howItWorks = await prisma.homepageSection.findUnique({
      where: {
        clubId_type: {
          clubId: club.id,
          type: "HOW_IT_WORKS",
        },
      },
      select: { id: true },
    });

    if (howItWorks) {
      const existing = await prisma.homepageFeatureItem.count({
        where: { sectionId: howItWorks.id },
      });

      if (existing === 0) {
        await prisma.homepageFeatureItem.createMany({
          data: [
            {
              sectionId: howItWorks.id,
              title: "Choose activity",
              description: "Browse experiences and pick what fits your mood.",
              icon: "Compass",
              sortOrder: 0,
            },
            {
              sectionId: howItWorks.id,
              title: "Pick time",
              description: "See availability instantly and select your slot.",
              icon: "CalendarDays",
              sortOrder: 1,
            },
            {
              sectionId: howItWorks.id,
              title: "Book instantly",
              description: "Secure your experience online in just a few clicks.",
              icon: "CircleCheck",
              sortOrder: 2,
            },
          ],
        });
      }
    }

    const whyChooseUs = await prisma.homepageSection.findUnique({
      where: {
        clubId_type: {
          clubId: club.id,
          type: "WHY_CHOOSE_US",
        },
      },
      select: { id: true },
    });

    if (whyChooseUs) {
      const existing = await prisma.homepageFeatureItem.count({
        where: { sectionId: whyChooseUs.id },
      });

      if (existing === 0) {
        await prisma.homepageFeatureItem.createMany({
          data: [
            {
              sectionId: whyChooseUs.id,
              title: "Real-time availability",
              description: "See what is actually bookable right now.",
              icon: "CalendarDays",
              sortOrder: 0,
            },
            {
              sectionId: whyChooseUs.id,
              title: "Instant booking",
              description: "No waiting for replies or manual confirmations.",
              icon: "Zap",
              sortOrder: 1,
            },
            {
              sectionId: whyChooseUs.id,
              title: "Secure payments",
              description: "Fast and trusted checkout with Stripe.",
              icon: "ShieldCheck",
              sortOrder: 2,
            },
            {
              sectionId: whyChooseUs.id,
              title: "Premium experiences",
              description: "Designed to help guests discover and book faster.",
              icon: "Sparkles",
              sortOrder: 3,
            },
          ],
        });
      }
    }

    const faq = await prisma.homepageSection.findUnique({
      where: {
        clubId_type: {
          clubId: club.id,
          type: "FAQ",
        },
      },
      select: { id: true },
    });

    if (faq) {
      const existing = await prisma.homepageFaqItem.count({
        where: { sectionId: faq.id },
      });

      if (existing === 0) {
        await prisma.homepageFaqItem.createMany({
          data: [
            {
              sectionId: faq.id,
              question: "What happens if the weather is bad?",
              answer: "The club will inform you if conditions affect the experience and explain the available options.",
              sortOrder: 0,
            },
            {
              sectionId: faq.id,
              question: "How early should I arrive?",
              answer: "Arriving 15 to 20 minutes early is usually best unless the club says otherwise.",
              sortOrder: 1,
            },
            {
              sectionId: faq.id,
              question: "Is payment secure?",
              answer: "Yes. Payments are processed through Stripe for a secure checkout experience.",
              sortOrder: 2,
            },
            {
              sectionId: faq.id,
              question: "Will I receive confirmation right away?",
              answer: "Yes. Once your booking is completed, your confirmation is shown immediately.",
              sortOrder: 3,
            },
          ],
        });
      }
    }
  }

  console.log("Homepage sections seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });