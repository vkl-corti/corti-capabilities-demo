import { CAPABILITIES, getCapability } from "../data/capabilities";
import type { AgentMode, ComposeResult, ComposerResponse } from "../types";

// Single swap point: try the real endpoint first, fall back to a heuristic
// mock over the same taxonomy so the demo never breaks (EG-demo pattern).

const MOCK_LATENCY_MS = 1200;

/** Static hosting (GitHub Pages) has no backend → always mock, no failing /api requests. */
const STATIC_BUILD = import.meta.env.VITE_STATIC === "1";

export async function getAgentMode(): Promise<AgentMode> {
  if (STATIC_BUILD) return "mock";
  try {
    const res = await fetch("/api/corti/status");
    if (!res.ok) return "mock";
    const { configured } = (await res.json()) as { configured: boolean };
    return configured ? "real" : "mock";
  } catch {
    return "mock";
  }
}

// ————— Mock: keyword-match over the same taxonomy —————

function scoreMatch(goal: string, capId: string): number {
  const cap = getCapability(capId);
  if (!cap) return 0;
  const lower = goal.toLowerCase();
  let score = 0;
  for (const kw of cap.keywords) {
    if (lower.includes(kw)) score += kw.length; // longer keyword hits weigh more
  }
  return score;
}

function mockCompose(goal: string): ComposerResponse {
  const ranked = CAPABILITIES.map((c) => ({ cap: c, score: scoreMatch(goal, c.id) })).sort(
    (a, b) => b.score - a.score,
  );
  const best = ranked[0];
  const runnerUp = ranked[1]?.score > 0 ? ranked[1].cap : undefined;

  return {
    capabilityId: best.cap.id,
    goalRestated: `You want: ${goal.charAt(0).toLowerCase()}${goal.slice(1)}.`,
    rationale: `${best.cap.name} matches your goal directly: ${best.cap.outcome}`,
    clinicianFraming: best.cap.name,
    confidence: best.score > 0 ? 0.85 : 0.5,
    alternativeId: runnerUp?.id,
  };
}

// ————— Public API —————

export async function composeCapability(goal: string): Promise<ComposeResult> {
  const started = Date.now();
  const mode = await getAgentMode();

  if (mode === "real") {
    try {
      const res = await fetch("/api/corti/compose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) throw new Error(await res.text());
      const response = (await res.json()) as ComposerResponse;
      // Unknown capabilityId → treat as failure, fall through to mock.
      if (!getCapability(response.capabilityId)) {
        throw new Error(`Agent returned unknown capabilityId: ${response.capabilityId}`);
      }
      return {
        goal,
        response,
        trace: { mode: "real", agent: "composer", durationMs: Date.now() - started, request: { goal }, response },
      };
    } catch (err) {
      console.error("Real compose failed, falling back to mock:", err);
      const response = mockCompose(goal);
      return {
        goal,
        response,
        trace: {
          mode: "mock",
          agent: "composer",
          durationMs: Date.now() - started,
          request: { goal },
          response,
          fallbackReason: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  // Mock mode.
  await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
  const response = mockCompose(goal);
  return {
    goal,
    response,
    trace: { mode: "mock", agent: "composer", durationMs: Date.now() - started, request: { goal }, response },
  };
}
