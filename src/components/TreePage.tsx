import { useMemo, useState } from "react";
import { CAPABILITIES, FEATURED_IDS, JOBS, JOB_ORDER } from "../data/capabilities";
import { recommend } from "../data/recommend";
import type { Job } from "../types";
import { DetailPanel, TrackBadge } from "./DetailPanel";
import { LibraryGraph } from "./LibraryGraph";

// Home: the tree. Capabilities on the left, the building blocks (primitives)
// they are composed from on the right. Select a capability to read it, see
// what it is built from and where it leads.
// Lenses swap which capabilities are in the tree: Highlights (top of
// PRIORITY) or one group. Order inside every lens follows PRIORITY.

type Lens = "highlights" | Job;
const HIGHLIGHTS_HINT = "Corti's products first, then the capabilities with the greatest impact";

interface Props {
  pinned: string | null;
  onSelect: (id: string | null) => void;
  history: string[];
  onTry: () => void;
  onShowAll: () => void;
}

const idsFor = (l: Lens) => (l === "highlights" ? FEATURED_IDS : CAPABILITIES.filter((c) => c.job === l).map((c) => c.id));

export function TreePage({ pinned, onSelect, history, onTry, onShowAll }: Props) {
  const [lens, setLens] = useState<Lens>("highlights");
  const baseIds = useMemo(() => idsFor(lens), [lens]);

  return (
    <>
      <section className="cd-rule flex flex-wrap items-end justify-between gap-6 px-8 py-7">
        <div className="cd-fade-up">
          <p className="cd-eyebrow mb-3">Corti capability map</p>
          <h1 className="cd-h1 mb-3 !text-[36px] xl:!text-[40px]">Every capability starts with the same building blocks.</h1>
          <p className="cd-lede max-w-[62ch]">
            See what Corti delivers today and what we build together with partners. Select any capability to trace it back to the
            primitives it is composed from.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="cd-btn-ghost" onClick={onShowAll}>
            View all capabilities
          </button>
          <button type="button" className="cd-btn-primary" onClick={onTry}>
            Get recommendations →
          </button>
        </div>
      </section>

      <section className="px-8 pb-10 pt-5">
        {/* Lenses */}
        <div className="mb-1 flex flex-wrap items-center gap-1">
          {(["highlights", ...JOB_ORDER] as Lens[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLens(l);
                if (pinned && !idsFor(l).includes(pinned)) onSelect(null);
              }}
              title={l === "highlights" ? HIGHLIGHTS_HINT : JOBS[l].verb}
              className={`rounded-full border px-3.5 py-1 text-[13px] transition-colors ${
                lens === l
                  ? "border-corti-accent text-corti-accent"
                  : "border-corti-border-faint text-corti-text-secondary hover:border-corti-border-strong hover:text-corti-text-primary"
              }`}
            >
              {l === "highlights" ? "Highlights" : JOBS[l].label}
            </button>
          ))}
        </div>
        {/* Hint + legend */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-1.5">
          <p className="text-[12.5px] text-corti-text-tertiary">{lens === "highlights" ? HIGHLIGHTS_HINT : JOBS[lens].verb}</p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-corti-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="rounded-xs border border-corti-accent/50 px-1 font-mono text-[9px] uppercase text-corti-accent">Product</span>
              Available today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded-xs border border-corti-border-tree px-1 font-mono text-[9px] uppercase text-corti-text-secondary">
                Build with us
              </span>
              Developed together through the Advance program
            </span>
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <LibraryGraph
              highlightedCapId={pinned}
              onSelectCapability={(id) => onSelect(pinned === id ? null : id)}
              extraCapIds={[pinned]}
              baseIds={baseIds}
              keepOrder
              onShowAll={onShowAll}
            />
          </div>
          <div className="xl:pt-[30px]">
            {pinned ? <DetailPanel capabilityId={pinned} onSelect={onSelect} /> : <EmptyDetail history={history} onSelect={onSelect} />}
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyDetail({ history, onSelect }: { history: string[]; onSelect: (id: string) => void }) {
  const suggestions = history.length ? recommend(history, { limit: 3 }) : [];
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-dashed border-corti-border-faint p-6">
      <div>
        <p className="cd-eyebrow mb-2">Pick a capability</p>
        <p className="text-[14px] leading-relaxed text-corti-text-secondary">
          Select any capability to see the problem it solves, the building blocks it is composed from and how to get started.
        </p>
      </div>
      <div className="space-y-3 text-[13px] leading-relaxed">
        <p>
          <span className="mr-2 rounded-xs border border-corti-accent/50 px-1 font-mono text-[9.5px] uppercase text-corti-accent">Product</span>
          <span className="text-corti-text-secondary">Available today. Go straight to the product.</span>
        </p>
        <p>
          <span className="mr-2 rounded-xs border border-corti-border-tree px-1 font-mono text-[9.5px] uppercase text-corti-text-secondary">
            Build with us
          </span>
          <span className="text-corti-text-secondary">
            Developed together through the Advance program, on the same building blocks and shaped to your workflows.
          </span>
        </p>
      </div>
      {suggestions.length > 0 && (
        <div>
          <p className="cd-tag mb-2">Suggested for you</p>
          <ul className="space-y-1.5">
            {suggestions.map((r) => (
              <li key={r.capability.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.capability.id)}
                  className="cd-card group grid w-full grid-cols-[1fr_auto] items-center gap-3 px-3.5 py-2 text-left hover:border-corti-border-strong"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium group-hover:text-corti-accent">{r.capability.name}</span>
                    <span className="block text-[12px] text-corti-text-tertiary">{r.reason}</span>
                  </span>
                  <TrackBadge cap={r.capability} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
