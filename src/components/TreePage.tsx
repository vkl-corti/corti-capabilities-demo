import { useMemo, useState } from "react";
import { CAPABILITIES, FEATURED_IDS, JOBS, JOB_ORDER, PRIMITIVES, PRODUCT_CAPABILITIES } from "../data/capabilities";
import { recommend } from "../data/recommend";
import type { Job } from "../types";
import { DetailPanel, TrackBadge } from "./DetailPanel";
import { LibraryGraph } from "./LibraryGraph";

// Home: the tree. Capabilities on the left, the primitives they are built from on the right; click a
// capability to read it, see what it's built from and where it leads.
// Lenses swap which capabilities are in the tree (highlights, or one job).

type Lens = "highlights" | Job;

interface Props {
  pinned: string | null;
  onSelect: (id: string | null) => void;
  history: string[];
  onDay: () => void;
  onTry: () => void;
}

export function TreePage({ pinned, onSelect, history, onDay, onTry }: Props) {
  const [lens, setLens] = useState<Lens>("highlights");

  const baseIds = useMemo(
    () => (lens === "highlights" ? FEATURED_IDS : CAPABILITIES.filter((c) => c.job === lens).map((c) => c.id)),
    [lens],
  );

  return (
    <>
      <section className="cd-rule flex flex-wrap items-end justify-between gap-6 px-8 py-7">
        <div className="cd-fade-up">
          <p className="cd-eyebrow mb-3">Corti capabilities</p>
          <h1 className="cd-h1 mb-2 !text-[36px] xl:!text-[40px]">
            What can Corti do in your clinic?
          </h1>
          <p className="cd-lede max-w-[60ch]">
            {CAPABILITIES.length} capabilities, all built from the same {Object.keys(PRIMITIVES).length} primitives.{" "}
            {PRODUCT_CAPABILITIES.length} are products you can use today. The rest we build with you.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="cd-btn-ghost" onClick={onDay}>
            See a day in the clinic
          </button>
          <button type="button" className="cd-btn-primary" onClick={onTry}>
            Describe your goal →
          </button>
        </div>
      </section>

      <section className="px-8 pb-10 pt-5">
        {/* Lens bar + legend */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {(["highlights", ...JOB_ORDER] as Lens[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLens(l);
                  const next = l === "highlights" ? FEATURED_IDS : CAPABILITIES.filter((c) => c.job === l).map((c) => c.id);
                  if (pinned && !next.includes(pinned)) onSelect(null);
                }}
                title={l === "highlights" ? "A representative selection" : JOBS[l].verb}
                className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${
                  lens === l
                    ? "border-corti-accent text-corti-accent"
                    : "border-corti-border-faint text-corti-text-secondary hover:border-corti-border-strong hover:text-corti-text-primary"
                }`}
              >
                {l === "highlights" ? "Highlights" : JOBS[l].label}
              </button>
            ))}
            <span className="ml-2 text-[12.5px] text-corti-text-tertiary">
              {lens === "highlights" ? "A selection across everything" : JOBS[lens].verb}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-corti-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="rounded-xs border border-corti-accent/50 px-1 font-mono text-[9px] uppercase text-corti-accent">Product</span>
              use today
            </span>
            <span>Everything else: build with us</span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <LibraryGraph
              highlightedCapId={pinned}
              onSelectCapability={(id) => onSelect(pinned === id ? null : id)}
              extraCapIds={[pinned]}
              baseIds={baseIds}
            />
          </div>
          <div className="xl:pt-[30px]">
            {pinned ? (
              <DetailPanel capabilityId={pinned} onSelect={onSelect} />
            ) : (
              <EmptyDetail history={history} onSelect={onSelect} />
            )}
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
          Click any capability in the tree to see the problem it solves, the primitives it's built from, and how to get it.
        </p>
      </div>
      <div className="space-y-3 text-[13px] leading-relaxed">
        <p>
          <span className="mr-2 rounded-xs border border-corti-accent/50 px-1 font-mono text-[9.5px] uppercase text-corti-accent">Product</span>
          <span className="text-corti-text-secondary">Ready to use today. Go straight to the product.</span>
        </p>
        <p>
          <span className="mr-2 rounded-xs border border-corti-border-tree px-1 font-mono text-[9.5px] uppercase text-corti-text-secondary">
            Build with us
          </span>
          <span className="text-corti-text-secondary">
            We build it with you on the same primitives through the Advance program, shaped to your workflows.
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
