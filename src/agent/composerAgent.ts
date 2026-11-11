import { CAPABILITIES } from "../data/capabilities";
import type { Capability } from "../types";

// The agent picks a capability and explains the choice; the frontend builds
// the tree from src/data/capabilities.ts. This keeps URLs and tree copy
// grounded in the data file (never hallucinated) and makes the schema stable
// as the taxonomy grows. Bump the suffix if COMPOSER_SCHEMA ever changes —
// connectors are set only at agent creation.

export const COMPOSER_AGENT_NAME = "capabilities-demo-composer-v1";

export const COMPOSER_AGENT_DESCRIPTION =
  "Maps a clinician's stated goal to one capability in the Corti capability taxonomy.";

/** Compact taxonomy summary for the system prompt — generated, never hardcoded. */
export function toAgentTaxonomy(caps: Capability[] = CAPABILITIES): string {
  return caps
    .map((c) => {
      const nodeIds = [...c.pipeline.map((p) => p.primitiveId), ...c.connectors.map((x) => x.id), ...c.trust.map((x) => x.id)];
      return `- ${c.id} | ${c.name} | ${c.category} | does: ${c.outcome} | use when: ${c.whenToUse} | keywords: ${c.keywords.join(", ")} | node ids: ${nodeIds.join(", ")}`;
    })
    .join("\n");
}

export function composerSystemPrompt(): string {
  return [
    "You are the Capabilities Composer for Corti, a healthcare AI company.",
    "A clinician or healthcare worker tells you what they want to get done in their clinic.",
    "Your job: pick the ONE capability from the taxonomy that best answers their goal, and explain the choice in their language.",
    "",
    "RULES:",
    "- Speak to clinicians, never to developers. No API names, no integration-speak, no jargon.",
    "- capabilityId MUST be an exact id from the taxonomy. Never invent capabilities, primitives or URLs.",
    "- goalRestated: their goal in one plain sentence.",
    "- clinicianFraming: a headline of at most 8 words, clinician language, no colon.",
    "- rationale: 1–2 sentences on why this capability answers their goal.",
    "- confidence: 0 to 1.",
    "- alternativeId: the runner-up taxonomy id, only if genuinely plausible for their goal, else omit.",
    "- nodeInsights: only when the goal is specific enough that a node deserves a goal-specific note. Keys MUST be from the chosen capability's node ids. Omit entirely otherwise.",
    "- All text in English.",
    "",
    "TAXONOMY:",
    toAgentTaxonomy(),
  ].join("\n");
}

/** Response schema — 6 scalars, stable as the taxonomy grows. */
export const COMPOSER_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    capabilityId: { type: "string", description: "Exact id of the chosen capability from the taxonomy" },
    goalRestated: { type: "string", description: "The clinician's goal restated in one plain sentence" },
    rationale: { type: "string", description: "1-2 sentences why this capability answers the goal" },
    clinicianFraming: { type: "string", description: "Headline for the tree, at most 8 words, clinician language" },
    confidence: { type: "number", description: "0 to 1" },
    alternativeId: { type: "string", description: "Runner-up capability id, omit if none" },
    nodeInsights: {
      type: "object",
      description: "Optional per-node goal-specific notes keyed by node id from the chosen capability",
      additionalProperties: { type: "string" },
    },
  },
  required: ["capabilityId", "goalRestated", "rationale", "clinicianFraming", "confidence"],
};
