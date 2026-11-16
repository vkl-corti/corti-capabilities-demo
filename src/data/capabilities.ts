import type { Capability, CapabilityCategory, ConnectorRef, InfoSource, Job, Flow, Primitive, TrustRef } from "../types";
import snapshot from "./notion-snapshot.json";
import { PRODUCT_ORDER } from "./products";

// ————————————————————————————————————————————————
// THE TAXONOMY
//
// Two layers:
//   1. notion-snapshot.json: verbatim copy of the public-safe fields of
//      Corti's capability database (name, category, one-liner, clinical
//      problem, how it works, primitives used, backlog). Internal notes and
//      competitor columns are NOT copied, because the demo is public.
//   2. EDITORIAL below: what the demo adds per capability (tagline,
//      job, inputs, pipeline wording, connectors, review rule, product link).
//
// Re-sync = replace the snapshot. New Notion rows without an EDITORIAL entry
// are skipped with a console warning, and a mismatch between Notion's
// "Primitives used" and the pipeline is reported the same way, so drift
// shows up in the dev console instead of silently in the UI.
//
// Not shown: rows ticked "Backlog" in Notion, and "AI review trail", which
// Notion itself suggests is a platform trust message rather than a
// capability. It is a trust-layer item on every capability (REVIEW_TRAIL).
// ————————————————————————————————————————————————

export const SNAPSHOT_DATE: string = snapshot.syncedAt;

/** The five build primitives. Notion also lists "Embedded Assistant", which is
 *  a UI surface rather than a primitive, so it is ignored.
 *  Order = top-to-bottom order in the primitives map. */
export const PRIMITIVES: Record<string, Primitive> = {
  "speech-to-text": {
    id: "speech-to-text",
    name: "Speech to Text",
    what: "Clinical transcription — accurate medical speech in ~50 languages.",
    href: "https://corti.ai/speech-to-text",
  },
  "text-generation": {
    id: "text-generation",
    name: "Text Generation",
    what: "Notes, letters and summaries grounded in the source.",
    href: "https://corti.ai/text-generation",
  },
  "agentic-framework": {
    id: "agentic-framework",
    name: "Agentic Framework",
    what: "Governed clinical agents that plan, act, check and correct.",
    href: "https://corti.ai/agentic-framework",
  },
  "corti-models": {
    id: "corti-models",
    name: "Corti Models",
    what: "Specialised clinical models for reasoning, search and retrieval.",
    href: "https://corti.ai/models",
  },
  "medical-coding": {
    id: "medical-coding",
    name: "Medical Coding",
    what: "ICD-10, CPT & DRG codes with source evidence and reasoning.",
    href: "https://corti.ai/medical-coding",
  },
};

const NOTION_PRIMITIVE: Record<string, string> = {
  "Speech-to-text": "speech-to-text",
  "Text generation": "text-generation",
  "Agentic framework": "agentic-framework",
  "Corti Models": "corti-models",
  "Medical coding": "medical-coding",
};

/** Jobs in catalogue order. `flow` is the design team's import/transform split. */
export const JOBS: Record<Job, { label: string; verb: string; flow: Flow }> = {
  capture: { label: "Capture", verb: "Gets information into the record", flow: "import" },
  write: { label: "Write", verb: "Turns the record into documents and messages", flow: "transform" },
  check: { label: "Check", verb: "Compares against a reference and flags gaps", flow: "transform" },
  understand: { label: "Understand", verb: "Summarises, searches and answers", flow: "transform" },
  automate: { label: "Automate", verb: "Runs the follow-up work", flow: "act" },
};
export const JOB_ORDER: Job[] = ["capture", "write", "check", "understand", "automate"];

export const INFO_SOURCES: Record<InfoSource, string> = {
  conversation: "Consultation",
  voice: "Clinician's voice",
  record: "Patient record",
  documents: "Incoming documents",
  messages: "Messages & calls",
  patient: "The patient",
  rules: "Guidelines & rules",
  schedule: "Calendar",
};

export const CATEGORIES: CapabilityCategory[] = ["Clinician-facing", "Operations", "Patient-facing"];

// ——— Connectors ———
const C = {
  ehr: { id: "connector-ehr", name: "EHR", roleInPipeline: "Reads the record and writes reviewed results back" },
  guidelines: { id: "connector-guidelines", name: "Guidelines & drug databases", roleInPipeline: "The sources answers are cited from" },
  rules: { id: "connector-rules", name: "Requirement sets", roleInPipeline: "The rules it checks against" },
  billing: { id: "connector-billing", name: "Billing / claims system", roleInPipeline: "Claims, codes and payer correspondence" },
  telephony: { id: "connector-telephony", name: "Telephony", roleInPipeline: "Inbound and outbound calls" },
  video: { id: "connector-video", name: "Phone / video tool", roleInPipeline: "The virtual consultation" },
  scheduling: { id: "connector-scheduling", name: "Scheduling system", roleInPipeline: "Calendar, bookings and history" },
  patientApp: { id: "connector-patient-app", name: "Patient app / portal / SMS", roleInPipeline: "Where the patient answers or reads" },
  inbox: { id: "connector-inbox", name: "Email & voicemail", roleInPipeline: "The practice inbox" },
  docs: { id: "connector-docs", name: "Fax / scan / PDF", roleInPipeline: "Incoming documents" },
  host: { id: "connector-host", name: "Host application", roleInPipeline: "The fields it types into" },
} satisfies Record<string, ConnectorRef>;
type ConnKey = keyof typeof C;

// ——— Shared trust layer ———
const DEPLOY: TrustRef = { id: "trust-deploy", name: "EU / US cloud or on-prem", roleInPipeline: "Runs in EU or US cloud, or the customer's own environment" };
const TRACES: TrustRef = { id: "trust-traces", name: "Traces & evals", roleInPipeline: "Every run traced, verified and evaluated against gold sets" };
const REVIEW_TRAIL: TrustRef = {
  id: "trust-review-trail",
  name: "AI review trail",
  roleInPipeline: "Logs the AI draft, the edits, the sources and who signed, for every AI-assisted entry",
};

// ——— Editorial layer, keyed by the exact Notion name ———
type Step = [primitiveId: string, roleInPipeline: string, clinicianOutcome: string];
interface Editorial {
  id: string;
  short: string;
  job: Job;
  inputs: InfoSource[];
  keywords: string[];
  steps: Step[];
  connectors: ConnKey[];
  /** Human-in-the-loop rule, from Notion "How it works". */
  review: string;
  productId?: string;
  /** Only when the Notion field is still a template placeholder. */
  problemOverride?: string;
}

const EDITORIAL: Record<string, Editorial> = {
  // ═══════════ Products ═══════════
  "Ambient scribe": {
    id: "ambient-scribe",
    productId: "scribe",
    short: "The note writes itself during the visit",
    job: "capture",
    inputs: ["conversation"],
    keywords: ["ambient", "scribe", "note", "notes", "documentation", "consultation", "typing", "transcript", "soap", "hands-free", "visit"],
    steps: [
      ["speech-to-text", "Listens with consent and transcribes live, speakers separated", "You keep your attention on the patient, not the screen"],
      ["text-generation", "Generates the note from the transcript in the specialty's template", "The note is drafted when the visit ends — no evening catch-up"],
    ],
    connectors: ["ehr"],
    review: "The clinician reviews and edits the note before it is signed. Nothing enters the record unreviewed.",
  },
  "Medical dictation": {
    id: "medical-dictation",
    productId: "dictation",
    short: "Speak into any field, in real time",
    job: "capture",
    inputs: ["voice"],
    keywords: ["dictation", "dictate", "speech", "voice", "report", "reports", "radiology", "letter", "field", "typing"],
    steps: [["speech-to-text", "Transcribes in real time where the cursor is, with drug names, dosages and voice commands", "Reports, letters and forms written by voice, in any field"]],
    connectors: ["host", "ehr"],
    review: "The clinician sees and edits everything as it lands.",
  },
  "Billing Assistant": {
    id: "billing-assistant",
    productId: "coding",
    short: "Codes checked against the documentation",
    job: "check",
    inputs: ["record"],
    keywords: ["billing", "bill", "code", "coding", "coded", "icd", "cpt", "drg", "claim", "claims", "cdi", "revenue", "audit"],
    steps: [
      ["medical-coding", "Suggests diagnosis and procedure codes (and DRG) with the justifying passage", "Every code traceable to the sentence that supports it"],
      ["agentic-framework", "Re-checks final codes against the documentation before the claim goes out", "Under- and over-coding caught before submission, not in an audit"],
      ["text-generation", "Explains each mismatch in both directions for the coder", "Coders resolve flags instead of sampling charts by hand"],
    ],
    connectors: ["ehr", "billing"],
    review: "Coder or clinician resolves each flag; the claim is not submitted automatically.",
  },
  "Medical Knowledge Assistant": {
    id: "medical-knowledge-assistant",
    productId: "chat",
    short: "Sourced answers from guidelines & drug data",
    job: "understand",
    inputs: ["rules"],
    keywords: ["knowledge", "question", "answer", "guideline", "drug", "reference", "protocol", "lookup", "evidence", "ask", "chat"],
    steps: [
      ["agentic-framework", "Searches the connected guidelines, drug databases and local protocols", "One question instead of five systems and a stack of PDFs"],
      ["corti-models", "Answers with the key point plus the exact source passage", "Every claim shows where it comes from"],
    ],
    connectors: ["guidelines"],
    review: "Answers only from connected sources and shows where each claim comes from; it does not substitute its own medical opinion.",
  },

  // ═══════════ Clinician-facing ═══════════
  "Call and video visit notes": {
    id: "virtual-visit-notes",
    short: "Phone and video visits documented too",
    job: "capture",
    inputs: ["conversation"],
    keywords: ["video", "phone", "telehealth", "virtual", "remote", "call", "teleconsultation", "follow-up message"],
    steps: [
      ["speech-to-text", "Joins the call with consent and transcribes, speakers separated", "Virtual visits get the same note as in-person ones"],
      ["text-generation", "Writes the note in the specialty template and drafts the patient follow-up", "Note and follow-up text done in one go"],
    ],
    connectors: ["video", "ehr"],
    review: "The clinician reviews and edits before anything is saved or sent.",
  },
  "Consultation interpreter": {
    id: "consultation-interpreter",
    short: "Live translation, note in your language",
    job: "capture",
    inputs: ["conversation"],
    keywords: ["translate", "translation", "interpreter", "language", "languages", "foreign", "non-native", "multilingual"],
    steps: [
      ["speech-to-text", "Transcribes both speakers in their own language, near real time", "Each person reads the conversation in their language"],
      ["text-generation", "Translates and writes the note in the clinician's language, keeping the original", "History and consent no longer lost to a language barrier"],
    ],
    connectors: ["ehr"],
    review: "Medication names and doses are shown in both languages to confirm. Supports a qualified interpreter; does not replace one where required.",
  },
  "Self-learning vocabulary": {
    id: "self-learning-vocabulary",
    short: "Dictation that learns your words",
    job: "capture",
    inputs: ["voice"],
    keywords: ["vocabulary", "learn", "custom words", "misrecognition", "filler", "abbreviations", "drug names", "corrections"],
    steps: [
      ["speech-to-text", "Adapts to the clinician's or clinic's own terms from their corrections", "Stop fixing the same misrecognised word every day"],
      ["text-generation", "Removes filler words and flags likely misrecognised terms", "Dictated text reads like written text"],
    ],
    connectors: ["host"],
    review: "Likely corrections are flagged for the clinician to accept. It never changes numbers, units or dosages on its own.",
  },
  "Voice commands and auto-texts": {
    id: "voice-commands",
    short: "Your own phrases insert your own text",
    job: "capture",
    inputs: ["voice"],
    keywords: ["voice command", "auto-text", "macro", "template", "shortcut", "phrase", "snippet", "punctuation", "formatting"],
    steps: [["speech-to-text", "Recognises the clinician's trigger phrases and formatting commands", "Standard text and layout in a few words, not retyped"]],
    connectors: ["host"],
    review: "Saved text is written by the clinician and inserted exactly as saved; it adds no findings of its own.",
  },
  "Document import": {
    id: "document-import",
    short: "Scans and pasted labs become usable data",
    job: "capture",
    inputs: ["documents"],
    keywords: ["scan", "pdf", "ocr", "fax", "import", "lab values", "paste", "letter", "digitize", "upload"],
    steps: [
      ["corti-models", "Reads scans page by page and transcribes without 'plausible' corrections", "Faxes and scans become editable text, numbers intact"],
      ["agentic-framework", "Turns pasted lab text into typed values reconciled with the practice's lab catalogue", "Lab values land in the cumulative chart with H/L flags"],
    ],
    connectors: ["docs", "ehr"],
    review: "The clinician corrects the draft before saving and ticks each lab value. Numbers, units and dosages come back character-identical.",
  },
  "Structured chart data": {
    id: "structured-chart-data",
    short: "What was said lands in the right fields",
    job: "capture",
    inputs: ["conversation", "record"],
    keywords: ["structured", "allergies", "problem list", "vitals", "fields", "snomed", "chart fields", "data entry"],
    steps: [
      ["agentic-framework", "Reads transcript and notes and compares with what is already in the chart", "Duplicates and conflicts flagged, not added"],
      ["medical-coding", "Proposes allergies, problems, medications and vitals with SNOMED CT or ICD-10 codes", "Structured lists that decision support can actually use"],
      ["text-generation", "Shows the supporting passage for each proposed entry", "Accept or reject each entry in a click"],
    ],
    connectors: ["ehr"],
    review: "The clinician accepts or rejects each entry; nothing is written without confirmation.",
  },
  "Document generation assistant": {
    id: "document-generation",
    short: "Discharge letters & referrals from the record",
    job: "write",
    inputs: ["record"],
    keywords: ["document", "documents", "discharge", "letter", "referral", "summary", "gp", "write up", "admission"],
    steps: [
      ["agentic-framework", "Pulls admission reason, key events, treatment, medication changes and follow-up from the EHR", "Nothing copied by hand — gaps in the record are flagged, not filled in"],
      ["text-generation", "Writes the document in the structure the hospital uses", "Discharge letters, referrals and GP summaries ready to review"],
    ],
    connectors: ["ehr"],
    review: "The clinician reviews and edits the draft before it is signed. Missing or unclear information is flagged, not filled in.",
  },
  "Insurance and support letters": {
    id: "insurance-letters",
    short: "Letters to insurers, cited from the record",
    job: "write",
    inputs: ["record"],
    keywords: ["insurance", "letter", "authorization", "prior auth", "support letter", "employer", "mri request", "justification"],
    steps: [
      ["agentic-framework", "Finds the relevant history, results and treatment for the request", "The evidence is gathered for you"],
      ["text-generation", "Drafts the letter in the structure the receiver expects, each statement cited", "Fewer letters sent back for a missing detail"],
    ],
    connectors: ["ehr"],
    review: "Missing information is flagged and not filled in. The clinician edits and signs.",
  },
  "Form autofill": {
    id: "form-autofill",
    short: "Any form filled from the record, with sources",
    job: "write",
    inputs: ["record", "documents"],
    keywords: ["form", "forms", "certificate", "sick note", "questionnaire", "autofill", "fill in", "prescription form", "pdf form"],
    steps: [
      ["corti-models", "Reads the form's questions and answer options, including imported PDFs", "Any form works, not only built-in templates"],
      ["agentic-framework", "Pulls each answer from the selected visits with its source quote", "Fields not found are left empty, not guessed"],
      ["medical-coding", "Uses only diagnosis codes the doctor has confirmed", "Diagnosis fields stay billing-consistent"],
    ],
    connectors: ["ehr", "docs"],
    review: "Anything not found is left empty for the clinician. The filled form is reviewed before it is saved.",
  },
  "Reply drafting in your own style": {
    id: "reply-drafting",
    short: "Patient replies, in your voice",
    job: "write",
    inputs: ["messages", "record"],
    keywords: ["reply", "replies", "e-consultation", "portal message", "patient question", "respond", "message", "writing style"],
    steps: [
      ["agentic-framework", "Pulls the relevant record and applies the guardrails", "Red flags escalated, never answered by the draft"],
      ["text-generation", "Drafts the reply in the clinician's own style, with sources", "Replies that sound like you, in a fraction of the time"],
    ],
    connectors: ["patientApp", "ehr"],
    review: "No new diagnosis, no medication changes, red flags escalated. The clinician edits and sends.",
  },
  "Medication reconciliation": {
    id: "medication-reconciliation",
    short: "Conflicting med lists flagged, not guessed",
    job: "check",
    inputs: ["conversation", "record", "documents"],
    keywords: ["medication", "medicine", "reconciliation", "drug", "prescription", "discrepancy", "med list", "conflict", "dosage"],
    steps: [
      ["speech-to-text", "Captures what the patient says they actually take", "The spoken medication history is one of the sources"],
      ["agentic-framework", "Collects lists from patient, referral, notes and EHR and compares them line by line", "Missing drugs, dosage differences and stopped meds surface as a list"],
      ["text-generation", "Writes up each conflict with its sources", "You resolve conflicts with the patient; the record is updated"],
    ],
    connectors: ["ehr"],
    review: "The capability flags conflicts; it does not pick the correct list itself. The clinician resolves each one with the patient.",
  },
  "Diagnosis list reconciliation": {
    id: "diagnosis-list-reconciliation",
    short: "Problem lists that match the notes",
    job: "check",
    inputs: ["record"],
    keywords: ["problem list", "diagnosis list", "stale diagnosis", "wrong diagnosis", "icd", "reconcile", "chart hygiene"],
    steps: [
      ["agentic-framework", "Compares every diagnosis on the list with the visit notes", "Stale and wrong diagnoses stop spreading into letters and codes"],
      ["medical-coding", "Proposes the corrected code for each mismatch", "E10.90 → E11.90, applied with one click"],
      ["text-generation", "States the reason for each suggested correction", "You see why before you accept"],
    ],
    connectors: ["ehr"],
    review: "Each correction is a suggestion with a reason; the clinician applies it.",
  },
  "Documentation check against transcript": {
    id: "documentation-check",
    short: "Notes checked against what was said",
    job: "check",
    inputs: ["conversation", "record"],
    keywords: ["check", "verify", "note quality", "hallucination", "missing", "left right", "accuracy", "review note", "qa"],
    steps: [
      ["speech-to-text", "Provides the transcript of what was actually said", "The consultation itself is the reference"],
      ["text-generation", "Compares note to transcript and to itself, listing each finding with its source", "Unsupported, missing or mixed-up details caught before you sign"],
    ],
    connectors: ["ehr"],
    review: "The clinician decides what to change. It does not edit the note and does not make clinical judgments.",
  },
  "Regulatory documentation check": {
    id: "regulatory-check",
    short: "Notes checked against the rules that apply",
    job: "check",
    inputs: ["record", "rules"],
    keywords: ["regulatory", "compliance", "requirements", "mandatory fields", "audit", "registry", "documentation requirements"],
    steps: [
      ["agentic-framework", "Checks the note or form against the given rule set", "Missing elements found now, not at audit"],
      ["text-generation", "Lists each finding with the rule and the source passage", "You fix exactly what is missing"],
    ],
    connectors: ["ehr", "rules"],
    review: "It only checks against the rules it is given and does not judge the care. The clinician fixes what is missing.",
  },
  "Patient AI conversation review": {
    id: "patient-ai-review",
    short: "Patients' AI chats checked against their record",
    job: "check",
    inputs: ["patient", "record"],
    keywords: ["chatgpt", "ai chat", "self-diagnosis", "patient research", "dr google", "claims", "talking points"],
    steps: [
      ["agentic-framework", "Lists the claims in the chat and checks each against the record", "Consistent, unsupported or conflicting — at a glance"],
      ["text-generation", "Writes a short summary with talking points for the visit", "Discuss what matters instead of reading a chat log"],
    ],
    connectors: ["ehr", "patientApp"],
    review: "It does not diagnose and does not judge the patient's chat; the clinician decides what to take up.",
  },
  "Trainee note feedback": {
    id: "trainee-feedback",
    short: "Teaching feedback on trainees' own notes",
    job: "check",
    inputs: ["conversation", "record"],
    keywords: ["trainee", "resident", "student", "teaching", "feedback", "supervisor", "education", "training"],
    steps: [
      ["speech-to-text", "Provides the consultation the trainee's note is compared to", "Feedback grounded in what actually happened"],
      ["text-generation", "Lists what is missing, unsupported or unclear, written as feedback", "Trainees build the skill instead of outsourcing it"],
    ],
    connectors: ["ehr"],
    review: "The supervisor reviews the feedback before it reaches the trainee. It does not score or grade.",
  },
  "Chart search": {
    id: "chart-search",
    short: "Ask the record, get the source",
    job: "understand",
    inputs: ["record"],
    keywords: ["search", "find", "chart", "record", "look up", "where is", "history", "ehr search"],
    steps: [
      ["corti-models", "Indexes the record and finds the matching passages", "Find it in seconds instead of clicking through documents"],
      ["text-generation", "Answers directly, each statement linked to its source", "Every answer shows the document and place it came from"],
    ],
    connectors: ["ehr"],
    review: "Only shows what the clinician is authorized to see. It is read-only and never writes to the chart.",
    problemOverride:
      "The answer is usually somewhere in the record, but finding one value or sentence means clicking through notes, letters and reports one by one. Under time pressure it gets skipped and decisions are made without it.",
  },
  "Patient-at-a-glance/ Timeline": {
    id: "patient-at-a-glance",
    short: "The patient's story before you walk in",
    job: "understand",
    inputs: ["record"],
    keywords: ["summary", "timeline", "at a glance", "overview", "prepare", "preparation", "history", "what changed", "pre-charting"],
    steps: [
      ["agentic-framework", "Pulls documents, notes, results and medications from the EHR", "No more digging through the record before each patient"],
      ["text-generation", "Builds the timeline — what changed, open items — ordered for your role", "Minutes saved per patient, every statement linked to its source"],
    ],
    connectors: ["ehr"],
    review: "Every statement links back to its source. It is a view for preparation, not a second copy of the record.",
  },
  "Anatomy overview": {
    id: "anatomy-overview",
    short: "Altered anatomy, mapped before you operate",
    job: "understand",
    inputs: ["record"],
    keywords: ["anatomy", "surgery", "surgical", "operative notes", "drains", "lines", "anastomosis", "mesh", "pre-op", "imaging"],
    steps: [
      ["agentic-framework", "Reads operative, imaging, procedure and nursing notes and matches them", "Disagreements between op note and imaging flagged, not resolved silently"],
      ["text-generation", "Builds a structured overview by body region, with every line, drain and change", "The surgeon checks one overview, not a stack of old op notes"],
    ],
    connectors: ["ehr"],
    review: "Every item links to its source document; conflicts are flagged for the clinician instead of being resolved.",
  },
  "Consultation preparation pointers": {
    id: "consultation-pointers",
    short: "What to ask and examine, as the visit unfolds",
    job: "understand",
    inputs: ["record", "conversation"],
    keywords: ["preparation", "pointers", "what to ask", "examination", "history taking", "differential", "consultation support"],
    steps: [
      ["agentic-framework", "Reads the record before the visit to work out the likely problems", "Walk in with a plan, even outside your usual area"],
      ["speech-to-text", "Listens during the consultation and updates the picture", "Pointers follow the conversation as it changes"],
      ["text-generation", "Writes short history and examination pointers with the reason for each", "The right questions don't get missed when time is short"],
    ],
    connectors: ["ehr"],
    review: "The pointers are suggestions only; the clinician decides what to use. Each one shows why it was suggested.",
  },
  "Results review": {
    id: "results-review",
    short: "New results, with the trend and the context",
    job: "understand",
    inputs: ["record"],
    keywords: ["results", "labs", "lab results", "trend", "abnormal", "flags", "test results", "acknowledge"],
    steps: [
      ["agentic-framework", "Pulls new results with earlier values, diagnoses and medication", "Trends and new abnormals stop hiding in long lists"],
      ["text-generation", "Writes one short summary per patient, each statement linked to its result", "Review a patient's results in seconds"],
    ],
    connectors: ["ehr"],
    review: "It does not diagnose and does not recommend treatment.",
  },
  "MDT and tumor board prep": {
    id: "mdt-prep",
    short: "One cited case summary per patient on the agenda",
    job: "understand",
    inputs: ["record"],
    keywords: ["mdt", "tumor board", "tumour board", "multidisciplinary", "oncology", "case summary", "meeting prep", "staging"],
    steps: [
      ["agentic-framework", "Gathers diagnosis, staging, treatments, imaging and pathology per patient", "No more preparing the agenda the night before"],
      ["text-generation", "Writes a one-page summary with conflicts and pending results listed apart", "Every statement linked to its source"],
    ],
    connectors: ["ehr"],
    review: "The clinician adds the question for the meeting. It does not recommend a treatment.",
  },
  "Shift handover": {
    id: "shift-handover",
    short: "Structured handover, ordered by acuity",
    job: "understand",
    inputs: ["record"],
    keywords: ["handover", "handoff", "shift", "sbar", "abcde", "icu", "ward", "night shift"],
    steps: [
      ["agentic-framework", "Collects status, changes, interventions, pending results and escalation plans per patient", "Details stop getting lost at shift change"],
      ["text-generation", "Writes the handover in the unit's framework, e.g. SBAR or ABCDE", "The incoming clinician can open each item's source"],
    ],
    connectors: ["ehr"],
    review: "The outgoing clinician reviews and adds before handing over.",
  },
  "Task extraction": {
    id: "task-extraction",
    short: "Follow-ups turned into prepared tasks",
    job: "automate",
    inputs: ["conversation", "record", "messages"],
    keywords: ["follow-up", "follow up", "tasks", "task", "after visit", "referral form", "order test", "book follow-up", "actions", "to-do"],
    steps: [
      ["agentic-framework", "Pulls the decided actions from visits, emails and voicemails into one task list", "Referrals, tests and follow-ups stop getting lost"],
      ["text-generation", "Fills in each task's details, e.g. drafts the referral form", "Staff approve prepared tasks instead of writing them"],
    ],
    connectors: ["ehr"],
    review: "Tasks that send or book anything wait for staff approval. Actions the clinician did not clearly decide on are not extracted.",
  },
  "End-of-day catch-up": {
    id: "end-of-day",
    short: "Everything still open, ready to sign",
    job: "automate",
    inputs: ["record"],
    keywords: ["end of day", "after hours", "unsigned notes", "open tasks", "pajama time", "catch up", "sign off", "backlog"],
    steps: [
      ["agentic-framework", "Collects unsigned notes, open tasks, draft letters and results to acknowledge", "One list instead of four places"],
      ["text-generation", "Prepares each item for review and sign-off in a few clicks", "The evening admin gets shorter"],
    ],
    connectors: ["ehr"],
    review: "Nothing is signed or sent automatically.",
  },

  // ═══════════ Operations ═══════════
  "Denial management and appeals": {
    id: "denial-management",
    short: "Denied claims answered point by point",
    job: "write",
    inputs: ["record", "rules"],
    keywords: ["denial", "denied", "appeal", "appeals", "insurer", "payer", "dispute", "rejected"],
    steps: [
      ["agentic-framework", "Gathers the claim, coverage policy and patient record and works out what's disputed", "The case is built for you — no digging through correspondence"],
      ["medical-coding", "Finds the documentation behind each billed code", "Every disputed code backed by the record"],
      ["text-generation", "Drafts the appeal point by point, citing record and policy", "More denials appealed, with less staff time"],
    ],
    connectors: ["ehr", "billing"],
    review: "Staff review, edit and send; the capability does not submit anything itself.",
  },
  "Referral intake check": {
    id: "referral-intake",
    short: "Incomplete referrals caught on arrival",
    job: "capture",
    inputs: ["documents"],
    keywords: ["referral", "referrals", "fax", "incoming", "missing information", "referrer", "intake", "triage referrals"],
    steps: [
      ["corti-models", "Reads the referral, with OCR for scans, and finds patient, question and urgency", "No more re-typing faxes"],
      ["agentic-framework", "Checks it against what the service needs and matches it to the patient", "Missing history, meds or imaging found on day one"],
      ["text-generation", "Drafts the request back to the referrer", "Chasing by phone replaced by a ready message"],
    ],
    connectors: ["docs", "ehr"],
    review: "Staff confirm the patient match and approve the request; nothing is sent automatically.",
  },
  "Inbox assistant": {
    id: "inbox-assistant",
    short: "Email and voicemail ranked and drafted",
    job: "automate",
    inputs: ["messages"],
    keywords: ["inbox", "email", "emails", "voicemail", "messages", "front office", "reception", "prioritize", "urgent requests"],
    steps: [
      ["speech-to-text", "Transcribes voicemails so they work like emails", "One inbox, not two"],
      ["agentic-framework", "Ranks every message and extracts intent, fields and tasks", "Urgent requests and same-day cancellations seen first"],
      ["text-generation", "Drafts the reply for each message", "Staff send instead of write"],
    ],
    connectors: ["inbox"],
    review: "Replies and tasks are drafts for the practice team to review and send.",
  },
  "Phone Assistant": {
    id: "phone-assistant",
    short: "Routine patient calls handled end to end",
    job: "automate",
    inputs: ["messages", "patient", "schedule"],
    keywords: ["phone", "call", "calls", "booking", "book", "appointment", "reschedule", "reminder", "reminders", "reception", "hold"],
    steps: [
      ["speech-to-text", "Understands the caller in natural voice; every call transcribed", "No more queues on the line at peak times"],
      ["agentic-framework", "Identifies the caller and books, reschedules and reminds in the scheduling system", "Routine requests done without staff picking up"],
      ["text-generation", "Answers from the practice's information and summarises hand-offs", "Red flags reach staff with a ready summary of the call"],
    ],
    connectors: ["telephony", "scheduling"],
    review: "Red-flag symptoms or anything outside its scope are handed to staff with a summary. Every call is transcribed and logged.",
  },
  "Health Monitoring": {
    id: "health-monitoring",
    short: "Deterioration spotted in the data, not the call",
    job: "automate",
    inputs: ["record"],
    keywords: ["monitoring", "monitor", "alert", "alerts", "deterioration", "threshold", "chronic", "lab values", "readings", "population"],
    steps: [
      ["agentic-framework", "Watches the parameters defined per condition across the patient base", "Worrying trends caught before the patient calls"],
      ["text-generation", "Writes each alert with the values and context from the record", "Staff see why the alert fired, at a glance"],
    ],
    connectors: ["ehr"],
    review: "Alerts go to staff, who decide what to do; the capability does not contact patients.",
  },
  Routines: {
    id: "routines",
    short: "Scheduled sweeps that hand you a worklist",
    job: "automate",
    inputs: ["record"],
    keywords: ["routine", "routines", "sweep", "worklist", "overdue", "recall", "pending results", "registry", "every morning"],
    steps: [
      ["agentic-framework", "Runs on a schedule over the patient list, checking each record for the sweep's condition", "Recurring checks actually happen — every day, every patient"],
      ["text-generation", "Writes a short case summary and next step per patient", "A worklist sorted by urgency, ready to act on"],
    ],
    connectors: ["ehr"],
    review: "The agent does not contact patients; staff act on each item.",
  },
  "Scheduling assistant": {
    id: "scheduling-assistant",
    short: "Calendars tuned to demand and no-shows",
    job: "automate",
    inputs: ["schedule"],
    keywords: ["scheduling", "schedule", "calendar", "slots", "no-show", "no show", "capacity", "filling rate", "cancellation", "free slot"],
    steps: [
      ["corti-models", "Learns demand, durations, no-show and cancellation patterns from booking history", "Predicts which bookings are likely to be cancelled"],
      ["agentic-framework", "Recommends slot layouts and suggests free slots for individual requests", "Fewer empty slots, shorter waits for urgent cases"],
    ],
    connectors: ["scheduling"],
    review: "Staff decide what to adopt; existing appointments are not moved on their own.",
  },

  // ═══════════ Patient-facing ═══════════
  "Patient intake": {
    id: "patient-intake",
    short: "Adaptive pre-visit interview, structured summary",
    job: "capture",
    inputs: ["patient"],
    keywords: ["intake", "pre-visit", "previsit", "history", "questionnaire", "before the visit", "anamnesis", "pre-charting"],
    steps: [
      ["speech-to-text", "Lets the patient answer by voice as well as text", "Patients answer the way that suits them — fewer abandoned forms"],
      ["agentic-framework", "Picks each next question from the previous answer", "The interview follows the patient's story, not a fixed form"],
      ["text-generation", "Writes the structured pre-visit summary", "You start the visit with the history already collected"],
    ],
    connectors: ["patientApp", "ehr"],
    review: "The clinician confirms the summary with the patient; it is a summary, not a diagnosis.",
  },
  "After-visit summary for patients": {
    id: "after-visit-summary",
    short: "Plain-language instructions after the visit",
    job: "write",
    inputs: ["conversation", "record"],
    keywords: ["after visit summary", "patient instructions", "discharge instructions", "plain language", "patient education", "avs"],
    steps: [
      ["speech-to-text", "Uses the transcript of what was actually said", "Nothing added that wasn't said in the visit"],
      ["text-generation", "Writes diagnosis, changes, follow-up and warning signs at the patient's reading level and language", "Fewer half-remembered instructions and call-backs"],
    ],
    connectors: ["ehr", "patientApp"],
    review: "The clinician reviews and approves before it is sent.",
  },
  "Chat with your own medical record": {
    id: "chat-with-record",
    short: "Patients ask their record in plain language",
    job: "understand",
    inputs: ["record", "patient"],
    keywords: ["patient", "patients", "record", "results", "explain", "plain language", "adherence", "prevention", "portal"],
    steps: [
      ["corti-models", "Finds the answer in the patient's own record, with the source shown", "Fewer calls to the clinic between visits"],
      ["text-generation", "Phrases it for a layperson", "Patients understand results and instructions — adherence improves"],
    ],
    connectors: ["ehr", "patientApp"],
    review: "It does not diagnose or advise treatment; medical questions are referred to the clinician.",
  },
};

/** Notion rows deliberately not shown as capability cards. */
const NOT_A_CARD = new Set(["AI review trail"]);

function build(): Capability[] {
  const out: Capability[] = [];
  const warn = (msg: string) => console.warn(`[capabilities] ${msg}`);
  for (const row of snapshot.rows) {
    if (row.backlog || NOT_A_CARD.has(row.name)) continue;
    const ed = EDITORIAL[row.name];
    if (!ed) {
      warn(`Notion row "${row.name}" has no EDITORIAL entry — skipped.`);
      continue;
    }
    const notionPrims = row.primitives.map((p) => NOTION_PRIMITIVE[p]).filter(Boolean).sort();
    const ourPrims = [...new Set(ed.steps.map((s) => s[0]))].sort();
    if (notionPrims.join() !== ourPrims.join())
      warn(`"${row.name}": Notion primitives [${notionPrims}] ≠ pipeline [${ourPrims}].`);
    const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
    out.push({
      id: ed.id,
      name: row.name.replace("/ ", " / "),
      category: (row.category ?? "Clinician-facing") as CapabilityCategory,
      track: ed.productId ? "product" : "custom",
      productId: ed.productId,
      job: ed.job,
      inputs: ed.inputs,
      short: ed.short,
      outcome: sentence(row.oneLiner),
      whenToUse: ed.problemOverride ?? row.clinicalProblem,
      howItWorks: row.howItWorks,
      keywords: ed.keywords,
      pipeline: ed.steps.map(([primitiveId, roleInPipeline, clinicianOutcome]) => ({ primitiveId, roleInPipeline, clinicianOutcome })),
      connectors: ed.connectors.map((k) => C[k]),
      trust: [{ id: "trust-review", name: "Human in the loop", roleInPipeline: ed.review }, REVIEW_TRAIL, DEPLOY, TRACES],
    });
  }
  const known = new Set(snapshot.rows.map((r) => r.name));
  for (const name of Object.keys(EDITORIAL)) if (!known.has(name)) warn(`EDITORIAL "${name}" not in Notion snapshot (renamed or removed?).`);
  return out;
}

export const CAPABILITIES: Capability[] = build();

/** Products in PRODUCT_ORDER (Scribe, Dictation, Coding, Chat). */
export const PRODUCT_CAPABILITIES = PRODUCT_ORDER.map((pid) => CAPABILITIES.find((c) => c.productId === pid)).filter(
  (c): c is Capability => !!c,
);
export const CUSTOM_CAPABILITIES = CAPABILITIES.filter((c) => c.track === "custom");

/** Shown in the primitives map by default: the products + one example per job. */
export const FEATURED_IDS: string[] = [
  "ambient-scribe",
  "medical-dictation",
  "billing-assistant",
  "medical-knowledge-assistant",
  "patient-intake",
  "document-generation",
  "medication-reconciliation",
  "patient-at-a-glance",
  "phone-assistant",
  "task-extraction",
];

/** Example goal chips on the "try it yourself" screen — a mix of product and build-with-us matches. */
export const EXAMPLE_GOALS: { goal: string; capabilityId: string }[] = [
  { goal: "Stop typing notes during my consultations", capabilityId: "ambient-scribe" },
  { goal: "Catch coding mismatches before claims go out", capabilityId: "billing-assistant" },
  { goal: "Read incoming referrals and chase what's missing", capabilityId: "referral-intake" },
  { goal: "Make shift handover on the ward safer", capabilityId: "shift-handover" },
  { goal: "Take routine calls off my reception desk", capabilityId: "phone-assistant" },
  { goal: "Translate consultations with patients who don't speak my language", capabilityId: "consultation-interpreter" },
];

export function getCapability(id: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.id === id);
}
