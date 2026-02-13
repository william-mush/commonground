import { db } from "@/lib/db";
import { briefs, billTopicLinks } from "@/lib/db/schema";
import { desc, and, gte, lte, inArray, sql } from "drizzle-orm";
import { format } from "date-fns";
import { BriefCard } from "@/components/brief-card";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/json-ld";

export const revalidate = 3600; // Revalidate every hour

export default async function HomePage() {
  // Try to find the most recent date with briefs
  let todaysBriefs: (typeof briefs.$inferSelect)[] = [];
  let briefDate: Date | null = null;

  try {
    const mostRecent = await db
      .select()
      .from(briefs)
      .orderBy(desc(briefs.date))
      .limit(1);

    if (mostRecent.length > 0) {
      briefDate = mostRecent[0].date;
      const startOfDay = new Date(briefDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(briefDate);
      endOfDay.setHours(23, 59, 59, 999);

      todaysBriefs = await db
        .select()
        .from(briefs)
        .where(and(gte(briefs.date, startOfDay), lte(briefs.date, endOfDay)))
        .orderBy(desc(briefs.createdAt));
    }
  } catch {
    // Database not connected yet — show empty state
  }

  // Get bill counts per topic slug
  let billCountMap: Record<string, number> = {};
  try {
    if (todaysBriefs.length > 0) {
      const slugs = todaysBriefs.map((b) => b.slug);
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
    }
  } catch {
    // Bills table may not exist yet
  }

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }])} />
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Where Democracy Finds Agreement
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          AI agents analyze daily Congressional speeches, steelman both sides,
          and find genuine paths to compromise — with democratic principles as
          the non-negotiable foundation.
        </p>
      </div>

      {/* How it works (brief) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          {
            step: "1",
            title: "Ingest",
            desc: "Daily Congressional Record speeches are pulled from GovInfo and categorized by topic.",
          },
          {
            step: "2",
            title: "Steelman",
            desc: "Two AI agents present the strongest version of each side's arguments. No strawmen.",
          },
          {
            step: "3",
            title: "Bridge",
            desc: "A mediator agent finds shared values and proposes compromise paths, guarded by democratic principles.",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="border border-card-border bg-card rounded-lg p-4 text-center"
          >
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-bg border border-purple-border text-purple-accent text-sm font-bold mb-2">
              {item.step}
            </div>
            <h3 className="font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-muted">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Daily Briefs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {briefDate
              ? `Daily Brief — ${format(briefDate, "MMMM d, yyyy")}`
              : "Daily Brief"}
          </h2>
          {briefDate && (
            <span className="text-sm text-muted">
              {todaysBriefs.length} topic
              {todaysBriefs.length !== 1 ? "s" : ""} analyzed
            </span>
          )}
        </div>

        {todaysBriefs.length > 0 ? (
          <div className="grid gap-6">
            {todaysBriefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} relatedBillCount={billCountMap[brief.slug] || 0} />
            ))}
          </div>
        ) : (
          <div className="border border-card-border bg-card rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No briefs yet</h3>
            <p className="text-muted max-w-md mx-auto">
              CommonGround analyzes Congressional speeches daily. Briefs will
              appear here once the system is connected to a live database and
              the daily ingestion pipeline runs.
            </p>
            <div className="mt-6 p-4 rounded-lg bg-purple-bg border border-purple-border text-left max-w-lg mx-auto">
              <p className="text-sm font-mono text-purple-accent mb-2">
                To get started:
              </p>
              <ol className="text-sm text-muted space-y-1 list-decimal list-inside">
                <li>Set up a Neon/Vercel Postgres database</li>
                <li>
                  Run{" "}
                  <code className="text-purple-accent">
                    npx drizzle-kit push
                  </code>{" "}
                  to create tables
                </li>
                <li>
                  Get a free API key from{" "}
                  <code className="text-purple-accent">api.data.gov</code>
                </li>
                <li>
                  Add your{" "}
                  <code className="text-purple-accent">
                    ANTHROPIC_API_KEY
                  </code>
                </li>
                <li>Trigger the ingest + analyze cron endpoints</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
