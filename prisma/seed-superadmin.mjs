import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "super@admin.com";
  const password = "super123"; // change later in production
  const hashed = await bcrypt.hash(password, 10);

  // Look for an existing SUPERADMIN with this email and no club
  const existing = await prisma.user.findFirst({
    where: {
      email,
      clubId: null,
    },
  });

  if (existing) {
    console.log("SUPERADMIN already exists:");
    console.log(`Email: ${email}`);
    console.log(`Password (unchanged): ${password}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "SUPERADMIN",
      clubId: null,
    },
  });

  console.log("SUPERADMIN created:");
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });