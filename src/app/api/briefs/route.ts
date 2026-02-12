import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { briefs } from "@/lib/db/schema";
import { desc, and, gte, lte } from "drizzle-orm";

/**
 * GET /api/briefs — Fetch briefs with optional date filter.
 * Query params: ?date=2026-02-12 or ?latest=true
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const latest = searchParams.get("latest");

  try {
    if (dateParam) {
      const date = new Date(dateParam);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const results = await db
        .select()
        .from(briefs)
        .where(and(gte(briefs.date, startOfDay), lte(briefs.date, endOfDay)))
        .orderBy(desc(briefs.createdAt));

      return NextResponse.json(results);
    }

    if (latest === "true") {
      // Get the most recent date that has briefs, then return all briefs for that date
      const mostRecent = await db
        .select()
        .from(briefs)
        .orderBy(desc(briefs.date))
        .limit(1);

      if (mostRecent.length === 0) {
        return NextResponse.json([]);
      }

      const targetDate = mostRecent[0].date;
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const results = await db
        .select()
        .from(briefs)
        .where(and(gte(briefs.date, startOfDay), lte(briefs.date, endOfDay)))
        .orderBy(desc(briefs.createdAt));

      return NextResponse.json(results);
    }

    // Default: last 20 briefs
    const results = await db
      .select()
      .from(briefs)
      .orderBy(desc(briefs.date))
      .limit(20);

    return NextResponse.json(results);
  } catch (err) {
    console.error("Failed to fetch briefs:", err);
    return NextResponse.json(
      { error: "Failed to fetch briefs" },
      { status: 500 }
    );
  }
}
