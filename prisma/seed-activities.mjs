// prisma/seed-activities.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const club = await prisma.club.findUnique({
    where: { slug: "city-racket" },
    select: { id: true, slug: true },
  });
  if (!club) throw new Error('Club "city-racket" not found');

  const rows = [
    {
      slug: "morning-court",
      name: "Morning Court Hire",
      description: "90′ morning session",
      durationMin: 90,
      minParty: 1,
      maxParty: 4,
      basePrice: 3000,
      requiresInstructor: false,
      locationId: "main-hall",
      active: true,
      coverImageUrl: null,
    },
    {
      slug: "coaching-90",
      name: "Coaching — 90′",
      description: "Private lesson (extended)",
      durationMin: 90,
      minParty: 1,
      maxParty: 2,
      basePrice: 6000,
      requiresInstructor: true,
      locationId: "court-1",
      active: true,
      coverImageUrl: null,
    },
  ];

  for (const r of rows) {
    const data = { ...r, clubId: club.id };
    const up = await prisma.activity.upsert({
      where: { clubId_slug: { clubId: club.id, slug: r.slug } }, // 👈 compound unique
      update: data,
      create: data,
      select: { id: true, slug: true, clubId: true },
    });
    console.log("Upserted activity:", up.slug, "→", up.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());