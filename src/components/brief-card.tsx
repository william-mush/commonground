import type { Brief } from "@/lib/db/schema";
import { format } from "date-fns";

export function BriefCard({ brief }: { brief: Brief }) {
  return (
    <a
      href={`/topic/${brief.slug}?date=${format(brief.date, "yyyy-MM-dd")}`}
      className="block border border-card-border bg-card rounded-lg p-6 hover:border-purple-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold">{brief.topic}</h3>
        {brief.democracyFlagged && (
          <span className="text-xs px-2 py-1 rounded bg-yellow-bg border border-yellow-border text-yellow-accent font-medium">
            Democracy Flag
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-md bg-red-bg border border-red-border p-3">
          <div className="text-xs font-medium text-red-accent mb-1">
            Conservative Position
          </div>
          <p className="text-sm line-clamp-3">{brief.redPosition}</p>
        </div>
        <div className="rounded-md bg-blue-bg border border-blue-border p-3">
          <div className="text-xs font-medium text-blue-accent mb-1">
            Progressive Position
          </div>
          <p className="text-sm line-clamp-3">{brief.bluePosition}</p>
        </div>
      </div>

      <div className="rounded-md bg-green-bg border border-green-border p-3 mb-3">
        <div className="text-xs font-medium text-green-accent mb-1">
          Common Ground
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(brief.sharedValues as string[])?.slice(0, 3).map((v, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-green-bg border border-green-border"
            >
              {v}
            </span>
          ))}
          {(brief.sharedValues as string[])?.length > 3 && (
            <span className="text-xs text-muted">
              +{(brief.sharedValues as string[]).length - 3} more
            </span>
          )}
        </div>
      </div>

      {(brief.compromisePaths as string[])?.length > 0 && (
        <p className="text-sm text-muted">
          {(brief.compromisePaths as string[]).length} compromise path
          {(brief.compromisePaths as string[]).length !== 1 ? "s" : ""}{" "}
          identified
        </p>
      )}
    </a>
  );
}
