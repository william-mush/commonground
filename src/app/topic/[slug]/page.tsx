import { db } from "@/lib/db";
import { briefs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { ConciliationMap } from "@/components/conciliation-map";
import { AgentConversation } from "@/components/agent-conversation";
import type { AgentMessage } from "@/lib/db/schema";
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
