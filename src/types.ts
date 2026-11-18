// ————— Shared data contract —————

/** A primitive as marketed on corti.ai (registry in src/data/capabilities.ts). */
export interface Primitive {
  id: string;
  name: string;
  /** One-line plain-language description, clinician-friendly. */
  what: string;
  /** Real corti.ai product page. */
  href: string;
}

/** One step in a capability's pipeline: a primitive + what it does HERE. */
export interface PipelineStep {
  primitiveId: string;
  /** What this primitive does in this capability, e.g. "Transcribes the arriving referral". */
  roleInPipeline: string;
  /** What the clinician gets out of it, e.g. "The referral text is searchable, not a PDF". */
  clinicianOutcome: string;
}

export interface ConnectorRef {
  id: string;
  name: string;
  /** What flows through it in this capability. */
  roleInPipeline: string;
}

export interface TrustRef {
  id: string;
  name: string;
  /** Why the clinician can trust this in one line. */
  roleInPipeline: string;
}

/** Notion "Category" — primary user group the capability serves. */
export type CapabilityCategory = "Clinician-facing" | "Operations" | "Patient-facing";

/**
 * Commercial path for a capability.
 * - product: a Corti product that is available today → CTA goes to the product.
 * - custom:  explained, broken down into primitives → CTA goes to the
 *            Build with us (built together with Corti, tailored to the customer).
 */
export type Track = "product" | "custom";

/**
 * What the capability does with information — single value, used to group
 * the catalogue. Maps onto the design team's import / transform split via
 * JOBS[job].flow (document/intake = import; write/check/understand =
 * transform; automate = act, the case the binary split misses).
 */
export type Job = "document" | "intake" | "write" | "check" | "understand" | "automate";
export type Flow = "import" | "transform" | "act";

/** Where the capability's information comes from — multi-value facet for
 *  filtering and for "similar to what you've looked at" recommendations. */
export type InfoSource =
  | "conversation" // live consultation audio
  | "voice" // the clinician dictating
  | "record" // the EHR / chart
  | "documents" // incoming PDFs, scans, faxes, letters
  | "messages" // email, voicemail, portal messages, calls
  | "patient" // the patient directly (app, SMS, phone)
  | "rules" // guidelines, policies, requirement sets
  | "schedule"; // calendar and booking history

export interface Product {
  id: string;
  /** Short product name as used in sales conversations, e.g. "Scribe". */
  name: string;
  /** One line: what you get today. */
  pitch: string;
  href: string;
  cta: string;
}

/** THE drop-in unit: one capability composed from primitives. */
export interface Capability {
  id: string;
  name: string;
  category: CapabilityCategory;
  track: Track;
  /** Set when track === "product". */
  productId?: string;
  job: Job;
  inputs: InfoSource[];
  /** ≤7-word tagline for the library overview card. */
  short: string;
  /** Clinical outcome, clinician-first. e.g. "Every referral is sorted by urgency before it reaches your desk." */
  outcome: string;
  /** Notion "How it works" — the workflow walkthrough, verbatim. */
  howItWorks: string;
  /** When to use it, in clinician terms — the agent matches goals against this. */
  whenToUse: string;
  /** Keywords for the offline mock matcher. */
  keywords: string[];
  pipeline: PipelineStep[];
  connectors: ConnectorRef[];
  trust: TrustRef[];
}

// ————— Agent response (what the composer agent returns) —————

/** Small, ID-bearing — the frontend highlights the match in the library. */
export interface ComposerResponse {
  /** Must match a Capability.id exactly. */
  capabilityId: string;
  /** The goal restated in clinician language, one sentence. */
  goalRestated: string;
  /** 1–2 sentences: why this capability answers the goal. */
  rationale: string;
  /** ≤8-word headline. */
  clinicianFraming: string;
  /** 0–1. */
  confidence: number;
  /** Runner-up capability id → "Not what you meant?" */
  alternativeId?: string;
  /** Optional per-node "why for YOUR goal", keyed by primitive/connector/trust id. */
  nodeInsights?: Record<string, string>;
}

// ————— Transparency (EG-demo pattern) —————

export type AgentMode = "real" | "mock";

export interface AgentTrace {
  mode: AgentMode;
  agent: string;
  durationMs: number;
  request: unknown;
  response: unknown;
  fallbackReason?: string;
}

/** One compose run: goal, the agent's response, and the trace. */
export interface ComposeResult {
  goal: string;
  response: ComposerResponse;
  trace: AgentTrace;
}
