import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ActivityDetailsClient from "@/components/customer/ActivityDetailsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ActivityDetailsPage({
  params,
}: {
  params: Promise<{ club: string; slug: string }>;
}) {
  const { club, slug } = await params;
  const jar = await cookies();
  const lang = jar.get("ui_lang")?.value ?? "en";
  const currency = jar.get("ui_currency")?.value ?? "€";

  const activity = await prisma.activity.findFirst({
    where: {
      active: true,
      club: { slug: club },
      OR: [{ slug }, { id: slug }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      durationMin: true,
      minParty: true,
      maxParty: true,
      basePrice: true,
      requiresInstructor: true,
      locationId: true,
      coverImageUrl: true,
      mode: true,
      meetingPoint: true,
      includedText: true,
      bringText: true,
      cancellationText: true,
      ageInfo: true,
      skillLevel: true,
      safetyInfo: true,
      pricingNotes: true,
      guestsPerUnit: true,
      maxUnitsPerBooking: true,
      slotIntervalMin: true,
      durationOptions: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { durationMin: "asc" }],
        select: {
          id: true,
          label: true,
          durationMin: true,
          priceCents: true,
        },
      },
    },
  });

  if (!activity) notFound();

  const d = new Date();
  d.setDate(d.getDate() + 1);
  const date = d.toISOString().slice(0, 10);

  return (
    <ActivityDetailsClient
      tenantSlug={club}
      lang={lang}
      currency={currency}
      date={date}
      activity={activity}
    />
  );
}