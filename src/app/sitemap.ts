import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { briefs } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://commonground-two.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/proof`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/archive`, changeFrequency: "daily", priority: 0.6 },
  ];

  let topicPages: MetadataRoute.Sitemap = [];
  let archiveDatePages: MetadataRoute.Sitemap = [];

  try {
    // Unique topic slugs with most recent date
    const uniqueSlugs = await db
      .select({
        slug: briefs.slug,
        lastModified: sql<Date>`max(${briefs.date})`,
      })
      .from(briefs)
      .groupBy(briefs.slug)
      .orderBy(desc(sql`max(${briefs.date})`));

    topicPages = uniqueSlugs.map((row) => ({
      url: `${baseUrl}/topic/${row.slug}`,
      lastModified: row.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Unique dates with briefs
    const uniqueDates = await db
      .select({
        date: sql<Date>`date_trunc('day', ${briefs.date})`,
      })
      .from(briefs)
      .groupBy(sql`date_trunc('day', ${briefs.date})`)
      .orderBy(desc(sql`date_trunc('day', ${briefs.date})`));

    archiveDatePages = uniqueDates.map((row) => {
      const dateStr = row.date.toISOString().split("T")[0];
      return {
        url: `${baseUrl}/archive/${dateStr}`,
        lastModified: row.date,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      };
    });
  } catch {
    // Database may not be available during build
  }

  return [...staticPages, ...topicPages, ...archiveDatePages];
}
