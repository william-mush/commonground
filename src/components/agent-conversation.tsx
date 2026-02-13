import type { AgentMessage } from "@/lib/db/schema";

const agentStyles: Record<
  string,
  { bg: string; border: string; accent: string; label: string }
> = {
  intake: {
    bg: "bg-purple-bg",
    border: "border-purple-border",
    accent: "text-purple-accent",
    label: "Intake Agent",
  },
  red: {
    bg: "bg-red-bg",
    border: "border-red-border",
    accent: "text-red-accent",
    label: "Red Agent (Conservative Steelman)",
  },
  blue: {
    bg: "bg-blue-bg",
    border: "border-blue-border",
    accent: "text-blue-accent",
    label: "Blue Agent (Progressive Steelman)",
  },
  bridge: {
    bg: "bg-green-bg",
    border: "border-green-border",
    accent: "text-green-accent",
    label: "Bridge Agent (Mediator)",
  },
  guard: {
    bg: "bg-yellow-bg",
    border: "border-yellow-border",
    accent: "text-yellow-accent",
    label: "Democracy Guard",
  },
  scout: {
    bg: "bg-purple-bg",
    border: "border-purple-border",
    accent: "text-purple-accent",
    label: "Opportunity Scout",
  },
  drafter: {
    bg: "bg-card",
    border: "border-card-border",
    accent: "text-foreground",
    label: "Policy Drafter",
  },
};

export function AgentConversation({
  messages,
}: {
  messages: AgentMessage[];
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
        Agent Conversation
      </h3>
      <p className="text-xs text-muted">
        Full transparency: see how each AI agent analyzed this topic.
      </p>
      <div className="space-y-3">
        {messages.map((msg, i) => {
          const style = agentStyles[msg.role] || agentStyles.drafter;
          return (
            <div
              key={i}
              className={`rounded-lg border ${style.border} ${style.bg} p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold ${style.accent}`}>
                  {style.label}
                </span>
                <span className="text-xs text-muted">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
