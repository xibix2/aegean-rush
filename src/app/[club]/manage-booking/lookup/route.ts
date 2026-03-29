import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ club: string }> }
) {
  const { club } = await params;
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(
      new URL(`/${club}/manage-booking?error=missing-token`, request.url)
    );
  }

  return NextResponse.redirect(
    new URL(`/${club}/booking/${encodeURIComponent(token)}`, request.url)
  );
}