import { useEffect, useState } from "react";
import { useCompose } from "./hooks/useCompose";
import { LibraryOverview } from "./components/LibraryOverview";
import { GoalInput } from "./components/GoalInput";
import { ComposingState } from "./components/ComposingState";
import { LibraryGraph, ComposeBanner } from "./components/LibraryGraph";
import { DetailPanel } from "./components/DetailPanel";
import { UnderTheHood } from "./components/UnderTheHood";
import { ModeBadge } from "./components/ModeBadge";
import { AllCapabilities } from "./components/AllCapabilities";
import { CAPABILITIES } from "./data/capabilities";

export default function App() {
  const { phase, result, mode, refreshMode, compose, start, reset } = useCompose();
  const [activeGoal, setActiveGoal] = useState("");
  const [selectedCapId, setSelectedCapId] = useState<string | null>(null);
  const [libPinned, setLibPinned] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  /** Picked from the full list: show it in the tree of the current screen. */
  const handlePickFromAll = (id: string) => {
    setShowAll(false);
    if (phase === "tree") {
      setSelectedCapId(id);
    } else {
      if (phase !== "library") reset();
      setLibPinned(id);
    }
  };

  useEffect(() => {
    refreshMode();
  }, [refreshMode]);

  const handleCompose = (goal: string) => {
    setActiveGoal(goal);
    setSelectedCapId(null);
    compose(goal);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Every phase shares the same 80rem shell → left edges line up across screens */}
      <header className="sticky top-0 z-30 border-b border-corti-border-faint bg-corti-bg-primary/85 backdrop-blur">
        <div className="cd-shell flex h-14 items-center justify-between px-8">
          <button type="button" onClick={reset} className="flex items-center gap-3" title="Back to the library">
            <img src={`${import.meta.env.BASE_URL}corti-logo-white.svg`} alt="Corti" className="h-[18px] w-auto" />
            <span className="h-4 w-px bg-corti-border-tree" />
            <span className="cd-eyebrow">Capability library</span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className="cd-btn-ghost cd-btn-sm" onClick={() => setShowAll(true)}>
              All {CAPABILITIES.length} capabilities
            </button>
            {phase === "library" && (
              <button type="button" className="cd-btn cd-btn-sm" onClick={start}>
                Try it yourself
              </button>
            )}
            {phase !== "library" && (
              <button type="button" className="cd-btn-ghost cd-btn-sm" onClick={reset}>
                ← Library
              </button>
            )}
            {phase === "tree" && (
              <button type="button" className="cd-btn cd-btn-sm" onClick={start}>
                New goal
              </button>
            )}
            <ModeBadge mode={mode} />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="cd-shell min-h-full">
          {phase === "library" && (
            <LibraryOverview
              onTryIt={start}
              onShowAll={() => setShowAll(true)}
              pinned={libPinned}
              setPinned={setLibPinned}
            />
          )}
          {phase === "input" && <GoalInput onCompose={handleCompose} />}
          {phase === "composing" && <ComposingState goal={activeGoal} />}

          {phase === "tree" && result && (
            <>
              <section className="cd-rule px-8 py-8">
                <ComposeBanner response={result.response} goal={result.goal} />
              </section>
              <section className="grid gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="min-w-0">
                  <LibraryGraph
                    highlightedCapId={selectedCapId ?? result.response.capabilityId}
                    matchedCapId={result.response.capabilityId}
                    insights={result.response.nodeInsights}
                    onSelectCapability={setSelectedCapId}
                    extraCapIds={[result.response.capabilityId, selectedCapId]}
                    onShowAll={() => setShowAll(true)}
                  />
                </div>
                <div className="xl:pt-[30px]">
                  <DetailPanel result={result} capabilityId={selectedCapId ?? result.response.capabilityId} />
                </div>
              </section>
              <section className="px-8 pb-8">
                <UnderTheHood result={result} />
              </section>
            </>
          )}
        </div>
      </main>

      <AllCapabilities open={showAll} onClose={() => setShowAll(false)} onSelect={handlePickFromAll} />

      <footer className="border-t border-corti-border-faint">
        <div className="cd-shell flex h-12 items-center justify-between px-8">
          <p className="text-[12px] text-corti-text-tertiary">
            Demo · fictional goals, grounded taxonomy. Primitive links open on corti.ai.
          </p>
          <p className="cd-tag">corti.ai</p>
        </div>
      </footer>
    </div>
  );
}
