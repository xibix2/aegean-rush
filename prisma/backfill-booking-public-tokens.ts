import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      publicToken: null,
    },
    select: {
      id: true,
    },
  });

  for (const booking of bookings) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        publicToken: randomUUID(),
      },
    });
  }

  console.log(`Updated ${bookings.length} bookings.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });