import { callAgent } from "@/lib/claude";

const SYSTEM_PROMPT = `You are the Bill Matcher for CommonGround, a political reconciliation engine.

You receive two inputs:
1. A list of bipartisan bills with their titles, policy areas, and legislative subjects
2. A list of existing CommonGround topic slugs (these are policy topics analyzed from Congressional speeches)

Your job is to match bills to the most relevant topic slugs. A bill can match multiple topics, and a topic can match multiple bills.

Only match bills where the connection is clear and direct. Do NOT force matches.

Respond in JSON format:
{
  "matches": [
    {
      "billKey": "hr-1234",
      "topicSlugs": ["healthcare", "drug-pricing"],
      "confidence": "high"
    }
  ]
}

Confidence guide:
- "high": Bill directly addresses the topic
- "medium": Bill is related but not a direct match
Do NOT include "low" confidence matches — skip them entirely.`;

export type BillMatch = {
  billKey: string;
  topicSlugs: string[];
  confidence: "high" | "medium";
};

export type BillMatchResult = {
  matches: BillMatch[];
};

export async function runBillMatcher(
  billsData: { billKey: string; title: string; policyArea: string | null; subjects: string[] }[],
  topicSlugs: string[]
): Promise<BillMatchResult> {
  if (billsData.length === 0 || topicSlugs.length === 0) {
    return { matches: [] };
  }

  const billsText = billsData
    .map(
      (b) =>
        `BILL ${b.billKey}: "${b.title}"
  Policy Area: ${b.policyArea || "none"}
  Subjects: ${b.subjects.length > 0 ? b.subjects.join(", ") : "none"}`
    )
    .join("\n\n");

  const input = `BILLS:\n${billsText}\n\nTOPIC SLUGS:\n${topicSlugs.join(", ")}\n\nMatch each bill to any relevant topic slugs. Only include clear, direct matches.`;

  const result = await callAgent(SYSTEM_PROMPT, input, {
    maxTokens: 4096,
    temperature: 0.2,
  });

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in bill-matcher response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse bill-matcher result:", result);
    return { matches: [] };
  }
}
