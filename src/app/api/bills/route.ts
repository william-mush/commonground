import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills, billTopicLinks } from "@/lib/db/schema";
import { desc, eq, gte, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const topic = searchParams.get("topic");
  const minScore = searchParams.get("minScore");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  try {
    let query = db.select().from(bills);
    const conditions = [];

    if (status) {
      conditions.push(eq(bills.status, status));
    }
    if (minScore) {
      conditions.push(gte(bills.bipartisanScore, minScore));
    }

    let result;

    if (topic) {
      // Join through billTopicLinks
      result = await db
        .select({ bill: bills })
        .from(billTopicLinks)
        .innerJoin(bills, eq(bills.id, billTopicLinks.billId))
        .where(eq(billTopicLinks.topicSlug, topic))
        .orderBy(desc(bills.bipartisanScore))
        .limit(limit);

      return NextResponse.json(result.map((r) => r.bill));
    }

    result = await db
      .select()
      .from(bills)
      .orderBy(desc(bills.bipartisanScore))
      .limit(limit);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch bills", details: String(err) },
      { status: 500 }
    );
  }
}
