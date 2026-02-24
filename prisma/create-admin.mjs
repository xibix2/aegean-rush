// scripts/create-admin.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * Usage:
 *   node scripts/create-admin.mjs <club-slug> <email> <password> [role]
 *
 * Examples:
 *   node scripts/create-admin.mjs harbor-tennis admin@harbor.local Test1234!        // club ADMIN
 *   node scripts/create-admin.mjs - super@platform.local Test1234! SUPERADMIN       // platform SUPERADMIN (no club)
 */
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("Usage: node scripts/create-admin.mjs <club-slug> <email> <password> [role]");
  process.exit(1);
}
const [clubSlug, email, rawPassword, roleArg] = args;

const ROLE = (roleArg || "ADMIN").toUpperCase(); // "ADMIN" | "SUPERADMIN"

async function run() {
  try {
    let clubId = null;

    if (ROLE !== "SUPERADMIN") {
      // For club admins we need a valid club
      const club = await prisma.club.findUnique({ where: { slug: clubSlug } });
      if (!club) {
        console.error(`Club not found for slug "${clubSlug}"`);
        process.exit(2);
      }
      clubId = club.id;
    } else {
      // SUPERADMIN ignores club; allow passing "-" for clubSlug
      if (clubSlug !== "-") {
        console.warn(`SUPERADMIN selected — ignoring club slug "${clubSlug}".`);
      }
    }

    const hash = await bcrypt.hash(rawPassword, 10);

    // Matches your model:
    // model User { email String; password String; role UserRole; clubId String?; @@unique([email, clubId]) }
    // NOTE: unique selector name is email_clubId (order matters)
    const user =
      ROLE === "SUPERADMIN"
        ? await prisma.user.upsert({
            where: { email_clubId: { email, clubId: null } },
            update: { password: hash, role: "SUPERADMIN" },
            create: { email, password: hash, role: "SUPERADMIN", clubId: null },
          })
        : await prisma.user.upsert({
            where: { email_clubId: { email, clubId } },
            update: { password: hash, role: "ADMIN" },
            create: { email, password: hash, role: "ADMIN", clubId },
          });

    console.log("✔ Admin created/upserted:", {
      email: user.email,
      role: user.role,
      clubId: user.clubId ?? "(none - SUPERADMIN)",
    });
  } catch (err) {
    console.error("Error:", err);
    process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
}

run();