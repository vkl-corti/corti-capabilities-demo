import { useCallback, useState } from "react";
import { composeCapability, getAgentMode } from "../agent/agentApi";
import type { AgentMode, ComposeResult } from "../types";

/** library (overview tree) → input (try it yourself) → composing → tree (result) */
export type Phase = "library" | "input" | "composing" | "tree";

export function useCompose() {
  const [phase, setPhase] = useState<Phase>("library");
  const [result, setResult] = useState<ComposeResult | null>(null);
  const [mode, setMode] = useState<AgentMode>("mock");

  const refreshMode = useCallback(async () => {
    setMode(await getAgentMode());
  }, []);

  const compose = useCallback(async (goal: string) => {
    setPhase("composing");
    setResult(null);
    try {
      const r = await composeCapability(goal);
      setResult(r);
      setPhase("tree");
    } catch (err) {
      console.error("Compose failed:", err);
      setPhase("input");
    }
  }, []);

  /** Open the "try it yourself" goal input. */
  const start = useCallback(() => setPhase("input"), []);

  /** Back to the library overview. */
  const reset = useCallback(() => {
    setResult(null);
    setPhase("library");
  }, []);

  return { phase, result, mode, refreshMode, compose, start, reset };
}
