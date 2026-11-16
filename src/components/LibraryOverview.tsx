import { CAPABILITIES, PRIMITIVES, PRODUCT_CAPABILITIES } from "../data/capabilities";
import type { CapabilityCategory } from "../types";
import { CapabilityCatalogue } from "./CapabilityCatalogue";
import { LibraryGraph } from "./LibraryGraph";

// Landing, capability first:
//   hero (what do you need?) → products → for you → build with us →
//   the primitives map underneath it all (the boil-down).

interface Props {
  onTryIt: () => void;
  onOpen: (id: string) => void;
  /** Highlighted in the primitives map. */
  pinned: string | null;
  history: string[];
  onClearHistory: () => void;
  role: CapabilityCategory | null;
  setRole: (r: CapabilityCategory | null) => void;
}

export function LibraryOverview({ onTryIt, onOpen, pinned, history, onClearHistory, role, setRole }: Props) {
  return (
    <>
      <section className="cd-rule grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="cd-fade-up px-8 py-6 lg:border-r lg:border-corti-border-faint">
          <p className="cd-eyebrow mb-3">Corti capabilities</p>
          <h1 className="cd-h1 mb-2 !text-[36px] xl:!text-[40px]">
            {CAPABILITIES.length} clinical capabilities.{" "}
            <span className="text-corti-text-tertiary">
              {PRODUCT_CAPABILITIES.length} ready today, all built from {Object.keys(PRIMITIVES).length} primitives.
            </span>
          </h1>
          <p className="cd-lede max-w-[52ch]">
            Start from what you need to get done. Use a product today, or see what a capability is made of and build it with us.
          </p>
        </div>

        <div className="cd-dotted flex flex-col justify-center gap-3 px-8 py-6">
          <p className="cd-eyebrow">Not sure where to start?</p>
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
            <span className="text-[13px] text-corti-text-tertiary">A live Corti agent finds the capability for you.</span>
          </div>
        </div>
      </section>

      <CapabilityCatalogue onOpen={onOpen} history={history} onClearHistory={onClearHistory} role={role} setRole={setRole} />

      <section id="primitives-map" className="px-8 pb-8 pt-6">
        <div className="mb-4">
          <p className="cd-eyebrow mb-1">
            <span className="text-corti-text-tertiary">03 /</span> Under the hood
          </p>
          <h2 className="cd-h2">
            Every capability boils down to the same {Object.keys(PRIMITIVES).length} primitives{" "}
            <span className="text-corti-text-tertiary">— hover to trace one</span>
          </h2>
        </div>
        <LibraryGraph highlightedCapId={pinned} onSelectCapability={onOpen} extraCapIds={[pinned]} />
      </section>
    </>
  );
}
