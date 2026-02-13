import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { speeches } from "@/lib/db/schema";
import {
  fetchDailySpeechGranules,
  fetchGranuleHtml,
  htmlToPlainText,
  parseSpeaker,
} from "@/lib/govinfo";
import { subDays } from "date-fns";

export const maxDuration = 300; // 5 minutes for Vercel

/**
 * Daily cron job: ingest targetDate's Congressional Record speeches.
 * The Congressional Record is typically published the day after floor proceedings.
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Allow manual date override via ?date=2026-02-11 query param
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam
      ? new Date(dateParam + "T12:00:00Z")
      : subDays(new Date(), 1);
    console.log(`Ingesting speeches for ${targetDate.toISOString()}`);

    const granules = await fetchDailySpeechGranules(targetDate);

    if (granules.length === 0) {
      return NextResponse.json({
        message: "No speeches found (weekend/recess?)",
        date: targetDate.toISOString(),
        count: 0,
      });
    }

    console.log(`Found ${granules.length} speech granules`);

    let ingested = 0;
    let skipped = 0;

    for (const granule of granules) {
      try {
        // Check if already ingested
        const existing = await db.query.speeches.findFirst({
          where: (s, { eq }) => eq(s.granuleId, granule.granuleId),
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Fetch full HTML text
        const html = await fetchGranuleHtml(targetDate, granule.granuleId);
        const plainText = htmlToPlainText(html);

        // Skip very short entries (procedural notes, etc.)
        if (plainText.length < 200) {
          skipped++;
          continue;
        }

        const speaker = parseSpeaker(plainText);

        await db.insert(speeches).values({
          granuleId: granule.granuleId,
          title: granule.title,
          speaker,
          party: null, // Will be determined by intake agent
          chamber: granule.granuleClass,
          date: targetDate,
          rawHtml: html,
          plainText,
          topics: [],
          processed: false,
        });

        ingested++;
      } catch (err) {
        console.error(
          `Failed to ingest granule ${granule.granuleId}:`,
          err
        );
      }
    }

    return NextResponse.json({
      message: "Ingestion complete",
      date: targetDate.toISOString(),
      total: granules.length,
      ingested,
      skipped,
    });
  } catch (err) {
    console.error("Ingestion failed:", err);
    return NextResponse.json(
      { error: "Ingestion failed", details: String(err) },
      { status: 500 }
    );
  }
}
