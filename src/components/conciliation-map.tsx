import type { Brief } from "@/lib/db/schema";

export function ConciliationMap({ brief }: { brief: Brief }) {
  const sharedValues = brief.sharedValues as string[];
  const differences = brief.differences as string[];
  const compromisePaths = brief.compromisePaths as string[];

  return (
    <div className="space-y-6">
      {/* Shared Values */}
      {sharedValues?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-green-accent mb-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-accent" />
            Shared Values
          </h4>
          <ul className="space-y-1.5">
            {sharedValues.map((v, i) => (
              <li
                key={i}
                className="text-sm pl-4 border-l-2 border-green-border py-1"
              >
                {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Genuine Differences */}
      {differences?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-yellow-accent mb-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-accent" />
            Genuine Differences
          </h4>
          <ul className="space-y-1.5">
            {differences.map((d, i) => (
              <li
                key={i}
                className="text-sm pl-4 border-l-2 border-yellow-border py-1"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Compromise Paths */}
      {compromisePaths?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-purple-accent mb-2 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-accent" />
            Compromise Paths
          </h4>
          <ul className="space-y-2">
            {compromisePaths.map((p, i) => (
              <li
                key={i}
                className="text-sm pl-4 border-l-2 border-purple-border py-1"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
