import type { Capability, Job } from "../types";
import { CAPABILITIES, getCapability } from "./capabilities";

// ————————————————————————————————————————————————
// Guided recommendations questionnaire.
//
// Visitors (mostly clinicians, but also health-system leaders, health-tech
// teams and anyone exploring a build with Corti) rarely arrive with a
// capability in mind, but recognise their own work at once. So every
// question is a set of statements to react to, and every answer nudges
// capability scores. No free text needed.
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
    title: "Which best describes your role?",
    subtitle: "We use this to tailor the recommendations.",
    multi: false,
    weight: 1,
    reason: (l) => `your role is ${lowerFirst(l)}`,
    options: [
      { id: "gp", reason: "you are a general practitioner", label: "General practitioner", boosts: { "patient-intake": 1, "reply-drafting": 1, "form-autofill": 1, "results-review": 1, "ambient-scribe": 1 } },
      { id: "hospital", reason: "you are a hospital physician", label: "Hospital physician", boosts: { "shift-handover": 1, "document-generation": 1.5, "medication-reconciliation": 1, "patient-at-a-glance": 1 } },
      { id: "surgeon", reason: "you are a surgeon", label: "Surgeon", boosts: { "anatomy-overview": 2, "mdt-prep": 1, "medical-dictation": 1.5, "insurance-letters": 0.5 } },
      { id: "specialist", reason: "you are a specialist physician", label: "Specialist physician", hint: "Outpatient or ambulatory care", boosts: { "referral-intake": 1.5, "results-review": 1, "ambient-scribe": 1, "document-generation": 1 } },
      { id: "nurse", reason: "you work in nursing", label: "Nurse", boosts: { "shift-handover": 2, "patient-intake": 1, "health-monitoring": 1, "after-visit-summary": 1 } },
      {
        id: "practice",
        reason: "you work in practice or clinic management",
        label: "Practice or clinic management",
        hint: "Operations, front office, billing",
        boosts: { "phone-assistant": 2, "inbox-assistant": 2, "scheduling-assistant": 1.5, routines: 1, "document-import": 1, "billing-assistant": 1, "denial-management": 1 },
      },
      {
        id: "leader",
        reason: "you lead a health system or its IT",
        label: "Health system or IT leadership",
        hint: "CMIO, CIO, digital or innovation lead",
        boosts: { "ambient-scribe": 1.5, "health-monitoring": 1, routines: 1, "billing-assistant": 1, "regulatory-check": 1, "patient-at-a-glance": 1 },
      },
      {
        id: "builder",
        reason: "you build healthcare software",
        label: "Health-tech company or product team",
        hint: "Building or extending a product",
        boosts: { "ambient-scribe": 1.5, "medical-dictation": 1.5, "medical-knowledge-assistant": 1, "billing-assistant": 1, "chart-search": 0.5 },
      },
    ],
  },
  {
    id: "time",
    title: "Where does the most time go?",
    subtitle: "Select up to three, for yourself or for the clinicians you support.",
    multi: true,
    max: 3,
    weight: 1,
    reason: (l) => `most time goes to ${lowerFirst(l)}`,
    options: [
      {
        id: "notes",
        label: "Clinical documentation during and after consultations",
        boosts: { "ambient-scribe": 3, "medical-dictation": 1.5, "virtual-visit-notes": 1, "documentation-check": 1, "self-learning-vocabulary": 0.5, "voice-commands": 0.5 },
      },
      {
        id: "letters",
        label: "Letters, forms and referrals",
        boosts: { "document-generation": 3, "form-autofill": 2.5, "insurance-letters": 2, "after-visit-summary": 1 },
      },
      {
        id: "prep",
        label: "Reviewing patient history before a consultation",
        boosts: { "patient-at-a-glance": 3, "chart-search": 2, "results-review": 1.5, "consultation-pointers": 1, "anatomy-overview": 1, "mdt-prep": 1 },
      },
      {
        id: "messages",
        label: "Patient messages, calls and enquiries",
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
        boosts: { "billing-assistant": 3, "regulatory-check": 2, "diagnosis-list-reconciliation": 2, "structured-chart-data": 1.5, "denial-management": 1 },
      },
      { id: "incoming", label: "Processing incoming documents and referrals", boosts: { "document-import": 3, "referral-intake": 3 } },
      { id: "lookup", label: "Looking up guidelines and drug information", boosts: { "medical-knowledge-assistant": 3, "chart-search": 1 } },
    ],
  },
  {
    id: "situations",
    title: "Which of these situations apply?",
    subtitle: "Select all that apply, or continue if none do.",
    multi: true,
    weight: 1.6,
    reason: (l) => `you mentioned ${lowerFirst(l)}`,
    options: [
      { id: "virtual", label: "Consultations by phone or video", boosts: { "virtual-visit-notes": 3 } },
      { id: "language", label: "Patients who speak a different language", boosts: { "consultation-interpreter": 3.5 } },
      { id: "ai", label: "Patients presenting AI-generated self-diagnoses", boosts: { "patient-ai-review": 3.5 } },
      { id: "handover", label: "Shift handovers", boosts: { "shift-handover": 3 } },
      { id: "trainees", label: "Supervising trainees or residents", boosts: { "trainee-feedback": 3 } },
      { id: "surgery", label: "Patients with complex surgical histories", boosts: { "anatomy-overview": 3 } },
      { id: "mdt", label: "MDT or tumour board preparation", boosts: { "mdt-prep": 3 } },
      { id: "meds", label: "Medication lists that differ between sources", boosts: { "medication-reconciliation": 3 } },
      { id: "late", label: "Administrative work after hours", boosts: { "end-of-day": 3, "ambient-scribe": 1 } },
      { id: "forget", label: "Patients not retaining visit instructions", boosts: { "after-visit-summary": 3, "chat-with-record": 1.5 } },
      { id: "phones", label: "High inbound call volumes", boosts: { "phone-assistant": 3 } },
      { id: "labs", label: "Large volumes of results to review", boosts: { "results-review": 3 } },
    ],
  },
  {
    id: "goal",
    title: "What is your main objective?",
    subtitle: "Select the one that matters most.",
    multi: false,
    weight: 0.5,
    reason: (l) => `your objective is to ${lowerFirst(l)}`,
    options: [
      { id: "patient", reason: "your objective is more time for patient care", label: "More time for patient care", hint: "Less time at the screen", jobBoost: { capture: 1.5, understand: 1 } },
      { id: "home", reason: "your objective is less after-hours work", label: "Less after-hours work", hint: "Documentation and admin done within the day", jobBoost: { write: 1.5, automate: 1 }, boosts: { "end-of-day": 1 } },
      { id: "safety", reason: "your objective is quality and patient safety", label: "Quality and patient safety", hint: "Gaps and errors caught early", jobBoost: { check: 2 } },
      { id: "team", reason: "your objective is a lower administrative workload", label: "Lower administrative workload", hint: "Calls, inbox and paperwork", jobBoost: { automate: 2 } },
      { id: "build", reason: "you want to build or extend a product", label: "Build or extend a product", hint: "Embed Corti capabilities in your solution", jobBoost: { capture: 0.5, understand: 0.5, check: 0.5 } },
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
