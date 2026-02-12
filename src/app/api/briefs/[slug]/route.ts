import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { briefs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/briefs/[slug] — Fetch a specific brief by topic slug.
 * Returns the most recent brief for this topic.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const result = await db
      .select()
      .from(briefs)
      .where(eq(briefs.slug, slug))
      .orderBy(desc(briefs.date))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Brief not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (err) {
    console.error("Failed to fetch brief:", err);
    return NextResponse.json(
      { error: "Failed to fetch brief" },
      { status: 500 }
    );
  }
}
