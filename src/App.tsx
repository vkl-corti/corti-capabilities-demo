import { useEffect, useState } from "react";
import { useCompose } from "./hooks/useCompose";
import { useViewHistory } from "./hooks/useViewHistory";
import { LibraryOverview } from "./components/LibraryOverview";
import { GoalInput } from "./components/GoalInput";
import { ComposingState } from "./components/ComposingState";
import { LibraryGraph, ComposeBanner } from "./components/LibraryGraph";
import { DetailPanel } from "./components/DetailPanel";
import { UnderTheHood } from "./components/UnderTheHood";
import { ModeBadge } from "./components/ModeBadge";
import { CapabilityDrawer } from "./components/CapabilityDrawer";
import type { CapabilityCategory } from "./types";

export default function App() {
  const { phase, result, mode, refreshMode, compose, start, reset } = useCompose();
  const { history, record, clear } = useViewHistory();
  const [activeGoal, setActiveGoal] = useState("");
  const [selectedCapId, setSelectedCapId] = useState<string | null>(null);
  const [libPinned, setLibPinned] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [role, setRole] = useState<CapabilityCategory | null>(null);

  useEffect(() => {
    refreshMode();
  }, [refreshMode]);

  // An agent match counts as interest too → feeds "For you".
  useEffect(() => {
    if (result) record(result.response.capabilityId);
  }, [result, record]);

  const openCapability = (id: string) => {
    record(id);
    if (phase === "tree") {
      setSelectedCapId(id);
      return;
    }
    setDrawerId(id);
    setLibPinned(id);
  };

  const showInMap = (id: string) => {
    setDrawerId(null);
    setLibPinned(id);
    requestAnimationFrame(() => document.getElementById("primitives-map")?.scrollIntoView({ behavior: "smooth" }));
  };

  const handleCompose = (goal: string) => {
    setActiveGoal(goal);
    setSelectedCapId(null);
    compose(goal);
  };

  const shownCapId = selectedCapId ?? result?.response.capabilityId;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-corti-border-faint bg-corti-bg-primary/85 backdrop-blur">
        <div className="cd-shell flex h-14 items-center justify-between px-8">
          <button type="button" onClick={reset} className="flex items-center gap-3" title="Back to capabilities">
            <img src={`${import.meta.env.BASE_URL}corti-logo-white.svg`} alt="Corti" className="h-[18px] w-auto" />
            <span className="h-4 w-px bg-corti-border-tree" />
            <span className="cd-eyebrow">Capabilities</span>
          </button>
          <div className="flex items-center gap-2">
            {phase === "library" && (
              <button type="button" className="cd-btn cd-btn-sm" onClick={start}>
                Try it yourself
              </button>
            )}
            {phase !== "library" && (
              <button type="button" className="cd-btn-ghost cd-btn-sm" onClick={reset}>
                ← All capabilities
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
              onOpen={openCapability}
              pinned={libPinned}
              history={history}
              onClearHistory={clear}
              role={role}
              setRole={setRole}
            />
          )}
          {phase === "input" && <GoalInput onCompose={handleCompose} />}
          {phase === "composing" && <ComposingState goal={activeGoal} />}

          {phase === "tree" && result && shownCapId && (
            <>
              <section className="cd-rule px-8 py-8">
                <ComposeBanner response={result.response} goal={result.goal} />
              </section>
              <section className="grid gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="min-w-0">
                  <LibraryGraph
                    highlightedCapId={shownCapId}
                    matchedCapId={result.response.capabilityId}
                    insights={result.response.nodeInsights}
                    onSelectCapability={openCapability}
                    extraCapIds={[result.response.capabilityId, selectedCapId]}
                  />
                </div>
                <div className="xl:pt-[30px]">
                  <DetailPanel result={result} capabilityId={shownCapId} onSelect={openCapability} />
                </div>
              </section>
              <section className="px-8 pb-8">
                <UnderTheHood result={result} />
              </section>
            </>
          )}
        </div>
      </main>

      <CapabilityDrawer
        capabilityId={drawerId}
        onClose={() => setDrawerId(null)}
        onSelect={openCapability}
        onShowInMap={showInMap}
      />

      <footer className="border-t border-corti-border-faint">
        <div className="cd-shell flex h-12 items-center justify-between px-8">
          <p className="text-[12px] text-corti-text-tertiary">
            Demo · fictional goals, grounded taxonomy. Product and primitive links open on corti.ai.
          </p>
          <p className="cd-tag">corti.ai</p>
        </div>
      </footer>
    </div>
  );
}
