// prisma/seed-harbor.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const club = await prisma.club.findUnique({ where: { slug: "harbor-tennis" } });
  if (!club) throw new Error("Club 'harbor-tennis' not found");

  // Upsert an activity under Harbor (now selecting durationMin, maxParty, basePrice)
  const activity = await prisma.activity.upsert({
    where: { clubId_slug: { clubId: club.id, slug: "evening-court" } },
    update: {},
    create: {
      club: { connect: { id: club.id } },
      name: "Evening Court",
      slug: "evening-court",
      description: "Standard 90-minute court booking.",
      durationMin: 90,
      minParty: 1,
      maxParty: 4,
      basePrice: 2500,
      requiresInstructor: false,
      locationId: "harbor-courts-1",
      active: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      clubId: true,
      durationMin: true,
      maxParty: true,
      basePrice: true,
    },
  });

  // Create one slot (tomorrow 18:00–end)
  const day = new Date();
  day.setDate(day.getDate() + 1);
  day.setHours(18, 0, 0, 0);
  const start = day;
  const end = new Date(start.getTime() + (activity.durationMin ?? 90) * 60000);

  await prisma.timeSlot.upsert({
    where: {
      activityId_startAt: { activityId: activity.id, startAt: start },
    },
    update: {},
    create: {
      activityId: activity.id,
      startAt: start,
      endAt: end,
      capacity: activity.maxParty ?? 4,
      priceCents: activity.basePrice ?? 2500,
    },
  });

  console.log("✅ Seeded Harbor:", {
    activity: { id: activity.id, slug: activity.slug },
    slot: { startAt: start.toISOString(), endAt: end.toISOString() },
  });
}

main()
  .catch((e) => {
    console.error("Seed Harbor failed ❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());