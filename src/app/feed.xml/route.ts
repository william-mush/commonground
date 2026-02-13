import { db } from "@/lib/db";
import { briefs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const revalidate = 3600;

export async function GET() {
  const baseUrl = "https://commonground-two.vercel.app";

  let recentBriefs: (typeof briefs.$inferSelect)[] = [];
  try {
    recentBriefs = await db
      .select()
      .from(briefs)
      .orderBy(desc(briefs.date))
      .limit(50);
  } catch {
    // Database not connected
  }

  const items = recentBriefs
    .map((brief) => {
      const dateStr = brief.date.toUTCString();
      const desc = `Conservative position: ${brief.redPosition.slice(0, 200)}... Progressive position: ${brief.bluePosition.slice(0, 200)}...`;
      return `    <item>
      <title><![CDATA[${brief.topic}]]></title>
      <link>${baseUrl}/topic/${brief.slug}</link>
      <guid isPermaLink="true">${baseUrl}/topic/${brief.slug}</guid>
      <pubDate>${dateStr}</pubDate>
      <description><![CDATA[${desc}]]></description>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CommonGround — Where Democracy Finds Agreement</title>
    <link>${baseUrl}</link>
    <description>AI-powered analysis of Congressional speeches, finding genuine common ground between parties.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
