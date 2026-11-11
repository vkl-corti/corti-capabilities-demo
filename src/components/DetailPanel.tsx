import { PRIMITIVES, getCapability } from "../data/capabilities";
import type { ComposeResult } from "../types";

interface Props {
  /** Present in the composer result view; absent when browsing the library. */
  result?: ComposeResult | null;
  capabilityId: string;
}

export function DetailPanel({ result, capabilityId }: Props) {
  const cap = getCapability(capabilityId);
  if (!cap) return null;
  const insights = result?.response.nodeInsights ?? {};
  const isMatch = !!result && result.response.capabilityId === cap.id;

  return (
    <aside key={cap.id} className="cd-card cd-fade-up flex flex-col overflow-hidden">
      <div className="border-b border-corti-border-faint p-5">
        <p className={`cd-tag mb-2 ${isMatch ? "!text-corti-accent" : ""}`}>
          {cap.category}{isMatch ? " · Best match" : ""}
        </p>
        <h2 className="cd-h2 mb-2">{cap.name}</h2>
        <p className="text-[14px] leading-relaxed text-corti-text-secondary">{cap.outcome}</p>
      </div>

      <div className="border-b border-corti-border-faint p-5">
        <p className="cd-tag mb-2">The problem</p>
        <p className="mb-4 text-[13.5px] leading-relaxed text-corti-text-secondary">{cap.whenToUse}</p>
        <p className="cd-tag mb-2">How it works</p>
        <p className="text-[13.5px] leading-relaxed text-corti-text-secondary">{cap.howItWorks}</p>
      </div>

      <div className="border-b border-corti-border-faint p-5">
        <p className="cd-tag mb-3">Pipeline</p>
        <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-corti-border-tree">
          {cap.pipeline.map((step, i) => {
            const prim = PRIMITIVES[step.primitiveId];
            return (
              <li key={step.primitiveId} className="relative grid grid-cols-[24px_1fr] gap-3">
                <span className="z-10 flex h-6 w-6 items-center justify-center rounded-full border border-corti-accent/60 bg-corti-bg-card font-mono text-[10px] text-corti-accent">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <a
                    href={prim?.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14px] font-medium hover:text-corti-accent"
                  >
                    {prim?.name ?? step.primitiveId} <span className="text-corti-text-tertiary">↗</span>
                  </a>
                  <p className="text-[13px] leading-snug text-corti-text-secondary">{step.roleInPipeline}</p>
                  <p className="mt-1 text-[13px] leading-snug text-corti-text-primary">
                    <span className="text-corti-accent">→</span> {step.clinicianOutcome}
                  </p>
                  {insights[step.primitiveId] && (
                    <p className="mt-1 text-[12px] italic leading-snug text-corti-text-tertiary">
                      For your goal: {insights[step.primitiveId]}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-5 p-5">
        <div>
          <p className="cd-tag mb-2">Connects to</p>
          <ul className="space-y-1 text-[13px]">
            {cap.connectors.map((c) => (
              <li key={c.id} title={c.roleInPipeline} className="text-corti-text-secondary">
                {c.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="cd-tag mb-2">Trust layer</p>
          <ul className="space-y-1 text-[13px]">
            {cap.trust.map((t) => (
              <li key={t.id} title={t.roleInPipeline} className="text-corti-text-secondary">
                {t.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
