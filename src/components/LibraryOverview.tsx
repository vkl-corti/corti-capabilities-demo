import { FEATURED_IDS, PRIMITIVES } from "../data/capabilities";
import { LibraryGraph } from "./LibraryGraph";
import { DetailPanel } from "./DetailPanel";

// First slide: the whole tree. Primitives → capabilities (from Notion), and a
// "try it yourself" CTA that hands over to the live composer. Clicking a
// capability opens the full readable detail panel beside the graph.

interface Props {
  onTryIt: () => void;
  onShowAll: () => void;
  /** Pinned capability — lifted to App so the full list can pin from anywhere. */
  pinned: string | null;
  setPinned: (id: string | null) => void;
}

export function LibraryOverview({ onTryIt, onShowAll, pinned, setPinned }: Props) {

  return (
    <>
      {/* Hero row: copy left, CTA right — split by a hairline like corti.ai */}
      <section className="cd-rule grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="cd-fade-up px-8 py-6 lg:border-r lg:border-corti-border-faint">
          <p className="cd-eyebrow mb-3">Corti capability library</p>
          <h1 className="cd-h1 mb-2 !text-[36px] xl:!text-[40px]">
            {Object.keys(PRIMITIVES).length} building blocks.{" "}
            <span className="text-corti-text-tertiary">{FEATURED_IDS.length} clinical workflows.</span>
          </h1>
          <p className="cd-lede max-w-[46ch]">
            Every capability is composed from the same primitives. Hover a block to see what it powers.
          </p>
        </div>

        <div className="cd-dotted flex flex-col justify-center gap-3 px-8 py-6">
          <p className="cd-eyebrow">Try it yourself</p>
          <button
            type="button"
            onClick={onTryIt}
            className="group flex h-12 w-full items-center gap-3 rounded-md border border-corti-border-strong bg-corti-bg-card px-4 text-left transition-colors hover:border-corti-accent"
          >
            <span className="font-mono text-[13px] text-corti-accent">&gt;</span>
            <span className="flex-1 truncate text-[15px] text-corti-text-tertiary group-hover:text-corti-text-secondary">
              Tell me what you want to get done…
            </span>
            <span className="cd-caret h-5 w-[2px] bg-corti-accent" />
          </button>
          <div className="flex items-center gap-3">
            <button type="button" className="cd-btn-primary cd-pulse" onClick={onTryIt}>
              Try it out yourself →
            </button>
            <span className="text-[13px] text-corti-text-tertiary">A live Corti agent composes it for you.</span>
          </div>
        </div>
      </section>

      {/* The tree + full detail panel for the clicked capability */}
      <section className="px-8 pb-6 pt-5">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <LibraryGraph
              highlightedCapId={pinned}
              onSelectCapability={(id) => setPinned(pinned === id ? null : id)}
              extraCapIds={[pinned]}
              onShowAll={onShowAll}
            />
          </div>
          <div className="xl:pt-[30px]">
            {pinned ? (
              <DetailPanel capabilityId={pinned} />
            ) : (
              <div className="flex min-h-[280px] flex-col justify-center gap-2 rounded-lg border border-dashed border-corti-border-faint p-6">
                <p className="cd-eyebrow">Details</p>
                <p className="text-[14px] leading-relaxed text-corti-text-secondary">
                  Click any capability to read about it — what it’s built from, what each
                  primitive does here, and what you get out of it.
                </p>
                <p className="text-[13px] text-corti-text-tertiary">
                  <button
                    type="button"
                    onClick={onShowAll}
                    className="text-corti-text-primary underline decoration-dotted underline-offset-4 hover:text-corti-accent"
                  >
                    Browse all capabilities
                  </button>{" "}
                  or, if you don’t see your workflow,{" "}
                  <button
                    type="button"
                    onClick={onTryIt}
                    className="text-corti-text-primary underline decoration-dotted underline-offset-4 hover:text-corti-accent"
                  >
                    Tell us what you need
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
