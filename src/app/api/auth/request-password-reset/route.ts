// src/app/api/auth/request-password-reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";

export const dynamic = "force-dynamic";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFrom = process.env.RESEND_FROM_EMAIL || "Tennis Courts <onboarding@resend.dev>";
const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };

    const email = body.email?.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      console.warn("[request-password-reset] invalid email", body);
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    // Tenant (club slug) – optional, comes from header or query (?tenant=...)
    const tenantFromQuery = req.nextUrl.searchParams.get("tenant") || undefined;
    const tenantFromHeader = req.headers.get("x-tenant-slug") || undefined;
    const tenant = tenantFromQuery || tenantFromHeader;

    // Find user for this email (optionally scoped to club slug)
    const user = await prisma.user.findFirst({
      where: tenant
        ? { email, club: { slug: tenant } }
        : { email },
      select: {
        id: true,
        email: true,
        club: { select: { slug: true } },
      },
    });

    // Security: always return 200, even if user not found
    if (!user) {
      console.info("[request-password-reset] no user, but returning ok for", email);
      return NextResponse.json({ ok: true });
    }

    // Make token valid for 30 minutes
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const tenantSlug = user.club?.slug || tenant || "";
    const url = new URL("/reset-password", appBaseUrl);
    url.searchParams.set("token", token);
    if (tenantSlug) url.searchParams.set("tenant", tenantSlug);

    const resetUrl = url.toString();

    if (resend) {
      await resend.emails.send({
        from: resendFrom,
        to: user.email,
        subject: "Reset your password",
        react: ResetPasswordEmail({ resetUrl }),
      });
      console.info("[request-password-reset] email sent", { email: user.email, resetUrl });
    } else {
      console.warn(
        "[request-password-reset] RESEND_API_KEY missing – not sending email. URL:",
        resetUrl,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[request-password-reset] error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}