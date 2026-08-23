import type { MetadataRoute } from "next";

import { listApprovedMembersForSitemap } from "@/lib/directory-queries";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      images: [absoluteUrl("/opengraph-image.png")],
    },
    {
      url: absoluteUrl("/directory"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/join"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
  try {
    const members = await listApprovedMembersForSitemap();
    return [
      ...publicPages,
      ...members.map((member) => ({
        url: absoluteUrl(`/directory/${member.id}`),
        lastModified: member.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error(
      "[sitemap] Could not load approved listings:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return publicPages;
  }
}
