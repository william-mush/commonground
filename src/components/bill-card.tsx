import type { Bill } from "@/lib/db/schema";
import { formatBillId } from "@/lib/congress";

const statusStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
  enacted: { bg: "bg-green-bg", border: "border-green-border", text: "text-green-accent", label: "Enacted" },
  passed_both: { bg: "bg-green-bg", border: "border-green-border", text: "text-green-accent", label: "Passed Both" },
  passed_one: { bg: "bg-purple-bg", border: "border-purple-border", text: "text-purple-accent", label: "Passed Chamber" },
  floor: { bg: "bg-purple-bg", border: "border-purple-border", text: "text-purple-accent", label: "On Floor" },
  committee: { bg: "bg-blue-bg", border: "border-blue-border", text: "text-blue-accent", label: "In Committee" },
  introduced: { bg: "bg-card", border: "border-card-border", text: "text-muted", label: "Introduced" },
  vetoed: { bg: "bg-yellow-bg", border: "border-yellow-border", text: "text-yellow-accent", label: "Vetoed" },
};

export function BillCard({
  bill,
  linkedTopics,
  compact = false,
}: {
  bill: Bill;
  linkedTopics?: string[];
  compact?: boolean;
}) {
  const style = statusStyles[bill.status] || statusStyles.introduced;
  const rCount = parseInt(bill.cosponsorCountR || "0");
  const dCount = parseInt(bill.cosponsorCountD || "0");
  const total = rCount + dCount || 1;
  const rPercent = Math.round((rCount / total) * 100);
  const score = bill.bipartisanScore ? parseFloat(bill.bipartisanScore) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2">
        <span className="text-xs font-mono text-purple-accent whitespace-nowrap">
          {formatBillId(bill.billType, bill.billNumber)}
        </span>
        <span className="text-sm flex-1 line-clamp-1">{bill.title}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.border} border ${style.text}`}>
          {style.label}
        </span>
        {score > 0 && (
          <span className="text-xs text-muted whitespace-nowrap">
            {Math.round(score * 100)}% bipartisan
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="border border-card-border bg-card rounded-lg p-5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-bg border border-purple-border text-purple-accent">
            {formatBillId(bill.billType, bill.billNumber)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded border ${style.bg} ${style.border} ${style.text}`}>
            {style.label}
          </span>
        </div>
        {bill.congressGovUrl && (
          <a
            href={bill.congressGovUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            Congress.gov &rarr;
          </a>
        )}
      </div>

      <h3 className="text-sm font-semibold mb-2 line-clamp-2">{bill.title}</h3>

      {/* Sponsor */}
      {bill.sponsorName && (
        <p className="text-xs text-muted mb-3">
          Sponsor:{" "}
          <span className={bill.sponsorParty === "R" ? "text-red-accent" : bill.sponsorParty === "D" ? "text-blue-accent" : ""}>
            {bill.sponsorName}
          </span>
          {bill.sponsorParty && ` (${bill.sponsorParty})`}
          {bill.sponsorState && `-${bill.sponsorState}`}
        </p>
      )}

      {/* Bipartisan Score Bar */}
      {score > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-red-accent">{rCount} R</span>
            <span className="font-medium">{Math.round(score * 100)}% Bipartisan</span>
            <span className="text-blue-accent">{dCount} D</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-red-accent/70 transition-all"
              style={{ width: `${rPercent}%` }}
            />
            <div
              className="bg-blue-accent/70 transition-all"
              style={{ width: `${100 - rPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Latest action */}
      {bill.latestActionText && (
        <p className="text-xs text-muted line-clamp-1">
          Latest: {bill.latestActionText}
        </p>
      )}

      {/* Linked topics */}
      {linkedTopics && linkedTopics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {linkedTopics.map((slug) => (
            <span
              key={slug}
              className="text-xs px-2 py-0.5 rounded-full bg-green-bg border border-green-border text-green-accent"
            >
              {slug.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
