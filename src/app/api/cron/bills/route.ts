import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills, billTopicLinks, briefs } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  fetchRecentBills,
  fetchBillDetail,
  fetchBillCosponsors,
  fetchBillSubjects,
  calculateBipartisanScore,
  deriveBillStatus,
  isAdvancedBill,
} from "@/lib/congress";
import { runBillMatcher } from "@/lib/agents/bill-matcher";

export const maxDuration = 300; // 5 minutes for Vercel

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const validSecret = process.env.CRON_SECRET;
  if (!validSecret || authHeader !== `Bearer ${validSecret}`) {
    console.error("Cron auth failed. Header:", authHeader?.slice(0, 20) + "...", "Secret set:", !!validSecret);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const congress = "119"; // Current Congress (2025-2026)
    const billTypes = ["hr", "s"];
    let billsEvaluated = 0;
    let billsSaved = 0;
    let topicLinksCreated = 0;

    const newBillKeys: { billKey: string; title: string; policyArea: string | null; subjects: string[] }[] = [];

    for (const billType of billTypes) {
      console.log(`Fetching recent ${billType.toUpperCase()} bills...`);
      const billList = await fetchRecentBills(congress, billType, 50);
      console.log(`  Found ${billList.length} ${billType.toUpperCase()} bills`);

      // Filter to bills that have advanced beyond introduction
      const advancedBills = billList.filter((b) =>
        isAdvancedBill(b.latestAction?.text || null)
      );
      console.log(`  ${advancedBills.length} have advanced past introduction`);

      for (const bill of advancedBills) {
        try {
          billsEvaluated++;
          const billNum = String(bill.number);

          // Check if we already have this bill and it's fresh
          const existing = await db.query.bills.findFirst({
            where: (b, { and: a, eq: e }) =>
              a(e(b.congress, congress), e(b.billType, billType), e(b.billNumber, billNum)),
          });

          if (existing) {
            const hoursSinceUpdate = (Date.now() - existing.updatedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate < 24) continue; // Already fresh
          }

          // Fetch detail + cosponsors + subjects
          const [detail, cosponsors, subjects] = await Promise.all([
            fetchBillDetail(congress, billType, billNum),
            fetchBillCosponsors(congress, billType, billNum),
            fetchBillSubjects(congress, billType, billNum),
          ]);

          // Count by party
          const partyCounts = { R: 0, D: 0, I: 0 };
          for (const c of cosponsors) {
            if (c.party in partyCounts) {
              partyCounts[c.party as keyof typeof partyCounts]++;
            }
          }

          // Include sponsor in counts
          const sponsor = detail.sponsors?.[0];
          if (sponsor?.party && sponsor.party in partyCounts) {
            partyCounts[sponsor.party as keyof typeof partyCounts]++;
          }

          const score = calculateBipartisanScore(partyCounts.R, partyCounts.D);
          const status = deriveBillStatus(detail.latestAction?.text || null);

          // Skip non-bipartisan bills unless enacted (enacted is always interesting)
          if (score === 0 && status !== "enacted") continue;

          const subjectNames = (subjects.legislativeSubjects || []).map((s) => s.name);
          const policyArea = subjects.policyArea?.name || detail.policyArea?.name || null;
          const congressGovUrl = `https://www.congress.gov/bill/${congress}th-congress/${
            billType === "hr" ? "house-bill" : billType === "s" ? "senate-bill" : billType
          }/${billNum}`;

          const billData = {
            congress,
            billType,
            billNumber: billNum,
            title: detail.title,
            policyArea,
            legislativeSubjects: subjectNames,
            sponsorName: sponsor?.fullName || null,
            sponsorParty: sponsor?.party || null,
            sponsorState: sponsor?.state || null,
            cosponsorCountR: String(partyCounts.R),
            cosponsorCountD: String(partyCounts.D),
            cosponsorCountI: String(partyCounts.I),
            cosponsorTotal: String(cosponsors.length),
            bipartisanScore: String(score),
            status,
            latestActionText: detail.latestAction?.text || null,
            latestActionDate: detail.latestAction?.actionDate ? new Date(detail.latestAction.actionDate) : null,
            congressGovUrl,
            updatedAt: new Date(),
          };

          if (existing) {
            await db.update(bills).set(billData).where(eq(bills.id, existing.id));
          } else {
            await db.insert(bills).values(billData);
          }

          billsSaved++;
          newBillKeys.push({
            billKey: `${billType}-${billNum}`,
            title: detail.title,
            policyArea,
            subjects: subjectNames,
          });

          // Small delay to be a good API citizen
          await new Promise((r) => setTimeout(r, 100));
        } catch (err) {
          console.error(`Failed to process ${billType}-${bill.number}:`, err);
        }
      }
    }

    // Topic matching: link bills to CommonGround topics
    if (newBillKeys.length > 0) {
      try {
        const allSlugs = await db
          .selectDistinct({ slug: briefs.slug })
          .from(briefs);
        const topicSlugs = allSlugs.map((r) => r.slug);

        if (topicSlugs.length > 0) {
          console.log(`Running bill matcher for ${newBillKeys.length} bills against ${topicSlugs.length} topics...`);
          const matchResult = await runBillMatcher(newBillKeys, topicSlugs);

          for (const match of matchResult.matches) {
            const [type, num] = match.billKey.split("-");
            const bill = await db.query.bills.findFirst({
              where: (b, { and: a, eq: e }) =>
                a(e(b.congress, congress), e(b.billType, type), e(b.billNumber, num)),
            });

            if (!bill) continue;

            for (const slug of match.topicSlugs) {
              try {
                await db
                  .insert(billTopicLinks)
                  .values({ billId: bill.id, topicSlug: slug, confidence: match.confidence })
                  .onConflictDoNothing();
                topicLinksCreated++;
              } catch {
                // Duplicate link, ignore
              }
            }
          }
        }
      } catch (err) {
        console.error("Bill-topic matching failed:", err);
      }
    }

    console.log(`Bill ingestion complete: ${billsEvaluated} evaluated, ${billsSaved} saved, ${topicLinksCreated} links`);

    return NextResponse.json({
      message: "Bill ingestion complete",
      congress,
      billsEvaluated,
      billsSaved,
      topicLinksCreated,
    });
  } catch (err) {
    console.error("Bill ingestion failed:", err);
    return NextResponse.json(
      { error: "Bill ingestion failed", details: String(err) },
      { status: 500 }
    );
  }
}
