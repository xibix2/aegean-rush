// src/app/[club]/contact/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: { club: string } | Promise<{ club: string }>;
};

export default async function BusinessContactPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.club;

  if (!slug) notFound();

  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      name: true,
      emailFromName: true,
      emailFromEmail: true,
      logoKey: true,
      primaryHex: true,
      users: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });

  if (!club) {
    notFound();
  }

  const adminUser =
    club.users.find((u) => u.role === "ADMIN") ?? club.users[0] ?? null;

  const contactEmail =
    club.emailFromEmail?.trim() || adminUser?.email?.trim() || "";

  const contactName = club.emailFromName?.trim() || club.name;
  const canEmail = contactEmail.length > 0;

  const accent = club.primaryHex || "#22c55e";

  return (
    <main className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
          Contact
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          <span className="text-accent-gradient">Get in touch</span> with {club.name}
        </h1>
        <p className="text-sm md:text-base opacity-75">
          Have a question about bookings, activities, or availability? Use the details
          below to contact the business directly.
        </p>
      </header>

      <section className="rounded-2xl u-border u-surface p-6 md:p-7 space-y-6">
        <div className="flex items-center gap-3">
          {club.logoKey && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={club.logoKey}
              alt={club.name}
              className="h-10 w-10 rounded-xl object-contain bg-black/40"
            />
          )}
          <div>
            <h2 className="text-base font-semibold">{club.name}</h2>
            <p className="text-xs opacity-70">
              Business contact for guests &amp; bookings
            </p>
          </div>
        </div>

        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide uppercase opacity-70">
              Main contact
            </p>
            <p className="font-medium">{contactName}</p>
            {canEmail ? (
              <p className="opacity-80">{contactEmail}</p>
            ) : (
              <p className="opacity-70">
                This business hasn&apos;t added an email address yet. Please contact them
                by phone or through their local team.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide uppercase opacity-70">
              Typical questions
            </p>
            <ul className="list-disc list-inside space-y-0.5 opacity-80">
              <li>Changing or cancelling a booking</li>
              <li>Activity details and availability</li>
              <li>Private experiences or group bookings</li>
            </ul>
          </div>
        </div>

        {canEmail && (
          <div className="pt-2">
            <a
              href={`mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(
                "Activity booking enquiry"
              )}&body=${encodeURIComponent(
                `Hi ${contactName},\n\nI’d like to ask about...\n\nBooking details:\n- Date:\n- Time:\n- Activity:\n- Number of guests:\n\nThanks,\n`
              )}`}
              className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-black btn-accent"
              style={{
                background: accent,
              }}
            >
              Email the business
            </a>
            <p className="mt-2 text-[11px] opacity-65">
              This will open your email app with a pre-filled message to {contactEmail}.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}