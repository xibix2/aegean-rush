import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.aegeanrush.com";

  const clubs = await prisma.club.findMany({
    select: {
      id: true,
      slug: true,
      updatedAt: true,
    },
  });

  const activities = await prisma.activity.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      slug: true,
      updatedAt: true,
      club: {
        select: {
          slug: true,
        },
      },
    },
  });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const clubPages: MetadataRoute.Sitemap = clubs.flatMap((club) => [
    {
      url: `${baseUrl}/${club.slug}`,
      lastModified: club.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/${club.slug}/activities`,
      lastModified: club.updatedAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/${club.slug}/contact`,
      lastModified: club.updatedAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ]);

  const activityPages: MetadataRoute.Sitemap = activities.map((activity) => ({
    url: `${baseUrl}/${activity.club.slug}/activities/${
      activity.slug || activity.id
    }`,
    lastModified: activity.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...clubPages, ...activityPages];
}