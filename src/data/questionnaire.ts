import type { Capability, Job } from "../types";
import { CAPABILITIES, getCapability } from "./capabilities";

// ————————————————————————————————————————————————
// "Match to your priorities" questionnaire.
//
// Visitors (mostly clinicians, but also practice teams, health-system leaders
// and health-tech product teams) rarely arrive with a capability in mind, but
// recognise their own work at once. Every question is a set of statements to
// react to; every answer adds points to capabilities. Deterministic, runs in
// the browser, no LLM: the same answers always give the same result.
//
// Role-aware: step 1 picks a role; later steps only show options whose
// `roles` include it (no `roles` = everyone) and use the audience's wording.
//
// Linked to the capability list: on load, the console warns about ids in
// `boosts` that don't exist, and about capabilities no answer can reach, so
// new Notion rows can't silently fall out of the questionnaire.
//
// Tuning: `boosts` (capability id → points), `jobBoost` (points for every
// capability in a group), `weight` per question, `focus` (groups that lead
// the results for an objective).
// ————————————————————————————————————————————————

export type Audience = "clinical" | "operations" | "leadership" | "builder";

const CLINICAL = ["gp", "hospital", "surgeon", "specialist", "nurse"];
export const ROLE_AUDIENCE: Record<string, Audience> = {
  gp: "clinical",
  hospital: "clinical",
  surgeon: "clinical",
  specialist: "clinical",
  nurse: "clinical",
  practice: "operations",
  leader: "leadership",
  builder: "builder",
};

export interface Option {
  id: string;
  label: string;
  hint?: string;
  /** Role ids that see this option; omit for everyone. */
  roles?: string[];
  boosts?: Record<string, number>;
  jobBoost?: Partial<Record<Job, number>>;
  /** Objective only: groups that lead the results. */
  focus?: Job[];
}

export interface Question {
  id: string;
  /** Label under the progress bar. */
  short: string;
  title: string;
  subtitle: string;
  /** Audience-specific wording; falls back to title/subtitle. */
  copy?: Partial<Record<Audience, { title: string; subtitle: string }>>;
  multi: boolean;
  /** Multi-select only: max picks (keeps answers meaningful). */
  max?: number;
  /** Multiplier for this question's points. Specific situations say the most
   *  about what someone needs; the broad objective is mostly a tiebreaker. */
  weight: number;
  options: Option[];
}

export const QUESTIONS: Question[] = [
  {
    id: "role",
    short: "Role",
    title: "Which best describes your role?",
    subtitle: "We use this to match capabilities to your work.",
    multi: false,
    weight: 1,
    options: [
      { id: "gp", label: "General practitioner", boosts: { "patient-intake": 1, "reply-drafting": 1, "form-autofill": 1, "results-review": 1, "ambient-scribe": 1, "consultation-pointers": 0.5 } },
      { id: "hospital", label: "Hospital physician", boosts: { "shift-handover": 1, "document-generation": 1.5, "medication-reconciliation": 1, "patient-at-a-glance": 1, "documentation-nudges": 0.5 } },
      {
        id: "surgeon",
        label: "Surgeon",
        boosts: { "anatomy-overview": 2, "mdt-prep": 1, "medical-dictation": 1.5, "dictation-ambient-note": 1, "voice-commands": 0.5, "self-learning-vocabulary": 0.5, "insurance-letters": 0.5 },
      },
      {
        id: "specialist",
        label: "Specialist physician",
        hint: "Outpatient or ambulatory care",
        boosts: { "referral-intake": 1.5, "results-review": 1, "ambient-scribe": 1, "document-generation": 1, "dictation-ambient-note": 0.5, "consultation-pointers": 0.5 },
      },
      { id: "nurse", label: "Nurse", boosts: { "shift-handover": 2, "patient-intake": 1, "health-monitoring": 1, "after-visit-summary": 1 } },
      {
        id: "practice",
        label: "Practice or clinic management",
        hint: "Operations, front office, billing",
        boosts: { "phone-assistant": 2, "inbox-assistant": 2, "scheduling-assistant": 1.5, routines: 1, "document-import": 1, "billing-assistant": 1, "denial-management": 1, "task-extraction": 0.5 },
      },
      {
        id: "leader",
        label: "Health system or IT leadership",
        hint: "CMIO, CIO, digital or innovation lead",
        boosts: { "ambient-scribe": 1.5, "health-monitoring": 1, routines: 1, "billing-assistant": 1, "regulatory-check": 1, "patient-at-a-glance": 1, "structured-chart-data": 0.5 },
      },
      {
        id: "builder",
        label: "Health-tech company or product team",
        hint: "Building or extending a product",
        boosts: { "ambient-scribe": 1.5, "medical-dictation": 1.5, "medical-knowledge-assistant": 1, "billing-assistant": 1, "chart-search": 0.5, "voice-commands": 0.5, "self-learning-vocabulary": 0.5 },
      },
    ],
  },
  {
    id: "time",
    short: "Time",
    title: "Where do you spend unnecessary time?",
    subtitle: "Select up to three tasks that take more time than they should.",
    copy: {
      operations: { title: "Where does your team spend unnecessary time?", subtitle: "Select up to three tasks that take more time than they should." },
      leadership: { title: "Where does your organisation lose the most time?", subtitle: "Select up to three areas that take more time than they should." },
      builder: { title: "Where do your users lose the most time?", subtitle: "Select up to three tasks your users would most like help with." },
    },
    multi: true,
    max: 3,
    weight: 1,
    options: [
      {
        id: "notes",
        label: "Clinical documentation during and after consultations",
        roles: [...CLINICAL, "leader", "builder"],
        boosts: {
          "ambient-scribe": 3,
          "medical-dictation": 1.5,
          "notes-own-style": 1.5,
          "dictation-ambient-note": 1,
          "virtual-visit-notes": 1,
          "documentation-check": 1,
          "structured-chart-data": 0.5,
          "self-learning-vocabulary": 0.5,
          "voice-commands": 0.5,
        },
      },
      {
        id: "letters",
        label: "Letters, forms and referrals",
        roles: ["gp", "hospital", "surgeon", "specialist", "practice", "leader", "builder"],
        boosts: { "document-generation": 3, "form-autofill": 2.5, "insurance-letters": 2, "after-visit-summary": 1 },
      },
      {
        id: "prep",
        label: "Reviewing patient history before a consultation",
        roles: [...CLINICAL, "leader", "builder"],
        boosts: { "patient-at-a-glance": 3, "chart-search": 2, "results-review": 1.5, "consultation-pointers": 1, "anatomy-overview": 1, "mdt-prep": 1 },
      },
      {
        id: "messages",
        label: "Patient messages, calls and enquiries",
        roles: ["gp", "specialist", "nurse", "practice", "leader", "builder"],
        boosts: { "reply-drafting": 2.5, "inbox-assistant": 2.5, "phone-assistant": 2, "chat-with-record": 1 },
      },
      {
        id: "followup",
        label: "Follow-up tasks and open items",
        boosts: { "task-extraction": 3, "end-of-day": 2, routines: 1.5, "health-monitoring": 1 },
      },
      {
        id: "checking",
        label: "Coding, billing and compliance",
        roles: ["hospital", "surgeon", "specialist", "practice", "leader", "builder"],
        boosts: { "billing-assistant": 3, "regulatory-check": 2, "diagnosis-list-reconciliation": 2, "documentation-nudges": 1.5, "structured-chart-data": 1.5, "denial-management": 1 },
      },
      {
        id: "incoming",
        label: "Processing incoming documents and referrals",
        roles: ["gp", "surgeon", "specialist", "practice", "leader", "builder"],
        boosts: { "document-import": 3, "referral-intake": 3 },
      },
      {
        id: "lookup",
        label: "Looking up guidelines and drug information",
        roles: ["gp", "hospital", "specialist", "nurse", "leader", "builder"],
        boosts: { "medical-knowledge-assistant": 3, "chart-search": 1 },
      },
    ],
  },
  {
    id: "situations",
    short: "Situations",
    title: "Which of these situations apply?",
    subtitle: "Select all that apply, or continue if none do.",
    copy: {
      operations: { title: "Which of these situations apply to your team?", subtitle: "Select all that apply, or continue if none do." },
      leadership: { title: "Which of these situations apply in your organisation?", subtitle: "Select all that apply, or continue if none do." },
      builder: { title: "Which of these situations do your users face?", subtitle: "Select all that apply, or continue if none do." },
    },
    multi: true,
    weight: 1.6,
    options: [
      { id: "virtual", label: "Consultations by phone or video", roles: ["gp", "specialist", "nurse", "builder"], boosts: { "virtual-visit-notes": 3 } },
      { id: "language", label: "Patients who speak a different language", roles: [...CLINICAL, "leader", "builder"], boosts: { "consultation-interpreter": 3.5 } },
      { id: "ai", label: "Patients presenting AI-generated self-diagnoses", roles: ["gp", "hospital", "specialist", "builder"], boosts: { "patient-ai-review": 3.5 } },
      { id: "handover", label: "Shift handovers", roles: ["hospital", "surgeon", "nurse", "leader"], boosts: { "shift-handover": 3 } },
      { id: "trainees", label: "Supervising trainees or residents", roles: ["hospital", "surgeon", "specialist"], boosts: { "trainee-feedback": 3 } },
      { id: "surgery", label: "Patients with complex surgical histories", roles: ["surgeon", "hospital"], boosts: { "anatomy-overview": 3 } },
      { id: "mdt", label: "MDT or tumour board preparation", roles: ["surgeon", "specialist", "hospital"], boosts: { "mdt-prep": 3 } },
      { id: "meds", label: "Medication lists that differ between sources", roles: ["gp", "hospital", "specialist", "nurse"], boosts: { "medication-reconciliation": 3, "diagnosis-list-reconciliation": 1 } },
      {
        id: "returned",
        label: "Notes or claims returned for missing details",
        roles: ["hospital", "surgeon", "specialist", "practice", "leader"],
        boosts: { "documentation-nudges": 3, "regulatory-check": 2, "documentation-check": 1 },
      },
      { id: "late", label: "Administrative work after hours", roles: [...CLINICAL, "leader"], boosts: { "end-of-day": 3, "ambient-scribe": 1, "notes-own-style": 1, "task-extraction": 1 } },
      { id: "forget", label: "Patients not retaining visit instructions", roles: ["gp", "specialist", "nurse", "builder"], boosts: { "after-visit-summary": 3, "chat-with-record": 1.5 } },
      { id: "labs", label: "Large volumes of results to review", roles: ["gp", "hospital", "specialist", "nurse"], boosts: { "results-review": 3 } },
      { id: "phones", label: "High inbound call volumes", roles: ["gp", "practice", "leader", "builder"], boosts: { "phone-assistant": 3 } },
      { id: "inbox", label: "A growing email and voicemail backlog", roles: ["practice", "leader"], boosts: { "inbox-assistant": 3 } },
      { id: "noshows", label: "Scheduling gaps and no-shows", roles: ["practice", "leader"], boosts: { "scheduling-assistant": 3 } },
      { id: "recalls", label: "Patients overdue for reviews or recalls", roles: ["practice", "nurse", "leader"], boosts: { routines: 2.5, "health-monitoring": 2 } },
      { id: "referrals", label: "Referrals arriving incomplete", roles: ["practice", "specialist", "surgeon"], boosts: { "referral-intake": 3 } },
      { id: "denials", label: "Denied or disputed claims", roles: ["practice", "leader"], boosts: { "denial-management": 3 } },
    ],
  },
  {
    id: "goal",
    short: "Objective",
    title: "What is your main objective?",
    subtitle: "Select the one that matters most.",
    multi: false,
    weight: 0.5,
    options: [
      {
        id: "patient",
        label: "More time for patient care",
        hint: "Less time at the screen",
        roles: [...CLINICAL, "leader", "builder"],
        jobBoost: { document: 1.5, understand: 1 },
        boosts: { "notes-own-style": 0.5 },
        focus: ["document", "understand"],
      },
      {
        id: "home",
        label: "Less after-hours work",
        hint: "Documentation and admin done within the day",
        roles: [...CLINICAL, "leader"],
        jobBoost: { write: 1.5, automate: 1 },
        boosts: { "end-of-day": 1 },
        focus: ["write", "automate"],
      },
      {
        id: "safety",
        label: "Quality and patient safety",
        hint: "Gaps and errors caught early",
        jobBoost: { check: 2 },
        boosts: { "documentation-nudges": 1.5, "documentation-check": 1, "diagnosis-list-reconciliation": 1 },
        focus: ["check"],
      },
      {
        id: "team",
        label: "Lower administrative workload",
        hint: "Calls, inbox and paperwork",
        jobBoost: { automate: 2 },
        boosts: { "task-extraction": 1 },
        focus: ["automate", "intake"],
      },
      {
        id: "revenue",
        label: "Revenue and coding accuracy",
        hint: "Fewer under-coded, denied or returned claims",
        roles: ["practice", "leader", "hospital"],
        jobBoost: { check: 1 },
        boosts: { "billing-assistant": 2, "denial-management": 1.5, "documentation-nudges": 1, "diagnosis-list-reconciliation": 1 },
        focus: ["check"],
      },
      {
        id: "build",
        label: "Build or extend a product",
        hint: "Embed Corti capabilities in your solution",
        roles: ["builder"],
        jobBoost: { document: 0.5, intake: 0.5, understand: 0.5, check: 0.5 },
        focus: ["document", "understand"],
      },
    ],
  },
];

export type Answers = Record<string, string[]>;

export const roleOf = (answers: Answers): string | undefined => answers.role?.[0];

export function visibleOptions(q: Question, role: string | undefined): Option[] {
  return q.options.filter((o) => !o.roles || !role || o.roles.includes(role));
}

export function questionCopy(q: Question, role: string | undefined): { title: string; subtitle: string } {
  const audience = role ? ROLE_AUDIENCE[role] : undefined;
  return (audience && q.copy?.[audience]) || { title: q.title, subtitle: q.subtitle };
}

/** Groups the chosen objective puts first in the results. */
export function focusOf(answers: Answers): Job[] {
  const goal = QUESTIONS.find((q) => q.id === "goal")!;
  return goal.options.find((o) => o.id === answers.goal?.[0])?.focus ?? [];
}

export interface Match {
  capability: Capability;
  score: number;
}

/** Below this a match is filler (e.g. only the broad objective), not a recommendation. */
const MIN_SCORE = 1.5;

/**
 * Ranked matches for a set of answers. Answers the current role can't see
 * (e.g. left over after changing role) are ignored. Results: products first,
 * then build-with-us; inside each, the objective's focus groups first, then
 * by score.
 */
export function scoreAnswers(answers: Answers, limit = 8): Match[] {
  const role = roleOf(answers);
  const score = new Map<string, number>();
  const add = (capId: string, pts: number) => {
    if (!getCapability(capId)) return;
    score.set(capId, (score.get(capId) ?? 0) + pts);
  };
  for (const q of QUESTIONS) {
    const visible = visibleOptions(q, role);
    for (const optId of answers[q.id] ?? []) {
      const o = visible.find((x) => x.id === optId);
      if (!o) continue;
      for (const [capId, pts] of Object.entries(o.boosts ?? {})) add(capId, pts * q.weight);
      for (const [job, pts] of Object.entries(o.jobBoost ?? {}))
        for (const c of CAPABILITIES) if (c.job === job) add(c.id, (pts as number) * q.weight);
    }
  }
  const focus = focusOf(answers);
  return [...score.entries()]
    .filter(([, s]) => s >= MIN_SCORE)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, s]) => ({ capability: getCapability(id)!, score: s }))
    .sort(
      (a, b) =>
        Number(b.capability.track === "product") - Number(a.capability.track === "product") ||
        Number(focus.includes(b.capability.job)) - Number(focus.includes(a.capability.job)) ||
        b.score - a.score,
    );
}

// ——— Link check against the capability list (dev console) ———
(() => {
  const ids = new Set(CAPABILITIES.map((c) => c.id));
  const reached = new Set<string>();
  for (const q of QUESTIONS)
    for (const o of q.options) {
      for (const r of o.roles ?? []) if (!(r in ROLE_AUDIENCE)) console.warn(`[questionnaire] ${q.id}.${o.id}: unknown role "${r}".`);
      for (const id of Object.keys(o.boosts ?? {})) {
        if (!ids.has(id)) console.warn(`[questionnaire] ${q.id}.${o.id}: unknown capability "${id}".`);
        else reached.add(id);
      }
    }
  for (const c of CAPABILITIES) if (!reached.has(c.id)) console.warn(`[questionnaire] "${c.id}" can't be reached from any answer — add it to an option's boosts.`);
})();
