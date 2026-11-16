import type { Capability, Job } from "../types";
import { CAPABILITIES, getCapability } from "./capabilities";

// ————————————————————————————————————————————————
// Guided "find what fits you" questionnaire.
//
// Clinicians rarely arrive with a capability in mind, but they recognise
// their own day instantly. So every question is a set of statements to
// react to, and every answer nudges capability scores. No free text needed.
//
// Tuning: change `boosts` (capability id → points) or `jobBoost` (points
// for every capability with that job). scoreAnswers() is pure, so the same
// logic can run server-side or feed analytics later.
// ————————————————————————————————————————————————

export interface Option {
  id: string;
  label: string;
  hint?: string;
  /** Reason phrase shown in results; defaults from the question's reason(). */
  reason?: string;
  boosts?: Record<string, number>;
  jobBoost?: Partial<Record<Job, number>>;
}

export interface Question {
  id: string;
  title: string;
  subtitle: string;
  multi: boolean;
  /** Multi-select only: max picks (keeps answers meaningful). */
  max?: number;
  /** Multiplier for this question's points. Specific situations say the most
   *  about what someone needs; the broad goal is a tiebreaker. */
  weight: number;
  /** Turns an option label into a reason phrase, e.g. "your time goes to writing notes". */
  reason: (label: string) => string;
  options: Option[];
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export const QUESTIONS: Question[] = [
  {
    id: "role",
    title: "First, who are you?",
    subtitle: "So we can talk about your day, not someone else's.",
    multi: false,
    weight: 1,
    reason: (l) => `you work as ${l}`,
    options: [
      { id: "gp", reason: "you're a GP", label: "GP / family doctor", boosts: { "patient-intake": 1, "reply-drafting": 1, "form-autofill": 1, "results-review": 1, "ambient-scribe": 1 } },
      { id: "hospital", reason: "you're a hospital doctor", label: "Hospital doctor", boosts: { "shift-handover": 1, "document-generation": 1.5, "medication-reconciliation": 1, "patient-at-a-glance": 1 } },
      { id: "surgeon", reason: "you're a surgeon", label: "Surgeon", boosts: { "anatomy-overview": 2, "mdt-prep": 1, "medical-dictation": 1.5, "insurance-letters": 0.5 } },
      { id: "specialist", reason: "you work in an outpatient clinic", label: "Specialist in outpatient clinic", boosts: { "referral-intake": 1.5, "results-review": 1, "ambient-scribe": 1, "document-generation": 1 } },
      { id: "nurse", reason: "you're a nurse", label: "Nurse", boosts: { "shift-handover": 2, "patient-intake": 1, "health-monitoring": 1, "after-visit-summary": 1 } },
      {
        id: "practice",
        reason: "you run the front desk",
        label: "Practice manager / front desk",
        boosts: { "phone-assistant": 2, "inbox-assistant": 2, "scheduling-assistant": 1.5, routines: 1, "document-import": 1, "billing-assistant": 1, "denial-management": 1 },
      },
    ],
  },
  {
    id: "time",
    title: "Where does your day go?",
    subtitle: "Pick up to three that eat the most time.",
    multi: true,
    max: 3,
    weight: 1,
    reason: (l) => `your time goes to ${lowerFirst(l)}`,
    options: [
      {
        id: "notes",
        label: "Writing notes during or after visits",
        boosts: { "ambient-scribe": 3, "medical-dictation": 1.5, "virtual-visit-notes": 1, "documentation-check": 1, "self-learning-vocabulary": 0.5, "voice-commands": 0.5 },
      },
      {
        id: "letters",
        label: "Letters, forms and referrals",
        boosts: { "document-generation": 3, "form-autofill": 2.5, "insurance-letters": 2, "after-visit-summary": 1 },
      },
      {
        id: "prep",
        label: "Getting up to speed on a patient",
        boosts: { "patient-at-a-glance": 3, "chart-search": 2, "results-review": 1.5, "consultation-pointers": 1, "anatomy-overview": 1, "mdt-prep": 1 },
      },
      {
        id: "messages",
        label: "Messages, calls and patient questions",
        boosts: { "reply-drafting": 2.5, "inbox-assistant": 2.5, "phone-assistant": 2, "chat-with-record": 1 },
      },
      {
        id: "followup",
        label: "Follow-ups and things that slip through",
        boosts: { "task-extraction": 3, "end-of-day": 2, routines: 1.5, "health-monitoring": 1 },
      },
      {
        id: "checking",
        label: "Checking, coding and compliance",
        boosts: { "billing-assistant": 3, "regulatory-check": 2, "diagnosis-list-reconciliation": 2, "structured-chart-data": 1.5, "denial-management": 1 },
      },
      { id: "incoming", label: "Incoming documents, faxes and scans", boosts: { "document-import": 3, "referral-intake": 3 } },
      { id: "lookup", label: "Looking things up: guidelines, doses", boosts: { "medical-knowledge-assistant": 3, "chart-search": 1 } },
    ],
  },
  {
    id: "situations",
    title: "Does any of this sound familiar?",
    subtitle: "Tick everything that happens to you. Skip if none do.",
    multi: true,
    weight: 1.6,
    reason: (l) => `you said “${l}”`,
    options: [
      { id: "virtual", label: "I see patients by phone or video", boosts: { "virtual-visit-notes": 3 } },
      { id: "language", label: "Some patients don't speak my language", boosts: { "consultation-interpreter": 3.5 } },
      { id: "ai", label: "Patients arrive with ChatGPT's diagnosis", boosts: { "patient-ai-review": 3.5 } },
      { id: "handover", label: "I hand over patients at shift change", boosts: { "shift-handover": 3 } },
      { id: "trainees", label: "I supervise trainees or residents", boosts: { "trainee-feedback": 3 } },
      { id: "surgery", label: "My patients have had several operations", boosts: { "anatomy-overview": 3 } },
      { id: "mdt", label: "I prepare cases for MDT or tumour board", boosts: { "mdt-prep": 3 } },
      { id: "meds", label: "Medication lists never match between sources", boosts: { "medication-reconciliation": 3 } },
      { id: "late", label: "I stay late to finish admin", boosts: { "end-of-day": 3, "ambient-scribe": 1 } },
      { id: "forget", label: "Patients forget what we discussed", boosts: { "after-visit-summary": 3, "chat-with-record": 1.5 } },
      { id: "phones", label: "Our phone lines are always busy", boosts: { "phone-assistant": 3 } },
      { id: "labs", label: "Lab results pile up", boosts: { "results-review": 3 } },
    ],
  },
  {
    id: "goal",
    title: "What would make the biggest difference?",
    subtitle: "Pick the one that matters most to you.",
    multi: false,
    weight: 0.5,
    reason: (l) => `you want ${lowerFirst(l)}`,
    options: [
      { id: "patient", reason: "you want more time with patients", label: "More time with my patients", hint: "Less screen, more eye contact", jobBoost: { capture: 1.5, understand: 1 } },
      { id: "home", reason: "you want to go home on time", label: "Going home on time", hint: "Less admin after hours", jobBoost: { write: 1.5, automate: 1 }, boosts: { "end-of-day": 1 } },
      { id: "safety", reason: "you want fewer things missed", label: "Fewer things missed", hint: "Catch gaps and errors early", jobBoost: { check: 2 } },
      { id: "team", reason: "you want less admin for your team", label: "Less admin for my team", hint: "Calls, inbox and paperwork handled", jobBoost: { automate: 2 } },
    ],
  },
];

export type Answers = Record<string, string[]>;

export interface Match {
  capability: Capability;
  score: number;
  /** Reason phrases that contributed most, e.g. ["your time goes to writing notes during or after visits"]. */
  because: string[];
}

export function scoreAnswers(answers: Answers, limit = 6): Match[] {
  const score = new Map<string, number>();
  const why = new Map<string, { label: string; pts: number }[]>();
  const add = (capId: string, pts: number, label: string) => {
    if (!getCapability(capId)) return;
    score.set(capId, (score.get(capId) ?? 0) + pts);
    why.set(capId, [...(why.get(capId) ?? []), { label, pts }]);
  };
  for (const q of QUESTIONS) {
    for (const optId of answers[q.id] ?? []) {
      const o = q.options.find((x) => x.id === optId);
      if (!o) continue;
      const reasonText = o.reason ?? q.reason(o.label);
      for (const [capId, pts] of Object.entries(o.boosts ?? {})) add(capId, pts * q.weight, reasonText);
      for (const [job, pts] of Object.entries(o.jobBoost ?? {}))
        for (const c of CAPABILITIES) if (c.job === job) add(c.id, (pts as number) * q.weight, reasonText);
    }
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, s]) => ({
      capability: getCapability(id)!,
      score: s,
      because: [...new Set((why.get(id) ?? []).sort((a, b) => b.pts - a.pts).map((w) => w.label))].slice(0, 2),
    }));
}
