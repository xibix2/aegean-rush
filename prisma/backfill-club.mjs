import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1) create a default club if not exists
  const slug = process.env.DEFAULT_CLUB_SLUG || "city-racket";
  const club = await prisma.club.upsert({
    where: { slug },
    create: {
      name: "City Racket",
      slug,
      currency: "EUR",
    },
    update: {},
  });

  // 2) attach the existing AppSetting row (assumes there is only one)
  const settings = await prisma.appSetting.findFirst();
  if (settings && !settings.clubId) {
    await prisma.appSetting.update({
      where: { id: settings.id },
      data: { clubId: club.id },
    });
    console.log("Linked AppSetting ->", club.slug);
  } else {
    console.log("No AppSetting to link or already linked.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });