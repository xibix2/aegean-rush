// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Accept token / tenant either from JSON body (fetch)
    // or from URL query (?token=...&tenant=...)
    const body = await req.json().catch(() => ({} as any));
    const q = req.nextUrl.searchParams;

    const token = (body?.token ?? q.get("token") ?? "").trim();
    const tenant = (body?.tenant ?? q.get("tenant") ?? "").trim();
    const newPassword: string = body?.newPassword ?? "";

    if (!token || !newPassword || newPassword.length < 8) {
      console.warn("[reset-password] invalid input", { hasToken: !!token });
      return NextResponse.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    // Look up token (token is unique)
    const t = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { club: { select: { slug: true } } } },
      },
    });

    if (!t || t.usedAt || t.expiresAt < new Date()) {
      console.warn("[reset-password] token invalid/expired", {
        hasTokenRecord: !!t,
      });
      return NextResponse.json(
        { ok: false, error: "Token invalid or expired" },
        { status: 400 }
      );
    }

    // Optional tenant guard
    if (tenant && t.user.club?.slug && t.user.club.slug !== tenant) {
      console.warn("[reset-password] tenant mismatch", {
        tokenTenant: t.user.club?.slug,
        tenantParam: tenant,
      });
      return NextResponse.json(
        { ok: false, error: "Tenant mismatch" },
        { status: 400 }
      );
    }

    // Update password + mark token used + clean other unused tokens
    const hash = bcrypt.hashSync(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: t.userId },
        data: { password: hash },
      }),
      prisma.passwordResetToken.update({
        where: { id: t.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: t.userId, usedAt: null, id: { not: t.id } },
      }),
    ]);

    console.info("[reset-password] password updated for user", t.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password] error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}