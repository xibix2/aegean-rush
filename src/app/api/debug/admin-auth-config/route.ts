import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const hasUser  = !!process.env.ADMIN_USER;
  const hasPlain = !!process.env.ADMIN_PASSWORD;
  const hasHash  = !!process.env.ADMIN_PASSWORD_HASH;
  return NextResponse.json({
    hasUser,
    hasPlain,
    hasHash,
    // sanity hints so we know what the login route will do
    loginMode: hasHash ? "bcrypt-hash"
             : hasPlain ? "plain"
             : "disabled",
  });
}