// prisma/seed-club.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const club = await prisma.club.upsert({
    where: { slug: 'city-racket' },
    update: { name: 'City Racket', currency: 'EUR', primaryHex: '#e91e63' },
    create: { slug: 'city-racket', name: 'City Racket', currency: 'EUR', primaryHex: '#e91e63' },
    select: { id: true, slug: true, name: true }
  });
  console.log('Upserted club:', club);
}
main().finally(() => prisma.$disconnect());