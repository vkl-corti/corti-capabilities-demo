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
  options: Option[];
}


export const QUESTIONS: Question[] = [
  {
    id: "role",
    title: "Which best describes your role?",
    subtitle: "We use this to tailor the recommendations.",
    multi: false,
    weight: 1,
    options: [
      { id: "gp", label: "General practitioner", boosts: { "patient-intake": 1, "reply-drafting": 1, "form-autofill": 1, "results-review": 1, "ambient-scribe": 1 } },
      { id: "hospital", label: "Hospital physician", boosts: { "shift-handover": 1, "document-generation": 1.5, "medication-reconciliation": 1, "patient-at-a-glance": 1 } },
      { id: "surgeon", label: "Surgeon", boosts: { "anatomy-overview": 2, "mdt-prep": 1, "medical-dictation": 1.5, "insurance-letters": 0.5 } },
      { id: "specialist", label: "Specialist physician", hint: "Outpatient or ambulatory care", boosts: { "referral-intake": 1.5, "results-review": 1, "ambient-scribe": 1, "document-generation": 1 } },
      { id: "nurse", label: "Nurse", boosts: { "shift-handover": 2, "patient-intake": 1, "health-monitoring": 1, "after-visit-summary": 1 } },
      {
        id: "practice",
       
        label: "Practice or clinic management",
        hint: "Operations, front office, billing",
        boosts: { "phone-assistant": 2, "inbox-assistant": 2, "scheduling-assistant": 1.5, routines: 1, "document-import": 1, "billing-assistant": 1, "denial-management": 1 },
      },
      {
        id: "leader",
       
        label: "Health system or IT leadership",
        hint: "CMIO, CIO, digital or innovation lead",
        boosts: { "ambient-scribe": 1.5, "health-monitoring": 1, routines: 1, "billing-assistant": 1, "regulatory-check": 1, "patient-at-a-glance": 1 },
      },
      {
        id: "builder",
       
        label: "Health-tech company or product team",
        hint: "Building or extending a product",
        boosts: { "ambient-scribe": 1.5, "medical-dictation": 1.5, "medical-knowledge-assistant": 1, "billing-assistant": 1, "chart-search": 0.5 },
      },
    ],
  },
  {
    id: "time",
    title: "Where do you spend unnecessary time?",
    subtitle: "Select up to three tasks that take more time than they should, for you or for the clinicians you support.",
    multi: true,
    max: 3,
    weight: 1,
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
    options: [
      { id: "patient", label: "More time for patient care", hint: "Less time at the screen", jobBoost: { capture: 1.5, understand: 1 } },
      { id: "home", label: "Less after-hours work", hint: "Documentation and admin done within the day", jobBoost: { write: 1.5, automate: 1 }, boosts: { "end-of-day": 1 } },
      { id: "safety", label: "Quality and patient safety", hint: "Gaps and errors caught early", jobBoost: { check: 2 } },
      { id: "team", label: "Lower administrative workload", hint: "Calls, inbox and paperwork", jobBoost: { automate: 2 } },
      { id: "build", label: "Build or extend a product", hint: "Embed Corti capabilities in your solution", jobBoost: { capture: 0.5, understand: 0.5, check: 0.5 } },
    ],
  },
];

export type Answers = Record<string, string[]>;

export interface Match {
  capability: Capability;
  score: number;
}

/** Below this a match is filler (e.g. only the broad objective), not a recommendation. */
const MIN_SCORE = 1.5;

export function scoreAnswers(answers: Answers, limit = 8): Match[] {
  const score = new Map<string, number>();
  const add = (capId: string, pts: number) => {
    if (!getCapability(capId)) return;
    score.set(capId, (score.get(capId) ?? 0) + pts);
  };
  for (const q of QUESTIONS) {
    for (const optId of answers[q.id] ?? []) {
      const o = q.options.find((x) => x.id === optId);
      if (!o) continue;
      for (const [capId, pts] of Object.entries(o.boosts ?? {})) add(capId, pts * q.weight);
      for (const [job, pts] of Object.entries(o.jobBoost ?? {}))
        for (const c of CAPABILITIES) if (c.job === job) add(c.id, (pts as number) * q.weight);
    }
  }
  return [...score.entries()]
    .filter(([, s]) => s >= MIN_SCORE)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, s]) => ({ capability: getCapability(id)!, score: s }));
}
