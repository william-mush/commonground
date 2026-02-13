import type { Metadata } from "next";
import { db } from "@/lib/db";
import { briefs } from "@/lib/db/schema";
import { sql, desc } from "drizzle-orm";
import { format } from "date-fns";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/json-ld";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Browse the full archive of CommonGround daily briefs — AI analysis of Congressional speeches with steelmanned positions and compromise paths.",
  openGraph: {
    type: "website",
    title: "Archive | CommonGround",
    description:
      "Browse the full archive of CommonGround daily briefs — AI analysis of Congressional speeches.",
  },
  twitter: {
    card: "summary",
    title: "Archive | CommonGround",
    description:
      "Browse the full archive of CommonGround daily briefs.",
  },
  alternates: { canonical: "/archive" },
};

type DateGroup = {
  date: Date;
  count: number;
};

export default async function ArchivePage() {
  let dateGroups: DateGroup[] = [];

  try {
    const rows = await db
      .select({
        date: sql<Date>`date_trunc('day', ${briefs.date})`.as("day"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(briefs)
      .groupBy(sql`date_trunc('day', ${briefs.date})`)
      .orderBy(desc(sql`date_trunc('day', ${briefs.date})`));

    dateGroups = rows.map((r) => ({
      date: new Date(r.date),
      count: r.count,
    }));
  } catch {
    // Database not connected
  }

  // Group by month
  const byMonth: Record<string, DateGroup[]> = {};
  for (const group of dateGroups) {
    const key = format(group.date, "MMMM yyyy");
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(group);
  }

  return (
    <div>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Archive", path: "/archive" },
        ])}
      />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Archive</h1>
        <p className="text-muted max-w-xl mx-auto">
          Browse every daily brief — steelmanned analysis of Congressional
          speeches with compromise paths identified.
        </p>
      </div>

      {dateGroups.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(byMonth).map(([month, groups]) => (
            <div key={month}>
              <h2 className="text-lg font-semibold mb-3 text-muted">
                {month}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {groups.map((g) => {
                  const dateStr = format(g.date, "yyyy-MM-dd");
                  return (
                    <Link
                      key={dateStr}
                      href={`/archive/${dateStr}`}
                      className="border border-card-border bg-card rounded-lg p-4 hover:border-purple-accent/50 transition-colors"
                    >
                      <div className="text-sm font-semibold">
                        {format(g.date, "EEEE, MMMM d")}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {g.count} topic{g.count !== 1 ? "s" : ""} analyzed
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-card-border bg-card rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No briefs yet</h3>
          <p className="text-muted max-w-md mx-auto">
            The archive will populate as daily briefs are generated from
            Congressional Record speeches.
          </p>
        </div>
      )}
    </div>
  );
}
