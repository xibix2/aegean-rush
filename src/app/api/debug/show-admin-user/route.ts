import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) return NextResponse.json({ error: "disabled in production" }, { status: 403 });

  const adminUser = process.env.ADMIN_USER || null;
  return NextResponse.json({ adminUser });
}