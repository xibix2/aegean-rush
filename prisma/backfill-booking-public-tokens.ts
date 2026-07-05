import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Booking" WHERE "publicToken" IS NULL
  `;

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
