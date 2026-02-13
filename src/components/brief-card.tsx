import type { Brief } from "@/lib/db/schema";
import { format } from "date-fns";
import Link from "next/link";

function truncateAtSentence(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastPeriod = truncated.lastIndexOf(". ");
  if (lastPeriod > maxLen * 0.4) {
    return truncated.slice(0, lastPeriod + 1);
  }
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.slice(0, lastSpace > 0 ? lastSpace : maxLen) + "...";
}

function scoreLabel(n: number): string {
  if (n >= 8) return "Strong";
  if (n >= 6) return "Promising";
  if (n >= 4) return "Moderate";
  return "Low";
}

function scoreColor(n: number): string {
  if (n >= 7) return "text-green-accent";
  if (n >= 4) return "text-yellow-accent";
  return "text-red-accent";
}

function ScoreRing({ score }: { score: number }) {
  // SVG donut ring — filled arc proportional to score/10
  const radius = 28;
  const stroke = 5;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 10) * circ;
  const gap = circ - filled;
  const fillColor =
    score >= 7 ? "var(--green-accent)" : score >= 4 ? "var(--yellow-accent)" : "var(--red-accent)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 68, height: 68 }}>
      <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
        {/* Track */}
        <circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth={stroke}
        />
        {/* Filled arc */}
        <circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${gap}`}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-lg font-bold ${scoreColor(score)}`}>
        {score}
      </span>
    </div>
  );
}

export function BriefCard({
  brief,
  relatedBillCount,
}: {
  brief: Brief;
  relatedBillCount?: number;
}) {
  const sharedValues = (brief.sharedValues as string[]) || [];
  const compromisePaths = (brief.compromisePaths as string[]) || [];
  const scoreNum = brief.collaborationScore
    ? parseInt(brief.collaborationScore.replace(/[^0-9]/g, ""), 10) || 0
    : 0;

  return (
    <Link
      href={`/topic/${brief.slug}?date=${format(brief.date, "yyyy-MM-dd")}`}
      className="group block border border-card-border bg-card rounded-xl hover:border-purple-accent/50 hover:shadow-lg transition-all overflow-hidden"
    >
      {/* ===== TOP: Title + Score Ring ===== */}
      <div className="flex items-center gap-4 p-5 pb-3">
        {scoreNum > 0 && (
          <div className="shrink-0 text-center">
            <ScoreRing score={scoreNum} />
            <div className={`text-[10px] font-semibold mt-0.5 ${scoreColor(scoreNum)}`}>
              {scoreLabel(scoreNum)}
            </div>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-tight mb-1">{brief.topic}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {scoreNum > 0 && (
              <span className="text-xs text-muted">
                Collaboration potential
              </span>
            )}
            {brief.democracyFlagged && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-yellow-bg border border-yellow-border text-yellow-accent font-semibold inline-flex items-center gap-0.5">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Democracy concern
              </span>
            )}
            {relatedBillCount != null && relatedBillCount > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-bg border border-green-border text-green-accent font-semibold">
                {relatedBillCount} bill{relatedBillCount !== 1 ? "s" : ""} in Congress
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== HERO: Common Ground — the whole point ===== */}
      {sharedValues.length > 0 && (
        <div className="mx-4 mb-3 rounded-lg bg-green-bg border border-green-border px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-5 h-5 text-green-accent" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold text-green-accent">
              Both sides agree on
            </span>
          </div>
          <ul className="space-y-1">
            {sharedValues.map((v, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-accent shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[15px] leading-snug">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== Paths Forward — concrete proposals ===== */}
      {compromisePaths.length > 0 && (
        <div className="mx-4 mb-3 rounded-lg bg-purple-bg border border-purple-border px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-5 h-5 text-purple-accent" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold text-purple-accent">
              {compromisePaths.length} concrete proposals
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
            {compromisePaths.map((path, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-accent text-white text-[11px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm leading-snug">{path}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Positions — small, de-emphasized ===== */}
      <div className="grid grid-cols-2 gap-2 mx-4 mb-3">
        <div className="rounded-md bg-red-bg/60 border border-red-border/50 px-3 py-2">
          <div className="flex items-center gap-1 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-accent" />
            <span className="text-[11px] font-semibold text-red-accent uppercase tracking-wide">
              Conservative
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {truncateAtSentence(brief.redPosition, 150)}
          </p>
        </div>
        <div className="rounded-md bg-blue-bg/60 border border-blue-border/50 px-3 py-2">
          <div className="flex items-center gap-1 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-accent" />
            <span className="text-[11px] font-semibold text-blue-accent uppercase tracking-wide">
              Progressive
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {truncateAtSentence(brief.bluePosition, 150)}
          </p>
        </div>
      </div>

      {/* ===== CTA Footer ===== */}
      <div className="px-4 py-2.5 border-t border-card-border flex items-center justify-end">
        <span className="text-sm font-medium text-purple-accent group-hover:underline">
          Read full analysis &rarr;
        </span>
      </div>
    </Link>
  );
}
