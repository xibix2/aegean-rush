// src/app/api/admin/club-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const revalidate = 0;

async function requireSuperAdminCookie() {
  const jar = await cookies();
  const isAuthed = jar.get("admin_auth")?.value === "yes";
  const role = jar.get("admin_role")?.value;
  if (!isAuthed || role !== "SUPERADMIN") throw new Error("Forbidden");
}

export async function GET() {
  try {
    await requireSuperAdminCookie();

    const users = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        role: true,
        clubId: true,
        club: { select: { slug: true, name: true } },
      },
      orderBy: [{ clubId: "asc" }, { email: "asc" }],
    });

    return NextResponse.json({ admins: users });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdminCookie();

    const { email, password, clubSlug } = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
      clubSlug?: string;
    };

    if (!email || !password || !clubSlug) {
      return NextResponse.json({ error: "email, password, clubSlug required" }, { status: 400 });
    }

    const club = await prisma.club.findUnique({ where: { slug: clubSlug } });
    if (!club) return NextResponse.json({ error: "Unknown club slug" }, { status: 404 });

    const hash = bcrypt.hashSync(password, 10);

    // email unique per club via @@unique([email, clubId])
    const user = await prisma.user.upsert({
      where: { email_clubId: { email: email.toLowerCase(), clubId: club.id } },
      update: { password: hash, role: "ADMIN" },
      create: { email: email.toLowerCase(), password: hash, role: "ADMIN", clubId: club.id },
      select: { id: true, email: true, role: true, clubId: true },
    });

    return NextResponse.json({ ok: true, user, club: { id: club.id, slug: club.slug, name: club.name } });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
  }
}