// prisma/seed-timeslot.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function upsertSlot({ clubSlug, activitySlug, startISO, endISO, capacity, priceCents }) {
  const club = await prisma.club.findUnique({ where: { slug: clubSlug } });
  if (!club) throw new Error(`Club not found: ${clubSlug}`);

  const activity = await prisma.activity.findUnique({
    where: { clubId_slug: { clubId: club.id, slug: activitySlug } },
    select: { id: true, name: true },
  });
  if (!activity) throw new Error(`Activity not found: ${activitySlug} @ ${clubSlug}`);

  const startAt = new Date(startISO);
  const endAt = new Date(endISO);

  const slot = await prisma.timeSlot.upsert({
    where: { activityId_startAt: { activityId: activity.id, startAt } }, // uses @@unique([activityId, startAt])
    update: { endAt, capacity, priceCents },
    create: { activityId: activity.id, startAt, endAt, capacity, priceCents },
    select: { id: true, startAt: true, endAt: true, capacity: true, priceCents: true },
  });

  console.log(`Upserted slot for ${activitySlug}:`, slot);
}

async function main() {
  // adjust as you like; these match your previous test
  await upsertSlot({
    clubSlug: "city-racket",
    activitySlug: "morning-court",
    startISO: "2025-11-04T07:00:00Z",
    endISO: "2025-11-04T08:30:00Z",
    capacity: 4,
    priceCents: 3000,
  });

  // Example: a second slot for coaching
  // await upsertSlot({
  //   clubSlug: "city-racket",
  //   activitySlug: "coaching-90",
  //   startISO: "2025-11-04T09:00:00Z",
  //   endISO: "2025-11-04T10:30:00Z",
  //   capacity: 2,
  //   priceCents: 6000,
  // });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});