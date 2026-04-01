import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.club.count({
    where: {
      NOT: {
        subscriptionPlan: "ENTERPRISE",
      },
    },
  });

  console.log(`Clubs needing upgrade: ${before}`);

  const result = await prisma.club.updateMany({
    where: {
      NOT: {
        subscriptionPlan: "ENTERPRISE",
      },
    },
    data: {
      subscriptionPlan: "ENTERPRISE",
    },
  });

  console.log(`Updated ${result.count} clubs to ENTERPRISE.`);
}

main()
  .catch((err) => {
    console.error("Failed to upgrade clubs:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });