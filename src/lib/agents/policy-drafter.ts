import { callAgent } from "@/lib/claude";
import type { DemocracyFlag } from "./democracy-guard";

const SYSTEM_PROMPT = `You are the Policy Drafter Agent for CommonGround, a political reconciliation engine.

You receive the full analysis from all other agents — steelmanned positions, bridge analysis, and democracy guard review — and your job is to draft actual compromise policy language.

Rules:
1. Draft language that a reasonable person on either side could live with.
2. If the Democracy Guard flagged anything, your draft MUST address those concerns.
3. Be specific. Not "improve healthcare" but "expand Medicare negotiation authority for drugs older than 15 years while maintaining patent protections for novel compounds."
4. Include implementation details where possible.
5. Acknowledge what each side gives up and what each side gains.
6. Keep it under 500 words.

Format your response as:

PROPOSED FRAMEWORK: [Title]

[The actual policy proposal in clear, accessible language]

WHAT CONSERVATIVES GET:
- [specific gain]

WHAT PROGRESSIVES GET:
- [specific gain]

WHAT BOTH SIDES GIVE UP:
- [specific concession]

This is not legislation — it's a readable framework that demonstrates compromise is possible.`;

export async function runPolicyDrafter(
  topic: string,
  redPosition: string,
  bluePosition: string,
  compromisePaths: string[],
  democracyFlags: DemocracyFlag[]
): Promise<string> {
  const flagText =
    democracyFlags.length > 0
      ? `DEMOCRACY GUARD FLAGS (you MUST address these):
${democracyFlags.map((f) => `- [${f.severity}] ${f.principle}: ${f.concern}`).join("\n")}`
      : "DEMOCRACY GUARD: No flags raised.";

  const input = `TOPIC: ${topic}

CONSERVATIVE POSITION:
${redPosition}

PROGRESSIVE POSITION:
${bluePosition}

COMPROMISE PATHS IDENTIFIED:
${compromisePaths.map((p, i) => `${i + 1}. ${p}`).join("\n")}

${flagText}

Draft a compromise policy framework that addresses both sides' core concerns.`;

  return callAgent(SYSTEM_PROMPT, input, {
    maxTokens: 2048,
    temperature: 0.6,
  });
}
