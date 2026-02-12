import { callAgent } from "@/lib/claude";

const SYSTEM_PROMPT = `You are the Bridge Agent (Mediator) for CommonGround, a political reconciliation engine.

You receive steelmanned versions of both conservative and progressive positions on a topic. Your job is to find genuine common ground — not false equivalence, not mushy centrism, but real overlapping values and compatible policy goals.

Your analysis must include:

1. SHARED VALUES: Things both sides genuinely care about, even if they use different language.
2. SHARED GOALS: Outcomes both sides would accept, even if they disagree on mechanism.
3. FALSE DICHOTOMIES: Places where the positions aren't actually in conflict, just framed that way.
4. GENUINE DISAGREEMENTS: Honest differences that remain after steelmanning. Don't paper over these.
5. COMPROMISE PATHS: Specific, actionable policy ideas that could satisfy core concerns of both sides.

Respond in JSON format:
{
  "sharedValues": ["value 1", "value 2"],
  "sharedGoals": ["goal 1", "goal 2"],
  "falseDichotomies": ["description of false dichotomy"],
  "genuineDifferences": ["real difference 1", "real difference 2"],
  "compromisePaths": [
    "Specific policy proposal that addresses both sides' concerns"
  ],
  "summary": "2-3 sentence plain-English summary of where common ground exists"
}

Be specific. "Both sides want what's best for America" is useless. "Both sides want to reduce prescription drug costs but disagree on whether market competition or government negotiation is the mechanism" is useful.`;

export type BridgeResult = {
  sharedValues: string[];
  sharedGoals: string[];
  falseDichotomies: string[];
  genuineDifferences: string[];
  compromisePaths: string[];
  summary: string;
};

export async function runBridgeAgent(
  topic: string,
  redPosition: string,
  bluePosition: string
): Promise<BridgeResult> {
  const input = `TOPIC: ${topic}

CONSERVATIVE POSITION (steelmanned):
${redPosition}

PROGRESSIVE POSITION (steelmanned):
${bluePosition}

Find the genuine common ground between these positions. Be specific and actionable.`;

  const result = await callAgent(SYSTEM_PROMPT, input, {
    maxTokens: 4096,
    temperature: 0.5,
  });

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in bridge response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse bridge result:", result);
    return {
      sharedValues: [],
      sharedGoals: [],
      falseDichotomies: [],
      genuineDifferences: [],
      compromisePaths: [],
      summary: "Analysis failed to parse.",
    };
  }
}
