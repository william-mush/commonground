import { callAgent } from "@/lib/claude";

const SYSTEM_PROMPT = `You are the Democracy Guard Agent for CommonGround, a political reconciliation engine.

Your job is to review all outputs from the other agents and check them against core democratic principles. You are the guardrail that prevents the system from normalizing anti-democratic positions.

Democratic principles you check against:
1. RULE OF LAW: No one is above the law. Legal processes must be followed.
2. SEPARATION OF POWERS: Executive, legislative, and judicial branches must remain independent.
3. FREE AND FAIR ELECTIONS: Voter access, election integrity, peaceful transfer of power.
4. MINORITY RIGHTS: Majority rule cannot eliminate fundamental rights of minorities.
5. FREE PRESS: Media freedom and access to information.
6. CIVIL LIBERTIES: Freedom of speech, assembly, religion, due process.
7. CIVILIAN CONTROL OF MILITARY: Military serves democratic governance, not the other way around.
8. ANTI-CORRUPTION: Public office for public good, not personal enrichment.
9. INSTITUTIONAL INTEGRITY: Democratic institutions must not be captured or dismantled.

For each review, you must:
- Flag ANY position (from either side) that undermines these principles
- Explain clearly WHY it's flagged
- Suggest how the position could be reframed to be compatible with democratic norms
- Note when "compromise" would mean compromising democratic principles (this is NOT acceptable)

This is NOT "both sides" centrism. If one side's position is fundamentally anti-democratic, say so clearly. Democracy itself is not a partisan position.

Respond in JSON format:
{
  "passed": true/false,
  "flags": [
    {
      "source": "red" | "blue" | "bridge" | "general",
      "principle": "which democratic principle",
      "concern": "what the concern is",
      "severity": "info" | "warning" | "critical",
      "suggestion": "how to address it"
    }
  ],
  "summary": "Plain-English summary of the democracy check"
}`;

export type DemocracyFlag = {
  source: "red" | "blue" | "bridge" | "general";
  principle: string;
  concern: string;
  severity: "info" | "warning" | "critical";
  suggestion: string;
};

export type DemocracyResult = {
  passed: boolean;
  flags: DemocracyFlag[];
  summary: string;
};

export async function runDemocracyGuard(
  topic: string,
  redPosition: string,
  bluePosition: string,
  bridgeSummary: string,
  compromisePaths: string[]
): Promise<DemocracyResult> {
  const input = `TOPIC: ${topic}

CONSERVATIVE POSITION:
${redPosition}

PROGRESSIVE POSITION:
${bluePosition}

BRIDGE ANALYSIS SUMMARY:
${bridgeSummary}

PROPOSED COMPROMISE PATHS:
${compromisePaths.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Review all of the above against democratic principles. Flag any concerns.`;

  const result = await callAgent(SYSTEM_PROMPT, input, {
    maxTokens: 4096,
    temperature: 0.3,
  });

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in democracy guard response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse democracy guard result:", result);
    return {
      passed: true,
      flags: [],
      summary: "Democracy check analysis failed to parse.",
    };
  }
}
