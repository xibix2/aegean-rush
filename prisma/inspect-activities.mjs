// prisma/inspect-activities.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const clubs = await prisma.club.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { slug: "asc" },
  });
  console.log("Clubs:");
  for (const c of clubs) console.log(" -", c.slug, c.id);

  const activities = await prisma.activity.findMany({
    select: { id: true, name: true, clubId: true, active: true },
    orderBy: { name: "asc" },
  });

  console.log("\nActivities:");
  if (activities.length === 0) {
    console.log(" (none)");
    return;
  }
  for (const a of activities) {
    console.log(
      ` - ${a.name} | active=${a.active} | clubId=${a.clubId ?? "NULL"}`
    );
  }

  const grouped = activities.reduce((acc, a) => {
    const k = a.clubId ?? "NULL";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\nCounts by clubId:");
  console.log(grouped);
}

main().finally(() => prisma.$disconnect());