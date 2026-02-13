import { callAgent } from "@/lib/claude";
import type { IntakeTopic } from "./intake";

const SYSTEM_PROMPT = `You are the Opportunity Scout for CommonGround, a political reconciliation engine.

You receive a list of topics that were discussed in today's Congressional Record, along with which parties spoke on each topic and their core positions.

Your job is to identify which topics have the HIGHEST potential for bipartisan collaboration. Look for:

1. BOTH SIDES ENGAGED: Topics where both R and D members spoke (highest priority)
2. SHARED UNDERLYING VALUES: Even when framed differently, look for topics where both sides care about the same outcome (e.g., protecting children, reducing costs, national security)
3. CONCRETE OVERLAP: Topics where the actual policy proposals aren't that far apart — just the rhetoric
4. HISTORICAL PRECEDENT: Topics that have seen bipartisan cooperation before (infrastructure, veterans, drug pricing, criminal justice reform, etc.)
5. LOW IDEOLOGICAL STAKES: Topics where partisan identity is less entrenched, making compromise easier

Score each topic from 1-10 on collaboration potential and explain why.

Respond in JSON format:
{
  "rankedTopics": [
    {
      "name": "Topic Name",
      "slug": "topic-slug",
      "score": 8,
      "reason": "Why this topic has high collaboration potential",
      "bothSidesEngaged": true,
      "sharedUnderlying": "The underlying value both sides share"
    }
  ],
  "summary": "1-2 sentence overview of today's best opportunities for bipartisan work"
}

Be honest. If nothing looks promising today, say so. A score of 1-3 means unlikely, 4-6 means possible with effort, 7-10 means genuine opportunity.`;

export type ScoutResult = {
  rankedTopics: {
    name: string;
    slug: string;
    score: number;
    reason: string;
    bothSidesEngaged: boolean;
    sharedUnderlying: string;
  }[];
  summary: string;
};

export async function runOpportunityScout(
  topics: IntakeTopic[]
): Promise<ScoutResult> {
  const input = topics
    .map((t) => {
      const rCount = t.speeches.filter((s) => s.party === "R").length;
      const dCount = t.speeches.filter((s) => s.party === "D").length;
      const positions = t.speeches
        .filter((s) => s.isSubstantive)
        .map((s) => `  [${s.party}] ${s.speaker}: ${s.corePosition}`)
        .join("\n");
      return `TOPIC: ${t.name} (slug: ${t.slug})
  Republicans: ${rCount}, Democrats: ${dCount}
  Positions:
${positions}`;
    })
    .join("\n\n---\n\n");

  const result = await callAgent(SYSTEM_PROMPT, input, {
    maxTokens: 4096,
    temperature: 0.4,
  });

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in scout response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse scout result:", result);
    return {
      rankedTopics: [],
      summary: "Scout analysis failed to parse.",
    };
  }
}
