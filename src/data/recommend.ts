import type { Capability, CapabilityCategory } from "../types";
import { CAPABILITIES, getCapability } from "./capabilities";

// ————————————————————————————————————————————————
// Which capability to show next, from what the visitor has already looked at.
//
// Pure and deterministic, so the design team can call it with any history
// source (this demo: localStorage; production: CRM / product analytics).
// Similarity is computed only from the taxonomy facets, never from copy:
//   shared primitives  — "built from the same blocks" (the boil-down story),
//                        rare primitives weighted higher (IDF)
//   same job           — "does the same kind of thing with information"
//   shared inputs      — "works from the same information"
//   same category      — "for the same user group"
// Weights are deliberately simple; tune them here.
// ————————————————————————————————————————————————

export const WEIGHTS = { primitives: 2, job: 1.5, inputs: 1, category: 1, role: 1.5, product: 0.5 };

export interface RecommendOptions {
  /** Visitor's user group if known (e.g. picked in a role filter). */
  role?: CapabilityCategory | null;
  limit?: number;
  /** Restrict to a track, e.g. "custom" to only suggest build-with-us capabilities. */
  track?: Capability["track"];
}

export interface Recommendation {
  capability: Capability;
  score: number;
  /** The history item that contributed most → "Because you looked at X". */
  because?: Capability;
  /** Short human reason, e.g. "Same building blocks". */
  reason: string;
}

// Rare primitives say more than common ones: sharing Medical Coding is a
// real signal, sharing Text Generation (in almost everything) is not.
const PRIM_IDF: Record<string, number> = (() => {
  const n = CAPABILITIES.length;
  const df: Record<string, number> = {};
  for (const c of CAPABILITIES) for (const p of new Set(c.pipeline.map((s) => s.primitiveId))) df[p] = (df[p] ?? 0) + 1;
  return Object.fromEntries(Object.entries(df).map(([p, d]) => [p, Math.log(n / d)]));
})();

const weightedJaccard = (a: string[], b: string[], w: Record<string, number>) => {
  const A = new Set(a);
  const B = new Set(b);
  const sum = (xs: string[]) => xs.reduce((s, x) => s + (w[x] ?? 0), 0);
  return sum([...A].filter((x) => B.has(x))) / (sum([...new Set([...A, ...B])]) || 1);
};

const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / (new Set([...A, ...B]).size || 1);
};

export function similarity(a: Capability, b: Capability): { score: number; reason: string } {
  const parts = {
    primitives:
      WEIGHTS.primitives * weightedJaccard(a.pipeline.map((p) => p.primitiveId), b.pipeline.map((p) => p.primitiveId), PRIM_IDF),
    job: a.job === b.job ? WEIGHTS.job : 0,
    inputs: WEIGHTS.inputs * jaccard(a.inputs, b.inputs),
    category: a.category === b.category ? WEIGHTS.category : 0,
  };
  const top = (Object.entries(parts) as [keyof typeof parts, number][]).sort((x, y) => y[1] - x[1])[0][0];
  const reason = {
    primitives: "Same building blocks",
    job: "Same kind of job",
    inputs: "Works from the same information",
    category: "Same user group",
  }[top];
  return { score: parts.primitives + parts.job + parts.inputs + parts.category, reason };
}

/**
 * Rank capabilities for a visitor.
 * - No history: products first (the fastest route to value), then by role.
 * - With history: similarity to recent views, recent ones weighted higher.
 * Already-seen capabilities are excluded.
 */
export function recommend(history: string[], opts: RecommendOptions = {}): Recommendation[] {
  const { role = null, limit = 4, track } = opts;
  const seen = history.map(getCapability).filter((c): c is Capability => !!c);
  const seenIds = new Set(seen.map((c) => c.id));

  const ranked = CAPABILITIES.filter((c) => !seenIds.has(c.id) && (!track || c.track === track)).map((cap) => {
    let score = 0;
    let because: Capability | undefined;
    let reason = cap.track === "product" ? "Available today" : "Popular starting point";
    let best = -1;
    // Most recent first; each step back counts a little less.
    seen
      .slice()
      .reverse()
      .forEach((h, i) => {
        const s = similarity(cap, h);
        const w = s.score * Math.pow(0.8, i);
        score += w;
        if (w > best) {
          best = w;
          because = h;
          reason = s.reason;
        }
      });
    if (role && cap.category === role) score += WEIGHTS.role;
    if (!seen.length && cap.track === "product") score += WEIGHTS.product * 4;
    return { capability: cap, score, because, reason };
  });

  return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
}
