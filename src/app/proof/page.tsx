import type { Metadata } from "next";
import { db } from "@/lib/db";
import { bills, billTopicLinks } from "@/lib/db/schema";
import { desc, gte, inArray, eq } from "drizzle-orm";
import { BillCard } from "@/components/bill-card";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/json-ld";
import type { Bill } from "@/lib/db/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Proof It Works",
  description:
    "Real bipartisan bills in Congress with cosponsors from both parties — evidence that common ground is not just theory.",
  openGraph: {
    type: "website",
    title: "Proof It Works | CommonGround",
    description:
      "Real bipartisan bills in Congress — evidence that common ground is not just theory.",
  },
  twitter: {
    card: "summary",
    title: "Proof It Works | CommonGround",
    description:
      "Real bipartisan bills in Congress — evidence that common ground is not just theory.",
  },
  alternates: { canonical: "/proof" },
};

async function getLinkedTopics(billIds: number[]): Promise<Record<number, string[]>> {
  if (billIds.length === 0) return {};
  const links = await db
    .select({ billId: billTopicLinks.billId, topicSlug: billTopicLinks.topicSlug })
    .from(billTopicLinks)
    .where(inArray(billTopicLinks.billId, billIds));
  const map: Record<number, string[]> = {};
  for (const link of links) {
    if (!map[link.billId]) map[link.billId] = [];
    map[link.billId].push(link.topicSlug);
  }
  return map;
}

export default async function ProofPage() {
  let enacted: Bill[] = [];
  let advancing: Bill[] = [];
  let building: Bill[] = [];

  try {
    [enacted, advancing, building] = await Promise.all([
      db
        .select()
        .from(bills)
        .where(eq(bills.status, "enacted"))
        .orderBy(desc(bills.bipartisanScore))
        .limit(10),
      db
        .select()
        .from(bills)
        .where(inArray(bills.status, ["passed_one", "passed_both", "floor"]))
        .orderBy(desc(bills.bipartisanScore))
        .limit(10),
      db
        .select()
        .from(bills)
        .where(
          inArray(bills.status, ["committee"])
        )
        .orderBy(desc(bills.bipartisanScore))
        .limit(10),
    ]);

    // Filter building to bipartisan only
    building = building.filter((b) => parseFloat(b.bipartisanScore || "0") > 0.2);
  } catch {
    // Database not connected yet
  }

  const allBillIds = [...enacted, ...advancing, ...building].map((b) => b.id);
  const topicMap = await getLinkedTopics(allBillIds);
  const totalBills = enacted.length + advancing.length + building.length;

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Proof It Works", path: "/proof" }])} />
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Proof It Works
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Real bipartisan bills in the 119th Congress — evidence that common
          ground isn&apos;t just theory. These bills have cosponsors from both
          parties.
        </p>
      </div>

      {totalBills > 0 ? (
        <>
          {/* Enacted */}
          {enacted.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">Enacted Into Law</h2>
                <span className="text-xs px-2 py-1 rounded bg-green-bg border border-green-border text-green-accent font-medium">
                  {enacted.length} bill{enacted.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-muted mb-4">
                Bipartisan legislation that made it all the way — proof that
                compromise can become law.
              </p>
              <div className="grid gap-4">
                {enacted.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    linkedTopics={topicMap[bill.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Advancing */}
          {advancing.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">Advancing Through Congress</h2>
                <span className="text-xs px-2 py-1 rounded bg-purple-bg border border-purple-border text-purple-accent font-medium">
                  {advancing.length} bill{advancing.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-muted mb-4">
                Bills that have passed at least one chamber with bipartisan
                support.
              </p>
              <div className="grid gap-4">
                {advancing.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    linkedTopics={topicMap[bill.id]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Building Support */}
          {building.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">Building Bipartisan Support</h2>
                <span className="text-xs px-2 py-1 rounded bg-card border border-card-border text-muted font-medium">
                  {building.length} bill{building.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-muted mb-4">
                Bills in committee with meaningful cross-party cosponsorship —
                the seeds of future compromise.
              </p>
              <div className="grid gap-4">
                {building.map((bill) => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    linkedTopics={topicMap[bill.id]}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="border border-card-border bg-card rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No bills tracked yet</h3>
          <p className="text-muted max-w-md mx-auto">
            The bill tracking pipeline fetches bipartisan legislation from
            Congress.gov daily. Bills will appear here once the ingestion cron
            runs.
          </p>
        </div>
      )}
    </div>
  );
}
