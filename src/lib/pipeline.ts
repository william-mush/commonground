import { db } from "@/lib/db";
import { briefs, speeches } from "@/lib/db/schema";
import type { AgentMessage } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  runIntakeAgent,
  runOpportunityScout,
  runRedSteelman,
  runBlueSteelman,
  runBridgeAgent,
  runDemocracyGuard,
  runPolicyDrafter,
} from "@/lib/agents";
import type { IntakeTopic, ScoutResult } from "@/lib/agents";
import type { SpeechMeta } from "@/lib/db/schema";

/**
 * Run the full agent pipeline on unprocessed speeches for a given date.
 * Returns the number of briefs generated.
 */
export async function runPipeline(date: Date): Promise<number> {
  // 1. Get unprocessed speeches for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const rawSpeeches = await db.query.speeches.findMany({
    where: (s, { and, gte, lte }) =>
      and(gte(s.date, startOfDay), lte(s.date, endOfDay)),
  });

  if (rawSpeeches.length === 0) {
    console.log("No speeches found for", date.toISOString());
    return 0;
  }

  // 2. Select the longest speeches (most substantive) — limit to 20 to stay within timeout
  const sortedSpeeches = [...rawSpeeches]
    .sort((a, b) => b.plainText.length - a.plainText.length)
    .slice(0, 20);

  console.log(`Running intake agent on ${sortedSpeeches.length} speeches (of ${rawSpeeches.length} total)...`);
  const intakeResult = await runIntakeAgent(
    sortedSpeeches.map((s) => ({
      granuleId: s.granuleId,
      text: s.plainText,
      chamber: s.chamber,
    }))
  );

  const substantiveTopics = intakeResult.topics.filter(
    (t) => t.speeches.some((s) => s.isSubstantive)
  );

  if (substantiveTopics.length === 0) {
    console.log("No substantive topics found");
    return 0;
  }

  // 2b. Run Opportunity Scout to rank topics by collaboration potential
  console.log(`Running Opportunity Scout on ${substantiveTopics.length} topics...`);
  let scoutResult: ScoutResult | null = null;
  let topTopic: IntakeTopic;

  try {
    scoutResult = await runOpportunityScout(substantiveTopics);
    console.log(`Scout summary: ${scoutResult.summary}`);

    // Pick the highest-scoring topic that exists in our substantive list
    const bestScoutTopic = scoutResult.rankedTopics
      .sort((a, b) => b.score - a.score)
      .find((st) => substantiveTopics.some((t) => t.slug === st.slug));

    if (bestScoutTopic) {
      topTopic = substantiveTopics.find((t) => t.slug === bestScoutTopic.slug)!;
      console.log(`Scout picked "${topTopic.name}" (score: ${bestScoutTopic.score})`);
    } else {
      topTopic = substantiveTopics[0];
      console.log(`Scout found no match, falling back to first topic: "${topTopic.name}"`);
    }
  } catch (err) {
    console.error("Opportunity Scout failed, falling back to first topic:", err);
    topTopic = substantiveTopics[0];
  }

  // 3. Run the full agent pipeline on the selected topic
  let briefCount = 0;

  try {
    const brief = await processTopic(topTopic, date, rawSpeeches, scoutResult);
    if (brief) briefCount++;
  } catch (err) {
    console.error(`Failed to process topic "${topTopic.name}":`, err);
  }

  // 4. Mark speeches as processed
  for (const speech of rawSpeeches) {
    await db
      .update(speeches)
      .set({ processed: true })
      .where(eq(speeches.id, speech.id));
  }

  return briefCount;
}

async function processTopic(
  topic: IntakeTopic,
  date: Date,
  allSpeeches: (typeof speeches.$inferSelect)[],
  scoutResult?: ScoutResult | null
): Promise<boolean> {
  const conversation: AgentMessage[] = [];
  const now = () => new Date().toISOString();

  // Get scout info for this topic
  const scoutInfo = scoutResult?.rankedTopics.find((t) => t.slug === topic.slug);

  // Split speeches by party
  const redSpeeches = topic.speeches
    .filter((s) => s.party === "R")
    .map((s) => s.corePosition);
  const blueSpeeches = topic.speeches
    .filter((s) => s.party === "D")
    .map((s) => s.corePosition);

  // Need at least some positions from each side for a meaningful analysis
  if (redSpeeches.length === 0 && blueSpeeches.length === 0) {
    return false;
  }

  // If only one side spoke on this topic, still process but note it
  const oneSided = redSpeeches.length === 0 || blueSpeeches.length === 0;

  conversation.push({
    agent: "Intake Agent",
    role: "intake",
    content: `Identified topic: ${topic.name}. Found ${redSpeeches.length} Republican and ${blueSpeeches.length} Democratic speeches.${oneSided ? " Note: Only one party addressed this topic today." : ""}`,
    timestamp: now(),
  });

  if (scoutInfo) {
    conversation.push({
      agent: "Opportunity Scout",
      role: "scout",
      content: `Collaboration score: ${scoutInfo.score}/10. ${scoutInfo.reason}${scoutInfo.sharedUnderlying ? ` Shared underlying value: ${scoutInfo.sharedUnderlying}` : ""}`,
      timestamp: now(),
    });
  }

  // 4. Run Red and Blue steelman agents in parallel
  console.log(`  Steelmanning "${topic.name}"...`);
  const [redPosition, bluePosition] = await Promise.all([
    runRedSteelman(
      topic.name,
      redSpeeches.length > 0 ? redSpeeches : ["No Republican speeches on this topic today."],
      blueSpeeches.length > 0 ? blueSpeeches : ["No Democratic speeches on this topic today."]
    ),
    runBlueSteelman(
      topic.name,
      blueSpeeches.length > 0 ? blueSpeeches : ["No Democratic speeches on this topic today."],
      redSpeeches.length > 0 ? redSpeeches : ["No Republican speeches on this topic today."]
    ),
  ]);

  conversation.push(
    {
      agent: "Red Agent",
      role: "red",
      content: redPosition,
      timestamp: now(),
    },
    {
      agent: "Blue Agent",
      role: "blue",
      content: bluePosition,
      timestamp: now(),
    }
  );

  // 5. Run Bridge Agent
  console.log(`  Bridge analysis for "${topic.name}"...`);
  const bridgeResult = await runBridgeAgent(
    topic.name,
    redPosition,
    bluePosition
  );

  conversation.push({
    agent: "Bridge Agent",
    role: "bridge",
    content: bridgeResult.summary,
    timestamp: now(),
  });

  // 6. Run Democracy Guard
  console.log(`  Democracy check for "${topic.name}"...`);
  const democracyResult = await runDemocracyGuard(
    topic.name,
    redPosition,
    bluePosition,
    bridgeResult.summary,
    bridgeResult.compromisePaths
  );

  conversation.push({
    agent: "Democracy Guard",
    role: "guard",
    content: democracyResult.summary,
    timestamp: now(),
  });

  // 7. Run Policy Drafter
  console.log(`  Drafting policy for "${topic.name}"...`);
  const policyDraft = await runPolicyDrafter(
    topic.name,
    redPosition,
    bluePosition,
    bridgeResult.compromisePaths,
    democracyResult.flags
  );

  conversation.push({
    agent: "Policy Drafter",
    role: "drafter",
    content: policyDraft,
    timestamp: now(),
  });

  // 8. Build source speech metadata for attribution
  const sourceGranuleIds = topic.speeches.map((s) => s.granuleId);
  const sourceSpeechIds = allSpeeches
    .filter((s) => sourceGranuleIds.includes(s.granuleId))
    .map((s) => s.id);

  const sourceSpeechMeta: SpeechMeta[] = topic.speeches.map((s) => {
    const dbSpeech = allSpeeches.find((db) => db.granuleId === s.granuleId);
    return {
      granuleId: s.granuleId,
      speaker: s.speaker || dbSpeech?.speaker || null,
      party: s.party,
      chamber: s.chamber,
      title: dbSpeech?.title || "",
      corePosition: s.corePosition,
    };
  });

  // 9. Save the brief
  await db.insert(briefs).values({
    date,
    topic: topic.name,
    slug: topic.slug,
    redPosition,
    bluePosition,
    sharedValues: bridgeResult.sharedValues,
    differences: bridgeResult.genuineDifferences,
    compromisePaths: bridgeResult.compromisePaths,
    democracyCheck: democracyResult.summary,
    democracyFlagged: !democracyResult.passed,
    policyDraft,
    agentConversation: conversation,
    collaborationScore: scoutInfo ? `${scoutInfo.score}/10` : null,
    collaborationReason: scoutInfo?.reason || null,
    sourceSpeechMeta,
    sourceSpeechIds,
  });

  console.log(`  ✓ Brief saved for "${topic.name}"`);
  return true;
}
