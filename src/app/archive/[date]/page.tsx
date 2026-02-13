import type { Metadata } from "next";
import { db } from "@/lib/db";
import { briefs, billTopicLinks } from "@/lib/db/schema";
import { desc, and, gte, lte, inArray, sql } from "drizzle-orm";
import { format, parse, isValid } from "date-fns";
import { BriefCard } from "@/components/brief-card";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/json-ld";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 3600;

function parseDate(dateStr: string): Date | null {
  const d = parse(dateStr, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date: dateStr } = await params;
  const d = parseDate(dateStr);

  if (!d) return { title: "Invalid Date" };

  const formatted = format(d, "MMMM d, yyyy");
  const description = `CommonGround daily brief for ${formatted} — AI analysis of Congressional speeches with steelmanned positions and compromise paths.`;

  return {
    title: `Daily Brief — ${formatted}`,
    description,
    openGraph: {
      type: "article",
      title: `Daily Brief — ${formatted} | CommonGround`,
      description,
    },
    twitter: {
      card: "summary",
      title: `Daily Brief — ${formatted} | CommonGround`,
      description,
    },
    alternates: { canonical: `/archive/${dateStr}` },
  };
}

export default async function ArchiveDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date: dateStr } = await params;
  const d = parseDate(dateStr);

  if (!d) notFound();

  const startOfDay = new Date(d);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(d);
  endOfDay.setHours(23, 59, 59, 999);

  const dayBriefs = await db
    .select()
    .from(briefs)
    .where(and(gte(briefs.date, startOfDay), lte(briefs.date, endOfDay)))
    .orderBy(desc(briefs.createdAt));

  if (dayBriefs.length === 0) notFound();

  // Get bill counts per topic slug
  let billCountMap: Record<string, number> = {};
  try {
    const slugs = dayBriefs.map((b) => b.slug);
    const billCounts = await db
      .select({
        topicSlug: billTopicLinks.topicSlug,
        count: sql<number>`count(*)::int`,
      })
      .from(billTopicLinks)
      .where(inArray(billTopicLinks.topicSlug, slugs))
      .groupBy(billTopicLinks.topicSlug);
    billCountMap = Object.fromEntries(
      billCounts.map((r) => [r.topicSlug, r.count])
    );
  } catch {
    // Bills table may not exist yet
  }

  const formatted = format(d, "MMMM d, yyyy");

  return (
    <div>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Archive", path: "/archive" },
          { name: formatted, path: `/archive/${dateStr}` },
        ])}
      />

      <Link
        href="/archive"
        className="text-sm text-muted hover:text-foreground transition-colors mb-6 inline-block"
      >
        &larr; Back to archive
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Daily Brief &mdash; {formatted}
        </h1>
        <span className="text-sm text-muted">
          {dayBriefs.length} topic{dayBriefs.length !== 1 ? "s" : ""} analyzed
        </span>
      </div>

      <div className="grid gap-6">
        {dayBriefs.map((brief) => (
          <BriefCard
            key={brief.id}
            brief={brief}
            relatedBillCount={billCountMap[brief.slug] || 0}
          />
        ))}
      </div>
    </div>
  );
}
