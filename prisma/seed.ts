// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 0) Ensure a club exists (tenant)
  const club = await prisma.club.upsert({
    where: { slug: "city-racket" },
    update: {},
    create: {
      slug: "city-racket",
      name: "City Racket",
      currency: "EUR",
      primaryHex: "#0ea5e9",
    },
  });

  // 0.1) Ensure an AppSetting row for this club (optional, harmless)
  await prisma.appSetting.upsert({
    where: { clubId: club.id },
    update: {},
    create: { clubId: club.id, tz: "Europe/Athens" },
  });

  // 1) Upsert activity under this club (note: compound unique clubId+slug)
  const activity = await prisma.activity.upsert({
    where: { clubId_slug: { clubId: club.id, slug: "tennis-court" } },
    update: {},
    create: {
      club: { connect: { id: club.id } },
      name: "Tennis Court",
      slug: "tennis-court",
      description: "Standard 60-minute court booking.",
      durationMin: 60,
      minParty: 1,
      maxParty: 4,
      basePrice: 2000,
      requiresInstructor: false,
      locationId: "athens-club-1",
      active: true,
      sport: "tennis",
      coverImageUrl: null,
    },
  });

  // 2) Create time slots for the next 14 days at 18:00 and 19:30
  const rows: {
    activityId: string;
    startAt: Date;
    endAt: Date;
    capacity: number;
    priceCents: number;
  }[] = [];

  for (let i = 1; i <= 14; i++) {
    const day = new Date();
    day.setDate(day.getDate() + i);

    const startTimes: [number, number][] = [
      [18, 0],
      [19, 30],
    ];

    for (const [h, m] of startTimes) {
      const start = new Date(day);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + activity.durationMin * 60 * 1000);

      rows.push({
        activityId: activity.id,
        startAt: start,
        endAt: end,
        capacity: activity.maxParty,
        priceCents: activity.basePrice ?? 0,
      });
    }
  }

  if (rows.length) {
    await prisma.timeSlot.createMany({ data: rows, skipDuplicates: true });
  }

  console.log("Seeded ✅ club, activity, and timeslots");
}

main()
  .catch((e) => {
    console.error("Seed failed ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });