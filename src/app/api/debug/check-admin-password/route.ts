import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) return NextResponse.json({ error: "disabled in production" }, { status: 403 });

  const { password = "" } = await req.json().catch(() => ({ password: "" }));
  const envPass = process.env.ADMIN_PASSWORD || "";
  // return a boolean only (no secrets)
  return NextResponse.json({ match: password === envPass, len: password.length });
}