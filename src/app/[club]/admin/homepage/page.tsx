// src/app/[club]/admin/homepage/page.tsx
import { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import path from "node:path";
import CoverPicker from "@/components/ui/CoverPicker";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ club: string }>;
};

const SECTION_LABELS: Record<string, string> = {
  HERO: "Hero",
  GALLERY: "Gallery",
  ACTIVITIES: "Activities",
  HOW_IT_WORKS: "How it works",
  WHY_CHOOSE_US: "Why choose us",
  LOCATION: "Location",
  FAQ: "FAQ",
  FINAL_CTA: "Final CTA",
};

const FEATURE_SECTION_TYPES = new Set(["HOW_IT_WORKS", "WHY_CHOOSE_US"]);

async function saveImageFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type?.startsWith("image/")) return null;

  const ext = path.extname(file.name || "upload.jpg") || ".jpg";

  const filename = `homepage_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}${ext}`;

  const blob = await put(filename, file, {
    access: "public",
  });

  return blob.url;
}

export default async function AdminHomepagePage({ params }: PageProps) {
  const { club } = await params;
  const tenant = await requireTenant(club);

  async function saveSection(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const sectionId = String(formData.get("sectionId") || "");
    const type = String(formData.get("type") || "");
    const enabled = formData.get("enabled") === "on";

    const title = normalizeText(formData.get("title"));
    const subtitle = normalizeText(formData.get("subtitle"));
    const body = normalizeText(formData.get("body"));
    const badgeText = normalizeText(formData.get("badgeText"));

    const primaryCtaLabel = normalizeText(formData.get("primaryCtaLabel"));
    const primaryCtaHref = normalizeText(formData.get("primaryCtaHref"));
    const secondaryCtaLabel = normalizeText(formData.get("secondaryCtaLabel"));
    const secondaryCtaHref = normalizeText(formData.get("secondaryCtaHref"));

    const highlightTitle = normalizeText(formData.get("highlightTitle"));
    const microText = normalizeText(formData.get("microText"));

    if (!slug || !sectionId || !type) return;

    const verifiedTenant = await requireTenant(slug);

    const existing = await prisma.homepageSection.findFirst({
      where: {
        id: sectionId,
        clubId: verifiedTenant.id,
      },
      select: {
        id: true,
        dataJson: true,
      },
    });

    if (!existing) return;

    let nextDataJson: Record<string, unknown> = {};
    if (existing.dataJson && typeof existing.dataJson === "object") {
      nextDataJson = { ...(existing.dataJson as Record<string, unknown>) };
    }

    if (type === "HERO") {
      if (highlightTitle) nextDataJson.highlightTitle = highlightTitle;
      else delete nextDataJson.highlightTitle;

      if (microText) nextDataJson.microText = microText;
      else delete nextDataJson.microText;
    }

    await prisma.homepageSection.update({
      where: { id: existing.id },
      data: {
        enabled,
        title,
        subtitle,
        body,
        badgeText,
        primaryCtaLabel,
        primaryCtaHref,
        secondaryCtaLabel,
        secondaryCtaHref,
        dataJson: Object.keys(nextDataJson).length
          ? (nextDataJson as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function moveSection(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const sectionId = String(formData.get("sectionId") || "");
    const direction = String(formData.get("direction") || "");

    if (!slug || !sectionId || !direction) return;

    const verifiedTenant = await requireTenant(slug);

    const sections = await prisma.homepageSection.findMany({
      where: { clubId: verifiedTenant.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        sortOrder: true,
      },
    });

    const currentIndex = sections.findIndex((s) => s.id === sectionId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : direction === "down"
        ? currentIndex + 1
        : currentIndex;

    if (
      targetIndex < 0 ||
      targetIndex >= sections.length ||
      targetIndex === currentIndex
    ) {
      return;
    }

    const reordered = [...sections];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await prisma.$transaction(
      reordered.map((section, index) =>
        prisma.homepageSection.update({
          where: { id: section.id },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function addGalleryImage(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const sectionId = String(formData.get("sectionId") || "");
    const altText = normalizeText(formData.get("altText"));
    const caption = normalizeText(formData.get("caption"));
    const uploaded = (formData.get("imageFile") as File) || null;

    if (!slug || !sectionId) return;

    const verifiedTenant = await requireTenant(slug);

    const section = await prisma.homepageSection.findFirst({
      where: {
        id: sectionId,
        clubId: verifiedTenant.id,
        type: "GALLERY",
      },
      select: { id: true },
    });

    if (!section) return;

    const imageUrl = await saveImageFile(uploaded);
    if (!imageUrl) return;

    const lastImage = await prisma.homepageGalleryImage.findFirst({
      where: { sectionId: section.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.homepageGalleryImage.create({
      data: {
        sectionId: section.id,
        imageUrl,
        altText,
        caption,
        sortOrder: (lastImage?.sortOrder ?? -1) + 1,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function saveGalleryImage(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const imageId = String(formData.get("imageId") || "");
    const altText = normalizeText(formData.get("altText"));
    const caption = normalizeText(formData.get("caption"));
    const replaceFile = (formData.get("replaceFile") as File) || null;

    if (!slug || !imageId) return;

    const verifiedTenant = await requireTenant(slug);

    const image = await prisma.homepageGalleryImage.findFirst({
      where: {
        id: imageId,
        section: {
          clubId: verifiedTenant.id,
          type: "GALLERY",
        },
      },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (!image) return;

    const uploadedUrl = await saveImageFile(replaceFile);

    await prisma.homepageGalleryImage.update({
      where: { id: image.id },
      data: {
        imageUrl: uploadedUrl || image.imageUrl,
        altText,
        caption,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function deleteGalleryImage(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const imageId = String(formData.get("imageId") || "");

    if (!slug || !imageId) return;

    const verifiedTenant = await requireTenant(slug);

    const image = await prisma.homepageGalleryImage.findFirst({
      where: {
        id: imageId,
        section: {
          clubId: verifiedTenant.id,
          type: "GALLERY",
        },
      },
      select: { id: true },
    });

    if (!image) return;

    await prisma.homepageGalleryImage.delete({
      where: { id: image.id },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function moveGalleryImage(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const sectionId = String(formData.get("sectionId") || "");
    const imageId = String(formData.get("imageId") || "");
    const direction = String(formData.get("direction") || "");

    if (!slug || !sectionId || !imageId || !direction) return;

    const verifiedTenant = await requireTenant(slug);

    const section = await prisma.homepageSection.findFirst({
      where: {
        id: sectionId,
        clubId: verifiedTenant.id,
        type: "GALLERY",
      },
      select: { id: true },
    });

    if (!section) return;

    const images = await prisma.homepageGalleryImage.findMany({
      where: { sectionId: section.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        sortOrder: true,
      },
    });

    const currentIndex = images.findIndex((img) => img.id === imageId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : direction === "down"
        ? currentIndex + 1
        : currentIndex;

    if (
      targetIndex < 0 ||
      targetIndex >= images.length ||
      targetIndex === currentIndex
    ) {
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await prisma.$transaction(
      reordered.map((image, index) =>
        prisma.homepageGalleryImage.update({
          where: { id: image.id },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function addFeatureItem(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const sectionId = String(formData.get("sectionId") || "");
    const title = normalizeText(formData.get("itemTitle"));
    const description = normalizeText(formData.get("itemDescription"));
    const icon = normalizeText(formData.get("itemIcon"));

    if (!slug || !sectionId || !title) return;

    const verifiedTenant = await requireTenant(slug);

    const section = await prisma.homepageSection.findFirst({
      where: {
        id: sectionId,
        clubId: verifiedTenant.id,
        type: { in: ["HOW_IT_WORKS", "WHY_CHOOSE_US"] },
      },
      select: { id: true },
    });

    if (!section) return;

    const lastItem = await prisma.homepageFeatureItem.findFirst({
      where: { sectionId: section.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.homepageFeatureItem.create({
      data: {
        sectionId: section.id,
        title,
        description,
        icon,
        sortOrder: (lastItem?.sortOrder ?? -1) + 1,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function saveFeatureItem(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const itemId = String(formData.get("itemId") || "");
    const title = normalizeText(formData.get("itemTitle"));
    const description = normalizeText(formData.get("itemDescription"));
    const icon = normalizeText(formData.get("itemIcon"));

    if (!slug || !itemId || !title) return;

    const verifiedTenant = await requireTenant(slug);

    const item = await prisma.homepageFeatureItem.findFirst({
      where: {
        id: itemId,
        section: {
          clubId: verifiedTenant.id,
          type: { in: ["HOW_IT_WORKS", "WHY_CHOOSE_US"] },
        },
      },
      select: { id: true },
    });

    if (!item) return;

    await prisma.homepageFeatureItem.update({
      where: { id: item.id },
      data: {
        title,
        description,
        icon,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function deleteFeatureItem(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const itemId = String(formData.get("itemId") || "");

    if (!slug || !itemId) return;

    const verifiedTenant = await requireTenant(slug);

    const item = await prisma.homepageFeatureItem.findFirst({
      where: {
        id: itemId,
        section: {
          clubId: verifiedTenant.id,
          type: { in: ["HOW_IT_WORKS", "WHY_CHOOSE_US"] },
        },
      },
      select: { id: true },
    });

    if (!item) return;

    await prisma.homepageFeatureItem.delete({
      where: { id: item.id },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function moveFeatureItem(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const sectionId = String(formData.get("sectionId") || "");
    const itemId = String(formData.get("itemId") || "");
    const direction = String(formData.get("direction") || "");

    if (!slug || !sectionId || !itemId || !direction) return;

    const verifiedTenant = await requireTenant(slug);

    const section = await prisma.homepageSection.findFirst({
      where: {
        id: sectionId,
        clubId: verifiedTenant.id,
        type: { in: ["HOW_IT_WORKS", "WHY_CHOOSE_US"] },
      },
      select: { id: true },
    });

    if (!section) return;

    const items = await prisma.homepageFeatureItem.findMany({
      where: { sectionId: section.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        sortOrder: true,
      },
    });

    const currentIndex = items.findIndex((item) => item.id === itemId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : direction === "down"
        ? currentIndex + 1
        : currentIndex;

    if (
      targetIndex < 0 ||
      targetIndex >= items.length ||
      targetIndex === currentIndex
    ) {
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await prisma.$transaction(
      reordered.map((item, index) =>
        prisma.homepageFeatureItem.update({
          where: { id: item.id },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function addFaqItem(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const sectionId = String(formData.get("sectionId") || "");
    const question = normalizeText(formData.get("faqQuestion"));
    const answer = normalizeText(formData.get("faqAnswer"));

    if (!slug || !sectionId || !question || !answer) return;

    const verifiedTenant = await requireTenant(slug);

    const section = await prisma.homepageSection.findFirst({
      where: {
        id: sectionId,
        clubId: verifiedTenant.id,
        type: "FAQ",
      },
      select: { id: true },
    });

    if (!section) return;

    const lastItem = await prisma.homepageFaqItem.findFirst({
      where: { sectionId: section.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await prisma.homepageFaqItem.create({
      data: {
        sectionId: section.id,
        question,
        answer,
        sortOrder: (lastItem?.sortOrder ?? -1) + 1,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function saveFaqItem(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const itemId = String(formData.get("itemId") || "");
    const question = normalizeText(formData.get("faqQuestion"));
    const answer = normalizeText(formData.get("faqAnswer"));

    if (!slug || !itemId || !question || !answer) return;

    const verifiedTenant = await requireTenant(slug);

    const item = await prisma.homepageFaqItem.findFirst({
      where: {
        id: itemId,
        section: {
          clubId: verifiedTenant.id,
          type: "FAQ",
        },
      },
      select: { id: true },
    });

    if (!item) return;

    await prisma.homepageFaqItem.update({
      where: { id: item.id },
      data: {
        question,
        answer,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function deleteFaqItem(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const itemId = String(formData.get("itemId") || "");

    if (!slug || !itemId) return;

    const verifiedTenant = await requireTenant(slug);

    const item = await prisma.homepageFaqItem.findFirst({
      where: {
        id: itemId,
        section: {
          clubId: verifiedTenant.id,
          type: "FAQ",
        },
      },
      select: { id: true },
    });

    if (!item) return;

    await prisma.homepageFaqItem.delete({
      where: { id: item.id },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  async function moveFaqItem(formData: FormData) {
    "use server";

    const slug = String(formData.get("clubSlug") || "");
    const sectionId = String(formData.get("sectionId") || "");
    const itemId = String(formData.get("itemId") || "");
    const direction = String(formData.get("direction") || "");

    if (!slug || !sectionId || !itemId || !direction) return;

    const verifiedTenant = await requireTenant(slug);

    const section = await prisma.homepageSection.findFirst({
      where: {
        id: sectionId,
        clubId: verifiedTenant.id,
        type: "FAQ",
      },
      select: { id: true },
    });

    if (!section) return;

    const items = await prisma.homepageFaqItem.findMany({
      where: { sectionId: section.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        sortOrder: true,
      },
    });

    const currentIndex = items.findIndex((item) => item.id === itemId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : direction === "down"
        ? currentIndex + 1
        : currentIndex;

    if (
      targetIndex < 0 ||
      targetIndex >= items.length ||
      targetIndex === currentIndex
    ) {
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await prisma.$transaction(
      reordered.map((item, index) =>
        prisma.homepageFaqItem.update({
          where: { id: item.id },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/admin/homepage`);
  }

  const sections = await prisma.homepageSection.findMany({
    where: { clubId: tenant.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      type: true,
      enabled: true,
      sortOrder: true,
      title: true,
      subtitle: true,
      body: true,
      badgeText: true,
      primaryCtaLabel: true,
      primaryCtaHref: true,
      secondaryCtaLabel: true,
      secondaryCtaHref: true,
      dataJson: true,
      galleryImages: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          caption: true,
          sortOrder: true,
        },
      },
      faqItems: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
        },
      },
      featureItems: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          sortOrder: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Homepage editor
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Customize your club homepage
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65 md:text-base">
              Edit the main landing page for this club, control which sections
              appear, and fine-tune the first impression guests see.
            </p>
          </div>

          <a
            href={`/${tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
          >
            Open live page
          </a>
        </div>
      </div>

      <div className="grid gap-6">
        {sections.map((section, index) => {
          const dataJson =
            section.dataJson && typeof section.dataJson === "object"
              ? (section.dataJson as Record<string, unknown>)
              : null;

          const highlightTitle =
            typeof dataJson?.highlightTitle === "string"
              ? dataJson.highlightTitle
              : "";

          const microText =
            typeof dataJson?.microText === "string" ? dataJson.microText : "";

          return (
            <div
              key={section.id}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-7"
            >
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                    <span>Section</span>
                    <span className="text-white/35">•</span>
                    <span>{SECTION_LABELS[section.type] || section.type}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">
                    {SECTION_LABELS[section.type] || section.type}
                  </h2>
                  <p className="mt-1 text-sm text-white/55">
                    Position #{index + 1} on the homepage
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={moveSection}>
                    <input type="hidden" name="clubSlug" value={tenant.slug} />
                    <input type="hidden" name="sectionId" value={section.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white/80 transition hover:bg-white/[0.08]"
                    >
                      Up
                    </button>
                  </form>

                  <form action={moveSection}>
                    <input type="hidden" name="clubSlug" value={tenant.slug} />
                    <input type="hidden" name="sectionId" value={section.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white/80 transition hover:bg-white/[0.08]"
                    >
                      Down
                    </button>
                  </form>
                </div>
              </div>

              <form action={saveSection} className="space-y-5">
                <input type="hidden" name="clubSlug" value={tenant.slug} />
                <input type="hidden" name="sectionId" value={section.id} />
                <input type="hidden" name="type" value={section.type} />

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={section.enabled}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Show this section on the homepage
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Badge / label"
                    name="badgeText"
                    defaultValue={section.badgeText || ""}
                    placeholder="Aegean thrill experiences"
                  />
                  <Field
                    label="Title"
                    name="title"
                    defaultValue={section.title || ""}
                    placeholder="Section title"
                  />
                </div>

                <div className="grid gap-4">
                  <TextAreaField
                    label="Subtitle"
                    name="subtitle"
                    defaultValue={section.subtitle || ""}
                    placeholder="Short supporting text"
                    rows={3}
                  />
                </div>

                {(section.type === "LOCATION" ||
                  section.type === "FINAL_CTA") && (
                  <div className="grid gap-4">
                    <TextAreaField
                      label="Body"
                      name="body"
                      defaultValue={section.body || ""}
                      placeholder="Additional section text"
                      rows={4}
                    />
                  </div>
                )}

                {section.type === "HERO" && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Highlighted title line"
                        name="highlightTitle"
                        defaultValue={highlightTitle}
                        placeholder="Ride the sea. Feel the rush."
                      />
                      <Field
                        label="Micro text"
                        name="microText"
                        defaultValue={microText}
                        placeholder="No calls. No waiting. Book instantly."
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Primary CTA label"
                        name="primaryCtaLabel"
                        defaultValue={section.primaryCtaLabel || ""}
                        placeholder="Explore experiences"
                      />
                      <Field
                        label="Primary CTA href"
                        name="primaryCtaHref"
                        defaultValue={section.primaryCtaHref || ""}
                        placeholder={`/${tenant.slug}/activities`}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Secondary CTA label"
                        name="secondaryCtaLabel"
                        defaultValue={section.secondaryCtaLabel || ""}
                        placeholder="Find us"
                      />
                      <Field
                        label="Secondary CTA href"
                        name="secondaryCtaHref"
                        defaultValue={section.secondaryCtaHref || ""}
                        placeholder="#meeting-point"
                      />
                    </div>
                  </>
                )}

                {(section.type === "LOCATION" ||
                  section.type === "FINAL_CTA") && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Primary CTA label"
                      name="primaryCtaLabel"
                      defaultValue={section.primaryCtaLabel || ""}
                      placeholder="Explore experiences"
                    />
                    <Field
                      label="Primary CTA href"
                      name="primaryCtaHref"
                      defaultValue={section.primaryCtaHref || ""}
                      placeholder={`/${tenant.slug}/activities`}
                    />
                  </div>
                )}

                {section.type === "FINAL_CTA" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Secondary CTA label"
                      name="secondaryCtaLabel"
                      defaultValue={section.secondaryCtaLabel || ""}
                      placeholder="Find meeting point"
                    />
                    <Field
                      label="Secondary CTA href"
                      name="secondaryCtaHref"
                      defaultValue={section.secondaryCtaHref || ""}
                      placeholder="#meeting-point"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-5 text-sm font-medium text-white shadow-[0_12px_40px_-16px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
                  >
                    Save section
                  </button>
                </div>
              </form>

              {FEATURE_SECTION_TYPES.has(section.type) && (
                <div className="mt-8 border-t border-white/10 pt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {section.type === "HOW_IT_WORKS"
                        ? "Steps"
                        : "Feature cards"}
                    </h3>
                    <p className="mt-1 text-sm text-white/55">
                      {section.type === "HOW_IT_WORKS"
                        ? "Customize the exact steps guests see before booking."
                        : "Customize the trust signals and value points for this business."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {section.featureItems.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {section.type === "HOW_IT_WORKS"
                                ? `Step #${itemIndex + 1}`
                                : `Card #${itemIndex + 1}`}
                            </p>
                            <p className="text-xs text-white/45">
                              Reorder, edit, or remove this item.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <form action={moveFeatureItem}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="sectionId"
                                value={section.id}
                              />
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="direction"
                                value="up"
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white/80 transition hover:bg-white/[0.08]"
                              >
                                Up
                              </button>
                            </form>

                            <form action={moveFeatureItem}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="sectionId"
                                value={section.id}
                              />
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="direction"
                                value="down"
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white/80 transition hover:bg-white/[0.08]"
                              >
                                Down
                              </button>
                            </form>

                            <form action={deleteFeatureItem}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-3 text-xs text-red-200 transition hover:bg-red-500/15"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </div>

                        <form action={saveFeatureItem} className="space-y-4">
                          <input
                            type="hidden"
                            name="clubSlug"
                            value={tenant.slug}
                          />
                          <input
                            type="hidden"
                            name="itemId"
                            value={item.id}
                          />

                          <div className="grid gap-4 md:grid-cols-2">
                            <Field
                              label={
                                section.type === "HOW_IT_WORKS"
                                  ? "Step title"
                                  : "Card title"
                              }
                              name="itemTitle"
                              defaultValue={item.title}
                              placeholder={
                                section.type === "HOW_IT_WORKS"
                                  ? "Pick your time"
                                  : "5-star reviews"
                              }
                            />
                            <Field
                              label="Icon"
                              name="itemIcon"
                              defaultValue={item.icon || ""}
                              placeholder={
                                section.type === "HOW_IT_WORKS"
                                  ? "calendar"
                                  : "shield"
                              }
                            />
                          </div>

                          <TextAreaField
                            label="Description"
                            name="itemDescription"
                            defaultValue={item.description || ""}
                            placeholder={
                              section.type === "HOW_IT_WORKS"
                                ? "Choose your date and time with real-time availability."
                                : "Trusted by guests for a smooth premium experience."
                            }
                            rows={3}
                          />

                          <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
                          >
                            Save item
                          </button>
                        </form>
                      </div>
                    ))}

                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 md:p-5">
                      <h4 className="text-base font-semibold text-white">
                        {section.type === "HOW_IT_WORKS"
                          ? "Add new step"
                          : "Add new feature card"}
                      </h4>
                      <p className="mt-1 text-sm text-white/55">
                        {section.type === "HOW_IT_WORKS"
                          ? "Add another step to the booking flow."
                          : "Add another custom business strength or trust signal."}
                      </p>

                      <form action={addFeatureItem} className="mt-4 space-y-4">
                        <input
                          type="hidden"
                          name="clubSlug"
                          value={tenant.slug}
                        />
                        <input
                          type="hidden"
                          name="sectionId"
                          value={section.id}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <Field
                            label={
                              section.type === "HOW_IT_WORKS"
                                ? "Step title"
                                : "Card title"
                            }
                            name="itemTitle"
                            placeholder={
                              section.type === "HOW_IT_WORKS"
                                ? "Pay and you're done"
                                : "15 years of experience"
                            }
                          />
                          <Field
                            label="Icon"
                            name="itemIcon"
                            placeholder={
                              section.type === "HOW_IT_WORKS"
                                ? "check"
                                : "sparkles"
                            }
                          />
                        </div>

                        <TextAreaField
                          label="Description"
                          name="itemDescription"
                          placeholder={
                            section.type === "HOW_IT_WORKS"
                              ? "Complete payment securely and get instant confirmation."
                              : "Highlight a review score, years of experience, or another trust point."
                          }
                          rows={3}
                        />

                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-[0_12px_40px_-16px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
                        >
                          Add item
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {section.type === "FAQ" && (
                <div className="mt-8 border-t border-white/10 pt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      FAQ items
                    </h3>
                    <p className="mt-1 text-sm text-white/55">
                      Add the most common guest questions and answer them clearly.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {section.faqItems.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Question #{itemIndex + 1}
                            </p>
                            <p className="text-xs text-white/45">
                              Reorder, edit, or remove this FAQ entry.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <form action={moveFaqItem}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="sectionId"
                                value={section.id}
                              />
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="direction"
                                value="up"
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white/80 transition hover:bg-white/[0.08]"
                              >
                                Up
                              </button>
                            </form>

                            <form action={moveFaqItem}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="sectionId"
                                value={section.id}
                              />
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="direction"
                                value="down"
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white/80 transition hover:bg-white/[0.08]"
                              >
                                Down
                              </button>
                            </form>

                            <form action={deleteFaqItem}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="itemId"
                                value={item.id}
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-3 text-xs text-red-200 transition hover:bg-red-500/15"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </div>

                        <form action={saveFaqItem} className="space-y-4">
                          <input
                            type="hidden"
                            name="clubSlug"
                            value={tenant.slug}
                          />
                          <input
                            type="hidden"
                            name="itemId"
                            value={item.id}
                          />

                          <Field
                            label="Question"
                            name="faqQuestion"
                            defaultValue={item.question}
                            placeholder="Do I need experience before booking?"
                          />

                          <TextAreaField
                            label="Answer"
                            name="faqAnswer"
                            defaultValue={item.answer}
                            placeholder="No, many activities are beginner-friendly and the club can guide guests to the best option."
                            rows={4}
                          />

                          <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
                          >
                            Save item
                          </button>
                        </form>
                      </div>
                    ))}

                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 md:p-5">
                      <h4 className="text-base font-semibold text-white">
                        Add new FAQ item
                      </h4>
                      <p className="mt-1 text-sm text-white/55">
                        Add another question guests often ask before booking.
                      </p>

                      <form action={addFaqItem} className="mt-4 space-y-4">
                        <input
                          type="hidden"
                          name="clubSlug"
                          value={tenant.slug}
                        />
                        <input
                          type="hidden"
                          name="sectionId"
                          value={section.id}
                        />

                        <Field
                          label="Question"
                          name="faqQuestion"
                          placeholder="What should I bring with me?"
                        />

                        <TextAreaField
                          label="Answer"
                          name="faqAnswer"
                          placeholder="Bring swimwear, a towel, sunscreen, and any extra essentials mentioned by the club."
                          rows={4}
                        />

                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-[0_12px_40px_-16px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
                        >
                          Add item
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {section.type === "GALLERY" && (
                <div className="mt-8 border-t border-white/10 pt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Gallery images
                    </h3>
                    <p className="mt-1 text-sm text-white/55">
                      Upload gallery photos directly from your device.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {section.galleryImages.map((image, imageIndex) => (
                      <div
                        key={image.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Image #{imageIndex + 1}
                            </p>
                            <p className="text-xs text-white/45">
                              Reorder, replace, edit, or remove this gallery
                              image.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <form action={moveGalleryImage}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="sectionId"
                                value={section.id}
                              />
                              <input
                                type="hidden"
                                name="imageId"
                                value={image.id}
                              />
                              <input
                                type="hidden"
                                name="direction"
                                value="up"
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white/80 transition hover:bg-white/[0.08]"
                              >
                                Up
                              </button>
                            </form>

                            <form action={moveGalleryImage}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="sectionId"
                                value={section.id}
                              />
                              <input
                                type="hidden"
                                name="imageId"
                                value={image.id}
                              />
                              <input
                                type="hidden"
                                name="direction"
                                value="down"
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white/80 transition hover:bg-white/[0.08]"
                              >
                                Down
                              </button>
                            </form>

                            <form action={deleteGalleryImage}>
                              <input
                                type="hidden"
                                name="clubSlug"
                                value={tenant.slug}
                              />
                              <input
                                type="hidden"
                                name="imageId"
                                value={image.id}
                              />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-3 text-xs text-red-200 transition hover:bg-red-500/15"
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </div>

                        <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.imageUrl}
                            alt={
                              image.altText ||
                              image.caption ||
                              `Gallery image ${imageIndex + 1}`
                            }
                            className="h-56 w-full object-cover"
                          />
                        </div>

                        <form
                          action={saveGalleryImage}
                          encType="multipart/form-data"
                          className="space-y-4"
                        >
                          <input
                            type="hidden"
                            name="clubSlug"
                            value={tenant.slug}
                          />
                          <input
                            type="hidden"
                            name="imageId"
                            value={image.id}
                          />

                          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                            <div className="grid gap-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                  label="Alt text"
                                  name="altText"
                                  defaultValue={image.altText || ""}
                                  placeholder="Boat at the marina"
                                />
                                <Field
                                  label="Caption"
                                  name="caption"
                                  defaultValue={image.caption || ""}
                                  placeholder="Golden hour by the water"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-medium text-white/80">
                                Replace image
                              </label>
                              <CoverPicker name="replaceFile" size={220} />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]"
                          >
                            Save image
                          </button>
                        </form>
                      </div>
                    ))}

                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 md:p-5">
                      <h4 className="text-base font-semibold text-white">
                        Add new image
                      </h4>
                      <p className="mt-1 text-sm text-white/55">
                        Upload a new image to this club’s gallery section.
                      </p>

                      <form
                        action={addGalleryImage}
                        encType="multipart/form-data"
                        className="mt-4 space-y-4"
                      >
                        <input
                          type="hidden"
                          name="clubSlug"
                          value={tenant.slug}
                        />
                        <input
                          type="hidden"
                          name="sectionId"
                          value={section.id}
                        />

                        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                          <div className="grid gap-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <Field
                                label="Alt text"
                                name="altText"
                                placeholder="Jet skis lined up near the beach"
                              />
                              <Field
                                label="Caption"
                                name="caption"
                                placeholder="Fast rides, clear water, summer energy"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-white/80">
                              Upload image
                            </label>
                            <CoverPicker name="imageFile" size={220} />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-[0_12px_40px_-16px_rgba(236,72,153,0.75)] transition hover:scale-[1.02]"
                        >
                          Add image
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function normalizeText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function Field(props: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">
        {props.label}
      </span>
      <input
        type="text"
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-pink-400/40"
      />
    </label>
  );
}

function TextAreaField(props: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/80">
        {props.label}
      </span>
      <textarea
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        rows={props.rows ?? 4}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-pink-400/40"
      />
    </label>
  );
}