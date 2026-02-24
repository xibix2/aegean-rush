import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }

  const { username = "", password = "" } = await req.json().catch(() => ({}));
  const email = String(username).toLowerCase().trim();
  const requiredUser = process.env.ADMIN_USER?.toLowerCase().trim();

  const userMatches = !requiredUser || email === requiredUser;
  const passMatches = verifyAdminPassword(password);

  return NextResponse.json({
    mode: process.env.ADMIN_PASSWORD_HASH ? "hash" : (process.env.ADMIN_PASSWORD ? "plain" : "disabled"),
    requiredUser: requiredUser ?? null,
    postedUser: email,
    userMatches,
    passMatches,
    verdict: userMatches && passMatches ? "ok" : "fail",
  });
}