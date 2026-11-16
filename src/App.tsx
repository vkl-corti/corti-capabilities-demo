import { useCallback, useEffect, useState } from "react";
import { useCompose } from "./hooks/useCompose";
import { useRoute, type Route } from "./hooks/useRoute";
import { useViewHistory } from "./hooks/useViewHistory";
import { TreePage } from "./components/TreePage";
import { DayPage } from "./components/DayPage";
import { AllPage } from "./components/AllPage";
import { GoalInput } from "./components/GoalInput";
import { Questionnaire } from "./components/Questionnaire";
import { ComposingState } from "./components/ComposingState";
import { LibraryGraph, ComposeBanner } from "./components/LibraryGraph";
import { DetailPanel } from "./components/DetailPanel";
import { UnderTheHood } from "./components/UnderTheHood";
import { ModeBadge } from "./components/ModeBadge";
import { CapabilityDrawer } from "./components/CapabilityDrawer";

const NAV: { route: Route; label: string }[] = [
  { route: "tree", label: "Capability tree" },
  { route: "day", label: "A day in the life" },
  { route: "all", label: "All capabilities" },
];

export default function App() {
  const { route, navigate } = useRoute();
  const { phase, result, mode, refreshMode, compose, start, reset } = useCompose();
  const { history, record } = useViewHistory();
  const [activeGoal, setActiveGoal] = useState("");
  const [treePinned, setTreePinned] = useState<string | null>(null);
  const [resultSelected, setResultSelected] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [tryKey, setTryKey] = useState(0);

  useEffect(() => {
    refreshMode();
  }, [refreshMode]);

  // An agent match counts as interest too → feeds recommendations.
  useEffect(() => {
    if (result) record(result.response.capabilityId);
  }, [result, record]);

  /** Tree: pin in the tree. Composer result: swap the panel. Elsewhere: drawer. */
  const open = (id: string | null) => {
    if (id) record(id);
    if (route === "tree") setTreePinned(id);
    else if (route === "try" && phase === "tree") setResultSelected(id);
    else setDrawerId(id);
  };

  const openRecommendation = (id: string) => {
    record(id);
    setDrawerId(id);
  };

  const recordMany = useCallback((ids: string[]) => ids.forEach(record), [record]);

  const showInTree = (id: string) => {
    setDrawerId(null);
    setTreePinned(id);
    navigate("tree");
  };

  /** Try it yourself = the guided questionnaire (phase "library"); free text is phase "input". */
  const goTry = () => {
    reset();
    setTryKey((k) => k + 1);
    setResultSelected(null);
    navigate("try");
  };

  const handleCompose = (goal: string) => {
    setActiveGoal(goal);
    setResultSelected(null);
    compose(goal);
  };

  const shownCapId = resultSelected ?? result?.response.capabilityId;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-corti-border-faint bg-corti-bg-primary/85 backdrop-blur">
        <div className="cd-shell flex h-14 items-center justify-between gap-6 px-8">
          <button type="button" onClick={() => navigate("tree")} className="flex shrink-0 items-center gap-3" title="Capability tree">
            <img src={`${import.meta.env.BASE_URL}corti-logo-white.svg`} alt="Corti" className="h-[18px] w-auto" />
            <span className="h-4 w-px bg-corti-border-tree" />
            <span className="cd-eyebrow">Capabilities</span>
          </button>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.route}
                type="button"
                onClick={() => navigate(n.route)}
                className={`rounded-md px-3 py-1.5 text-[13.5px] transition-colors ${
                  route === n.route ? "bg-corti-bg-card text-corti-text-primary" : "text-corti-text-tertiary hover:text-corti-text-primary"
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" className={route === "try" ? "cd-btn cd-btn-sm" : "cd-btn-primary cd-btn-sm"} onClick={goTry}>
              {route === "try" ? "Start over" : "Get recommendations"}
            </button>
            <ModeBadge mode={mode} />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="cd-shell min-h-full">
          {route === "tree" && (
            <TreePage pinned={treePinned} onSelect={open} history={history} onDay={() => navigate("day")} onTry={goTry} />
          )}
          {route === "day" && <DayPage onOpen={open} onTree={() => navigate("tree")} />}
          {route === "all" && <AllPage onOpen={open} />}

          {route === "try" && phase === "library" && <Questionnaire key={tryKey} onFreeText={start} onResult={recordMany} onOpen={openRecommendation} />}
          {route === "try" && phase === "input" && <GoalInput onCompose={handleCompose} onGuided={reset} />}
          {route === "try" && phase === "composing" && <ComposingState goal={activeGoal} />}
          {route === "try" && phase === "tree" && result && shownCapId && (
            <>
              <section className="cd-rule px-8 py-8">
                <ComposeBanner response={result.response} goal={result.goal} />
              </section>
              <section className="grid gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_400px]">
                <div className="min-w-0">
                  <LibraryGraph
                    highlightedCapId={shownCapId}
                    matchedCapId={result.response.capabilityId}
                    insights={result.response.nodeInsights}
                    onSelectCapability={open}
                    extraCapIds={[result.response.capabilityId, resultSelected]}
                  />
                </div>
                <div className="xl:pt-[30px]">
                  <DetailPanel result={result} capabilityId={shownCapId} onSelect={open} />
                </div>
              </section>
              <section className="px-8 pb-8">
                <UnderTheHood result={result} />
              </section>
            </>
          )}
        </div>
      </main>

      <CapabilityDrawer capabilityId={drawerId} onClose={() => setDrawerId(null)} onSelect={open} onShowInMap={showInTree} />

      <footer className="border-t border-corti-border-faint">
        <div className="cd-shell flex h-12 items-center justify-between px-8">
          <p className="text-[12px] text-corti-text-tertiary">
            Demo · fictional scenarios, grounded taxonomy. Product and primitive links open on corti.ai.
          </p>
          <p className="cd-tag">corti.ai</p>
        </div>
      </footer>
    </div>
  );
}
