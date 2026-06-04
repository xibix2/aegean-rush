// src/app/[club]/contact/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock3,
  HelpCircle,
  Waves,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: { club: string } | Promise<{ club: string }>;
};

const CONTACT_PHONE_BY_SLUG: Record<string, string> = {
  paradisewatersports: "+30 698 116 8677",
  "poseidon-rent-a-boat": "+30 698 116 8677",
};

function cleanPhoneForHref(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

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
      location: true,
      users: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });

  if (!club) notFound();

  const adminUser =
    club.users.find((u) => u.role === "ADMIN") ?? club.users[0] ?? null;

  const contactEmail =
    club.emailFromEmail?.trim() || adminUser?.email?.trim() || "";

  const contactName = club.emailFromName?.trim() || club.name;
  const contactPhone = CONTACT_PHONE_BY_SLUG[slug] || "";
  const canEmail = contactEmail.length > 0;
  const canPhone = contactPhone.length > 0;

  const accent = club.primaryHex || "#22c55e";
  const phoneHref = canPhone ? `tel:${cleanPhoneForHref(contactPhone)}` : "#";
  const whatsappHref = canPhone
    ? `https://wa.me/${cleanPhoneForHref(contactPhone).replace(/^\+/, "")}`
    : "#";

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 pb-20">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/35 p-6 shadow-[0_28px_100px_-50px_rgba(0,0,0,0.9)] backdrop-blur-xl md:p-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(236,72,153,0.20),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative z-10 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
              <MessageCircle className="size-3.5" />
              Guest support
            </div>

            <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.06em] text-white md:text-6xl">
              Contact
              <span className="block bg-gradient-to-r from-pink-400 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
                {club.name}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-6 text-white/70 md:text-base">
              Have a question about bookings, availability, directions, or an
              activity? Contact the team directly and we’ll help you as quickly
              as possible.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {canPhone && (
                <a
                  href={phoneHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold text-black shadow-[0_18px_55px_-18px_rgba(34,211,238,0.9)] transition hover:scale-[1.03]"
                  style={{ background: accent }}
                >
                  <Phone className="size-4" />
                  Call now
                </a>
              )}

              {canEmail && (
                <a
                  href={`mailto:${encodeURIComponent(
                    contactEmail
                  )}?subject=${encodeURIComponent(
                    "Activity booking enquiry"
                  )}&body=${encodeURIComponent(
                    `Hi ${contactName},\n\nI’d like to ask about...\n\nBooking details:\n- Date:\n- Time:\n- Activity:\n- Number of guests:\n\nThanks,\n`
                  )}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.08] px-6 text-sm font-bold text-white/90 transition hover:bg-white/12"
                >
                  <Mail className="size-4" />
                  Email us
                </a>
              )}
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              {club.logoKey && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={club.logoKey}
                  alt={club.name}
                  className="h-12 w-12 rounded-2xl border border-white/10 bg-black/40 object-contain"
                />
              )}

              <div>
                <h2 className="font-semibold text-white">{club.name}</h2>
                <p className="text-xs text-white/55">
                  Direct support for guests and bookings
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              {canPhone && (
                <a
                  href={phoneHref}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.06]"
                >
                  <Phone className="size-5 text-cyan-300" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/45">
                      Phone
                    </p>
                    <p className="font-semibold text-white">{contactPhone}</p>
                  </div>
                </a>
              )}

              {canEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.06]"
                >
                  <Mail className="size-5 text-pink-300" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/45">
                      Email
                    </p>
                    <p className="break-all font-semibold text-white">
                      {contactEmail}
                    </p>
                  </div>
                </a>
              )}

              {club.location && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <MapPin className="size-5 text-cyan-200" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/45">
                      Location
                    </p>
                    <p className="font-semibold text-white">{club.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={<Clock3 className="size-5 text-cyan-300" />}
          title="Booking help"
          text="Questions about your reservation, payment, date, time, or confirmation."
        />
        <InfoCard
          icon={<Waves className="size-5 text-pink-300" />}
          title="Activity questions"
          text="Ask about duration, safety, what to bring, age limits, and availability."
        />
        <InfoCard
          icon={<HelpCircle className="size-5 text-cyan-200" />}
          title="Groups & changes"
          text="Need to change a booking or ask about a private group experience?"
        />
      </section>

      {canPhone && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-xl">
          <p className="text-sm text-white/65">
            Need fast help? Calling is usually the quickest option.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={phoneHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
            >
              <Phone className="size-4" />
              {contactPhone}
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </div>
        </section>
      )}
    </main>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="mb-3 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/25">
        {icon}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
    </div>
  );
}