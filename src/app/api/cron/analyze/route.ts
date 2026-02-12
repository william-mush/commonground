import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { subDays } from "date-fns";

export const maxDuration = 300; // 5 minutes for Vercel

/**
 * Daily cron job: run the agent pipeline on ingested speeches.
 * Should run after the ingest cron has completed.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const yesterday = subDays(new Date(), 1);
    console.log(`Running analysis pipeline for ${yesterday.toISOString()}`);

    const briefCount = await runPipeline(yesterday);

    return NextResponse.json({
      message: "Analysis complete",
      date: yesterday.toISOString(),
      briefsGenerated: briefCount,
    });
  } catch (err) {
    console.error("Analysis pipeline failed:", err);
    return NextResponse.json(
      { error: "Analysis failed", details: String(err) },
      { status: 500 }
    );
  }
}
