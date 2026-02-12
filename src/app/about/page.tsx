export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">How CommonGround Works</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">The Problem</h2>
          <p className="text-muted leading-relaxed">
            Political media optimizes for outrage. It builds the weakest
            version of the other side&apos;s argument (strawmanning) and
            presents it as the whole truth. This makes compromise feel
            impossible, even when genuine common ground exists.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">The Approach</h2>
          <p className="text-muted leading-relaxed mb-4">
            CommonGround uses a pipeline of six specialized AI agents that
            analyze actual Congressional floor speeches from the official
            Congressional Record. Each agent has a distinct role:
          </p>

          <div className="space-y-4">
            <div className="border border-purple-border bg-purple-bg rounded-lg p-4">
              <h3 className="font-semibold text-purple-accent text-sm mb-1">
                1. Intake Agent
              </h3>
              <p className="text-sm text-muted">
                Pulls daily speeches from the GovInfo API, strips performative
                rhetoric, categorizes by topic, and identifies actual policy
                positions.
              </p>
            </div>

            <div className="border border-red-border bg-red-bg rounded-lg p-4">
              <h3 className="font-semibold text-red-accent text-sm mb-1">
                2. Red Agent (Conservative Steelman)
              </h3>
              <p className="text-sm text-muted">
                Presents the strongest possible version of conservative
                arguments. Finds the legitimate concerns, values, and
                reasoning — not a caricature.
              </p>
            </div>

            <div className="border border-blue-border bg-blue-bg rounded-lg p-4">
              <h3 className="font-semibold text-blue-accent text-sm mb-1">
                3. Blue Agent (Progressive Steelman)
              </h3>
              <p className="text-sm text-muted">
                Does the same for progressive positions. Finds the legitimate
                moral and practical foundations underlying the arguments.
              </p>
            </div>

            <div className="border border-green-border bg-green-bg rounded-lg p-4">
              <h3 className="font-semibold text-green-accent text-sm mb-1">
                4. Bridge Agent (Mediator)
              </h3>
              <p className="text-sm text-muted">
                Receives both steelmanned positions and identifies shared
                values, false dichotomies, genuine disagreements, and
                actionable compromise paths.
              </p>
            </div>

            <div className="border border-yellow-border bg-yellow-bg rounded-lg p-4">
              <h3 className="font-semibold text-yellow-accent text-sm mb-1">
                5. Democracy Guard
              </h3>
              <p className="text-sm text-muted">
                Reviews all outputs against democratic principles: rule of
                law, separation of powers, free elections, minority rights,
                civil liberties. This agent has veto power. Democracy is not a
                partisan position.
              </p>
            </div>

            <div className="border border-card-border bg-card rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-1">
                6. Policy Drafter
              </h3>
              <p className="text-sm text-muted">
                Takes the Bridge Agent&apos;s analysis and drafts readable
                compromise policy frameworks that address both sides&apos;
                core concerns while respecting the Democracy Guard&apos;s
                requirements.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Key Principles</h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-green-accent font-bold shrink-0">
                Steelmanning
              </span>
              <span className="text-muted text-sm">
                Every position is presented at its best, not its worst. This is
                the prerequisite for real dialogue.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-accent font-bold shrink-0">
                Transparency
              </span>
              <span className="text-muted text-sm">
                Every agent&apos;s reasoning is visible. You can read exactly
                why the system reached its conclusions.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-yellow-accent font-bold shrink-0">
                Democracy First
              </span>
              <span className="text-muted text-sm">
                The Democracy Guard is non-negotiable. If a position undermines
                democratic principles, the system says so clearly.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-accent font-bold shrink-0">
                No False Equivalence
              </span>
              <span className="text-muted text-sm">
                This is not &quot;both sides&quot; centrism. If one side&apos;s
                position is anti-democratic, the system flags it.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Data Source</h2>
          <p className="text-muted leading-relaxed">
            All speeches come from the official Congressional Record via the{" "}
            <span className="text-purple-accent">GovInfo API</span>,
            maintained by the U.S. Government Publishing Office. This is the
            same official record maintained by the Library of Congress.
          </p>
        </section>
      </div>
    </div>
  );
}
