import type { AgentMode } from "../types";

export function ModeBadge({ mode }: { mode: AgentMode }) {
  const live = mode === "real";
  return (
    <span
      className="inline-flex h-7 items-center gap-2 rounded-full border border-corti-border-faint px-3 font-mono text-[11px] uppercase tracking-mono text-corti-text-secondary"
      title={live ? "Real calls to the Corti Agentic Framework" : "Offline heuristics — the demo never breaks"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-corti-accent" : "bg-corti-text-tertiary"}`} />
      Corti API · {live ? "Live" : "Mock"}
    </span>
  );
}
