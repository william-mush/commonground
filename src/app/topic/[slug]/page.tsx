import { db } from "@/lib/db";
import { briefs, bills, billTopicLinks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { ConciliationMap } from "@/components/conciliation-map";
import { AgentConversation } from "@/components/agent-conversation";
import { BillCard } from "@/components/bill-card";
import type { AgentMessage, SpeechMeta } from "@/lib/db/schema";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const result = await db
    .select()
    .from(briefs)
    .where(eq(briefs.slug, slug))
    .orderBy(desc(briefs.date))
    .limit(1);

  if (result.length === 0) {
    notFound();
  }

  const brief = result[0];
  const conversation = brief.agentConversation as AgentMessage[];
  const speechMeta = (brief.sourceSpeechMeta as SpeechMeta[]) || [];

  // Fetch related bills
  let relatedBills: (typeof bills.$inferSelect)[] = [];
  try {
    const linked = await db
      .select({ bill: bills })
      .from(billTopicLinks)
      .innerJoin(bills, eq(bills.id, billTopicLinks.billId))
      .where(eq(billTopicLinks.topicSlug, slug))
      .orderBy(desc(bills.bipartisanScore))
      .limit(5);
    relatedBills = linked.map((r) => r.bill);
  } catch {
    // Bills table may not exist yet
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/"
        className="text-sm text-muted hover:text-foreground transition-colors mb-6 inline-block"
      >
        &larr; Back to daily brief
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{brief.topic}</h1>
          {brief.democracyFlagged && (
            <span className="text-xs px-2 py-1 rounded bg-yellow-bg border border-yellow-border text-yellow-accent font-medium">
              Democracy Flag
            </span>
          )}
        </div>
        <p className="text-muted">
          Analysis from {format(brief.date, "MMMM d, yyyy")}
        </p>
      </div>

      {/* Source Speeches */}
      {speechMeta.length > 0 && (
        <div className="border border-card-border bg-card rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Source Speeches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {speechMeta
              .sort((a, b) => {
                const order = { R: 0, D: 1, I: 2, unknown: 3 };
                return order[a.party] - order[b.party];
              })
              .map((s, i) => (
                <div
                  key={i}
                  className={`rounded-md border p-3 ${
                    s.party === "R"
                      ? "border-red-border bg-red-bg"
                      : s.party === "D"
                        ? "border-blue-border bg-blue-bg"
                        : "border-card-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        s.party === "R"
                          ? "bg-red-accent/20 text-red-accent"
                          : s.party === "D"
                            ? "bg-blue-accent/20 text-blue-accent"
                            : "bg-muted/20 text-muted"
                      }`}
                    >
                      {s.party === "R"
                        ? "R"
                        : s.party === "D"
                          ? "D"
                          : s.party === "I"
                            ? "I"
                            : "?"}
                    </span>
                    <span className="text-sm font-medium">
                      {s.speaker || "Unknown Speaker"}
                    </span>
                    <span className="text-xs text-muted">
                      {s.chamber === "HOUSE" ? "House" : "Senate"}
                    </span>
                  </div>
                  {s.title && (
                    <p className="text-xs text-muted mb-1 line-clamp-1">
                      {s.title}
                    </p>
                  )}
                  <p className="text-sm line-clamp-2">{s.corePosition}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Collaboration Potential */}
      {brief.collaborationScore && (
        <div className="border border-purple-border bg-purple-bg rounded-lg p-5 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-purple-accent uppercase tracking-wider">
              Collaboration Potential
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-accent/20 text-purple-accent font-bold">
              {brief.collaborationScore}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{brief.collaborationReason}</p>
        </div>
      )}

      {/* Related Bills */}
      {relatedBills.length > 0 && (
        <div className="border border-green-border bg-green-bg rounded-lg p-6 mb-8">
          <h2 className="text-sm font-semibold text-green-accent mb-1 uppercase tracking-wider">
            Related Bills in Congress
          </h2>
          <p className="text-xs text-muted mb-3">
            Real legislation related to this topic with bipartisan support
          </p>
          <div className="divide-y divide-green-border">
            {relatedBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} compact />
            ))}
          </div>
          <Link
            href="/proof"
            className="text-xs text-green-accent hover:underline mt-2 inline-block"
          >
            See all bipartisan bills &rarr;
          </Link>
        </div>
      )}

      {/* Steelmanned Positions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg border border-red-border bg-red-bg p-5">
          <h2 className="text-sm font-semibold text-red-accent mb-3 uppercase tracking-wider">
            Conservative Position (Steelmanned)
          </h2>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {brief.redPosition}
          </div>
        </div>
        <div className="rounded-lg border border-blue-border bg-blue-bg p-5">
          <h2 className="text-sm font-semibold text-blue-accent mb-3 uppercase tracking-wider">
            Progressive Position (Steelmanned)
          </h2>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {brief.bluePosition}
          </div>
        </div>
      </div>

      {/* Conciliation Map */}
      <div className="border border-card-border bg-card rounded-lg p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">Conciliation Map</h2>
        <ConciliationMap brief={brief} />
      </div>

      {/* Democracy Check */}
      <div
        className={`rounded-lg border p-5 mb-8 ${
          brief.democracyFlagged
            ? "border-yellow-border bg-yellow-bg"
            : "border-green-border bg-green-bg"
        }`}
      >
        <h2
          className={`text-sm font-semibold mb-2 uppercase tracking-wider ${
            brief.democracyFlagged ? "text-yellow-accent" : "text-green-accent"
          }`}
        >
          Democracy Guard Check
        </h2>
        <p className="text-sm leading-relaxed">{brief.democracyCheck}</p>
      </div>

      {/* Policy Draft */}
      {brief.policyDraft && (
        <div className="border border-purple-border bg-purple-bg rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold mb-3 text-purple-accent">
            Proposed Policy Framework
          </h2>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {brief.policyDraft}
          </div>
        </div>
      )}

      {/* Agent Conversation */}
      <div className="border border-card-border bg-card rounded-lg p-6">
        <AgentConversation messages={conversation || []} />
      </div>
    </div>
  );
}
