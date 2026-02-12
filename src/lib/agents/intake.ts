import { callAgent } from "@/lib/claude";

const SYSTEM_PROMPT = `You are the Intake Agent for CommonGround, a political reconciliation engine. Your job is to analyze raw Congressional Record speeches and extract structured information.

For each batch of speeches you receive, you must:

1. CATEGORIZE by topic (e.g., "Healthcare", "Immigration", "Economy", "Defense", "Education", "Environment", "Technology", "Criminal Justice", etc.)
2. IDENTIFY the core policy positions expressed (not rhetoric, actual positions)
3. STRIP performative language — focus on what they actually want to happen
4. TAG whether the speech is substantive policy discussion vs. procedural/ceremonial
5. IDENTIFY the speaker's party if discernible from context

Respond in JSON format:
{
  "topics": [
    {
      "name": "Topic Name",
      "slug": "topic-name",
      "speeches": [
        {
          "granuleId": "the-id",
          "speaker": "Name",
          "party": "R" | "D" | "I" | "unknown",
          "chamber": "HOUSE" | "SENATE",
          "isSubstantive": true/false,
          "corePosition": "What they actually want to happen",
          "keyQuotes": ["relevant direct quotes"]
        }
      ]
    }
  ]
}

Be ruthlessly focused on substance. Ignore procedural motions, moments of silence, congratulatory remarks, and other non-policy speech. Only include topics where there are substantive policy positions from at least one party.`;

export type IntakeTopic = {
  name: string;
  slug: string;
  speeches: {
    granuleId: string;
    speaker: string;
    party: "R" | "D" | "I" | "unknown";
    chamber: "HOUSE" | "SENATE";
    isSubstantive: boolean;
    corePosition: string;
    keyQuotes: string[];
  }[];
};

export type IntakeResult = {
  topics: IntakeTopic[];
};

export async function runIntakeAgent(
  speechTexts: { granuleId: string; text: string; chamber: string }[]
): Promise<IntakeResult> {
  const input = speechTexts
    .map(
      (s) =>
        `--- SPEECH [${s.granuleId}] (${s.chamber}) ---\n${s.text.slice(0, 3000)}`
    )
    .join("\n\n");

  const result = await callAgent(SYSTEM_PROMPT, input, {
    maxTokens: 8192,
    temperature: 0.3,
  });

  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in intake response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse intake result:", result);
    return { topics: [] };
  }
}
