// src/app/[club]/contact/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  // In some Next.js/App Router setups, params can be a Promise in Server Components
  params: { club: string } | Promise<{ club: string }>;
};

export default async function ClubContactPage({ params }: PageProps) {
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

  // 1) Prefer custom contact email from settings
  // 2) Then club ADMIN email
  // 3) Then any user email
  const adminUser =
    club.users.find((u) => u.role === "ADMIN") ?? club.users[0] ?? null;

  const contactEmail = club.emailFromEmail?.trim() || adminUser?.email?.trim() || "";

  const contactName = club.emailFromName?.trim() || club.name;
  const canEmail = contactEmail.length > 0;

  const accent = club.primaryHex || "#22c55e";

  return (
    <main className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-accent]">
          Contact
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          <span className="text-accent-gradient">Get in touch</span> with {club.name}
        </h1>
        <p className="text-sm md:text-base opacity-75">
          Have a question about bookings, courts, or events? Use the details below to
          contact the club directly.
        </p>
      </header>

      {/* Card */}
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
            <p className="text-xs opacity-70">Club contact for players &amp; bookings</p>
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
                The club hasn&apos;t added an email address yet. Please contact them via
                phone or at reception.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide uppercase opacity-70">
              Typical questions
            </p>
            <ul className="list-disc list-inside space-y-0.5 opacity-80">
              <li>Changing or cancelling a booking</li>
              <li>Group lessons &amp; coaching</li>
              <li>Club events &amp; tournaments</li>
            </ul>
          </div>
        </div>

        {canEmail && (
          <div className="pt-2">
            <a
              href={`mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(
                "Court booking enquiry",
              )}&body=${encodeURIComponent(
                `Hi ${contactName},\n\nI’d like to ask about...\n\nBooking details:\n- Date:\n- Time:\n- Activity:\n\nThanks,\n`,
              )}`}
              className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-black btn-accent"
              style={{
                background: accent,
              }}
            >
              Email the club
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
