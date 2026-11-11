import type { Capability, ConnectorRef, Primitive, TrustRef } from "../types";

// ————————————————————————————————————————————————
// THE DROP-IN FILE
//
// This is the only file that changes when the capability taxonomy changes.
// Everything else — components, agent prompt, server — reads from here. The
// agent prompt is regenerated from toAgentTaxonomy() in
// src/agent/composerAgent.ts on every server start and PATCHed onto the live
// agent, so new capabilities appear without touching any other file.
//
// SOURCE OF TRUTH: Corti's internal capability database (Notion).
// Synced 2026-11-11. Name, category, one-liner (outcome), clinical problem
// (whenToUse), how it works and primitives used are taken from Notion.
// Pipeline step wording and keywords are derived from "How it works".
//
// All 21 Notion capabilities are here (the composer agent matches against
// all of them). The library TREE shows the featured 10 in
// FEATURED_IDS. The rest appear under "See all capabilities".
// ————————————————————————————————————————————————

/** Primitives registry — the five build primitives. Notion's "Primitives used"
 *  also has "Embedded Assistant"; it is a UI surface, not a primitive, so the
 *  demo leaves it out (only Ambient scribe listed it).
 *  Order = top-to-bottom order in the library diagram. */
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

// ——— Shared connectors ———
const EHR: ConnectorRef = { id: "connector-ehr", name: "EHR", roleInPipeline: "Reads the record and writes reviewed results back" };

// ——— Shared trust layer (deployment + observability) ———
const DEPLOY: TrustRef = {
  id: "trust-deploy",
  name: "EU / US cloud or on-prem",
  roleInPipeline: "Runs in EU or US cloud, or the customer's own environment",
};
const TRACES: TrustRef = {
  id: "trust-traces",
  name: "Traces & evals",
  roleInPipeline: "Every run traced, verified and evaluated against gold sets",
};
/** The per-capability human-in-the-loop rule, quoted from Notion "How it works". */
const review = (rule: string): TrustRef => ({ id: "trust-review", name: "Human in the loop", roleInPipeline: rule });

export const CAPABILITIES: Capability[] = [
  // ——————————————— Clinician-facing ———————————————
  {
    id: "ambient-scribe",
    name: "Ambient scribe",
    category: "Clinician-facing",
    short: "The note writes itself during the visit",
    outcome: "Ambient AI transcription + clinical note generation during HCP consultations.",
    whenToUse:
      "Clinicians spend a large part of the day writing notes, during visits or after them, and attention goes to the screen instead of the patient. Notes written late from memory lose detail and add overtime at the end of the day.",
    howItWorks:
      "Listens to the consultation with consent and produces a live transcript with the speakers separated. At the end of the visit it generates the clinical note from the transcript, structured to the specialty's template. The clinician reviews and edits the note before it is signed. Nothing enters the record unreviewed.",
    keywords: ["ambient", "scribe", "note", "notes", "documentation", "consultation", "typing", "transcript", "soap", "hands-free", "visit"],
    pipeline: [
      {
        primitiveId: "speech-to-text",
        roleInPipeline: "Listens with consent and transcribes live, speakers separated",
        clinicianOutcome: "You keep your attention on the patient, not the screen",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Generates the note from the transcript in the specialty's template",
        clinicianOutcome: "The note is drafted when the visit ends — no evening catch-up",
      },
    ],
    connectors: [EHR],
    trust: [review("The clinician reviews and edits the note before it is signed. Nothing enters the record unreviewed."), DEPLOY, TRACES],
  },
  {
    id: "medical-dictation",
    name: "Medical dictation",
    category: "Clinician-facing",
    short: "Speak into any field, in real time",
    outcome: "Real-time medical speech-to-text used across products for HCP.",
    whenToUse:
      "Much clinical writing still happens in the EHR's own fields (reports, letters, structured forms), where an ambient scribe does not fit. Clinicians type it by hand, which is slow and pulls attention away from the patient.",
    howItWorks:
      "The clinician speaks and the text appears in real time where the cursor is, inside any field of the host application. Medical terms, drug names and dosages are recognized, and spoken commands (f.e. new line, next field) control the text. The clinician sees and edits everything as it lands.",
    keywords: ["dictation", "dictate", "speech", "voice", "report", "reports", "radiology", "letter", "field", "form", "typing"],
    pipeline: [
      {
        primitiveId: "speech-to-text",
        roleInPipeline: "Transcribes in real time where the cursor is, with drug names, dosages and voice commands",
        clinicianOutcome: "Reports, letters and forms written by voice, in any field",
      },
    ],
    connectors: [EHR],
    trust: [review("The clinician sees and edits everything as it lands."), DEPLOY, TRACES],
  },
  {
    id: "document-generation",
    name: "Document generation assistant",
    category: "Clinician-facing",
    short: "Discharge letters & referrals from the record",
    outcome: "Generates documents based on patient profile and encounters.",
    whenToUse:
      "Encounters have to be written up into several documents (discharge letter, referral, summary for the GP), each in a different structure, and staff produce them by copying from the notes. The copying is slow, repetitive work, and errors that slip in end up in the record.",
    howItWorks:
      "Takes the notes and documents from the EHR and pulls out the reason for admission, key events and findings, treatment, medication changes and follow-up. It writes them into a desired document in the structure the hospital uses. The clinician reviews and edits the draft before it is signed. Anything that is missing or unclear in the record is flagged and not filled in.",
    keywords: ["document", "documents", "discharge", "letter", "referral", "summary", "gp", "write up", "admission"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Pulls admission reason, key events, treatment, medication changes and follow-up from the EHR",
        clinicianOutcome: "Nothing copied by hand — gaps in the record are flagged, not filled in",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Writes the document in the structure the hospital uses",
        clinicianOutcome: "Discharge letters, referrals and GP summaries ready to review",
      },
    ],
    connectors: [EHR],
    trust: [review("The clinician reviews and edits the draft before it is signed. Missing or unclear information is flagged, not filled in."), DEPLOY, TRACES],
  },
  {
    id: "care-plan-assistant",
    name: "Care Plan Assistant",
    category: "Clinician-facing",
    short: "Guideline-backed treatment plans to sign off",
    outcome: "Suggests prescription & treatment plan based on diagnosis, aligned with clinical guidelines.",
    whenToUse:
      "Choosing a treatment means checking the current guideline, interactions with existing medication, allergies and local practice, with no time to consult any of it mid-visit. Choices rely on memory, so they drift from guidelines and miss what has changed.",
    howItWorks:
      "Takes the diagnosis together with the patient's record (medications, allergies, conditions, results) and retrieves the relevant guideline and local protocols. Drafts a proposed plan (prescriptions with dosing, tests, follow-up) with the guideline passage cited for each suggestion. The clinician accepts, changes or rejects each item; nothing is prescribed without their sign-off.",
    keywords: ["care plan", "treatment", "prescription", "prescribe", "guideline", "guidelines", "order", "orders", "dosing", "therapy"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Combines the diagnosis with medications, allergies and results, and retrieves the guideline and local protocols",
        clinicianOutcome: "Interactions, allergies and local practice checked for you",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Drafts the plan — prescriptions with dosing, tests, follow-up — citing the guideline for each item",
        clinicianOutcome: "Every suggestion shows the guideline passage behind it",
      },
    ],
    connectors: [EHR, { id: "connector-guidelines", name: "Guidelines & local protocols", roleInPipeline: "The sources each suggestion is cited from" }],
    trust: [review("The clinician accepts, changes or rejects each item; nothing is prescribed without their sign-off."), DEPLOY, TRACES],
  },
  {
    id: "medical-knowledge-assistant",
    name: "Medical Knowledge Assistant",
    category: "Clinician-facing",
    short: "Sourced answers from guidelines & drug data",
    outcome: "AI-powered access to verified medical guidelines, drug databases and clinical knowledge with sourced answers.",
    whenToUse:
      "Clinicians need current guidelines, drug references and local protocols at the point of care, but those live in separate systems and PDFs. Searching them mid-visit is slow, so questions go unanswered or are answered from memory.",
    howItWorks:
      "The clinician asks a question in natural language. It searches the connected sources (guidelines, drug databases, local protocols) and answers with the key point plus the exact source passage. It only answers from the sources it is connected to and shows where each claim comes from; it does not substitute its own medical opinion.",
    keywords: ["knowledge", "question", "answer", "guideline", "drug", "reference", "protocol", "lookup", "evidence", "ask"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Searches the connected guidelines, drug databases and local protocols",
        clinicianOutcome: "One question instead of five systems and a stack of PDFs",
      },
      {
        primitiveId: "corti-models",
        roleInPipeline: "Answers with the key point plus the exact source passage",
        clinicianOutcome: "Every claim shows where it comes from",
      },
    ],
    connectors: [{ id: "connector-knowledge", name: "Guidelines & drug databases", roleInPipeline: "The only sources it answers from" }],
    trust: [review("Answers only from connected sources and shows where each claim comes from; it does not substitute its own medical opinion."), DEPLOY, TRACES],
  },
  {
    id: "medication-reconciliation",
    name: "Medication reconciliation",
    category: "Clinician-facing",
    short: "Conflicting med lists flagged, not guessed",
    outcome: "When the sources conflict, the capability flags it for the clinician instead of deciding itself.",
    whenToUse:
      "In practice the medication list comes from several sources (patient conversation, referral, previous notes, EHR medication record), and those sources disagree.",
    howItWorks:
      "Collects the medication lists from the sources available for the visit: what the patient says, the referral letter, previous notes, the EHR record. Compares them line by line and lists the conflicts (medication present in one source and missing in another, dosage differences, drugs the patient has stopped taking). The clinician resolves each conflict with the patient and the record is updated. The capability flags conflicts; it does not pick the correct list itself.",
    keywords: ["medication", "medicine", "reconciliation", "drug", "prescription", "discrepancy", "med list", "conflict", "dosage"],
    pipeline: [
      {
        primitiveId: "speech-to-text",
        roleInPipeline: "Captures what the patient says they actually take",
        clinicianOutcome: "The spoken medication history is one of the sources",
      },
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Collects lists from patient, referral, notes and EHR and compares them line by line",
        clinicianOutcome: "Missing drugs, dosage differences and stopped meds surface as a list",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Writes up each conflict with its sources",
        clinicianOutcome: "You resolve conflicts with the patient; the record is updated",
      },
    ],
    connectors: [EHR],
    trust: [review("The capability flags conflicts; it does not pick the correct list itself. The clinician resolves each one with the patient."), DEPLOY, TRACES],
  },

  // ——————————————— Operations ———————————————
  {
    id: "billing-assistant",
    name: "Billing Assistant",
    category: "Operations",
    short: "Codes checked against the documentation",
    outcome:
      "Suggest and automate billing code creation. Before a claim goes out, checks the assigned diagnosis and procedure codes (and DRG) against what the documentation actually supports.",
    whenToUse:
      "Codes and notes drift apart: a diagnosis is coded but not documented, or documented but not coded. This leads to under-coding (lost revenue), over-coding (audit and compliance risk) and denials later. Today coders and CDI teams check this by hand, often retrospectively and on a sample only.",
    howItWorks:
      "Takes the note and documentation from the visit and suggests the diagnosis and procedure codes (and DRG) they support, with the passage that justifies each code. Before a claim goes out, re-checks the final codes against the documentation and flags mismatches in both directions (coded but not documented, documented but not coded). Coder or clinician resolves each flag; the claim is not submitted automatically.",
    keywords: ["billing", "bill", "code", "coding", "coded", "icd", "cpt", "drg", "claim", "claims", "cdi", "revenue", "denial", "audit"],
    pipeline: [
      {
        primitiveId: "medical-coding",
        roleInPipeline: "Suggests diagnosis and procedure codes (and DRG) with the justifying passage",
        clinicianOutcome: "Every code traceable to the sentence that supports it",
      },
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Re-checks final codes against the documentation before the claim goes out",
        clinicianOutcome: "Under- and over-coding caught before submission, not in an audit",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Explains each mismatch in both directions for the coder",
        clinicianOutcome: "Coders resolve flags instead of sampling charts by hand",
      },
    ],
    connectors: [EHR, { id: "connector-billing", name: "Billing / claims system", roleInPipeline: "Receives the reviewed codes" }],
    trust: [review("Coder or clinician resolves each flag; the claim is not submitted automatically."), DEPLOY, TRACES],
  },
  {
    id: "phone-assistant",
    name: "Phone Assistant",
    category: "Operations",
    short: "Routine patient calls handled end to end",
    outcome: "AI agent handling inbound/outbound patient calls, bookings, reminders and follow-ups.",
    whenToUse:
      "Routine patient calls (booking, changing and reminding appointments, answering the same questions, chasing follow-ups) take up staff hours. Lines are busy at peak times, patients wait on hold, and staff time goes to admin instead of the patients in the clinic.",
    howItWorks:
      "Answers inbound calls and makes outbound ones in natural voice. It identifies the caller, handles the routine requests (booking, rescheduling, reminders, instructions) directly in the scheduling system, and answers routine questions from the practice's information. Red-flag symptoms or anything outside its scope are handed to staff with a summary of the call. Every call is transcribed and logged.",
    keywords: ["phone", "call", "calls", "booking", "book", "appointment", "reschedule", "reminder", "reminders", "reception", "scheduling", "hold"],
    pipeline: [
      {
        primitiveId: "speech-to-text",
        roleInPipeline: "Understands the caller in natural voice; every call transcribed",
        clinicianOutcome: "No more queues on the line at peak times",
      },
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Identifies the caller and books, reschedules and reminds in the scheduling system",
        clinicianOutcome: "Routine requests done without staff picking up",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Answers from the practice's information and summarises hand-offs",
        clinicianOutcome: "Red flags reach staff with a ready summary of the call",
      },
    ],
    connectors: [
      { id: "connector-telephony", name: "Telephony", roleInPipeline: "Inbound and outbound calls" },
      { id: "connector-scheduling", name: "Scheduling system", roleInPipeline: "Bookings, changes and reminders" },
    ],
    trust: [review("Red-flag symptoms or anything outside its scope are handed to staff with a summary. Every call is transcribed and logged."), DEPLOY, TRACES],
  },

  // ——————————————— Patient-facing ———————————————
  {
    id: "patient-intake",
    name: "Patient intake",
    category: "Patient-facing",
    short: "Adaptive pre-visit interview, structured summary",
    outcome:
      "Patient answers questions before the visit by text or voice, the questions adapt to the answers, and the result arrives as a structured pre-visit summary.",
    whenToUse:
      "The patient's own account (why they are coming, symptoms, medication changes since last time) usually arrives unstructured or not at all, so the first minutes of the visit go to collecting history. Static forms get abandoned and miss the context behind the answers.",
    howItWorks:
      "Sends the patient questions by text or voice before the visit. Each answer decides the next question, so the interview follows the patient's story instead of a fixed form and covers reason for visit, symptoms, medication changes and relevant history. The answers arrive as a structured pre-visit summary for the clinician. The clinician confirms it with the patient; it is a summary, not a diagnosis.",
    keywords: ["intake", "pre-visit", "previsit", "history", "questionnaire", "form", "forms", "before the visit", "anamnesis", "pre-charting"],
    pipeline: [
      {
        primitiveId: "speech-to-text",
        roleInPipeline: "Lets the patient answer by voice as well as text",
        clinicianOutcome: "Patients answer the way that suits them — fewer abandoned forms",
      },
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Picks each next question from the previous answer",
        clinicianOutcome: "The interview follows the patient's story, not a fixed form",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Writes the structured pre-visit summary",
        clinicianOutcome: "You start the visit with the history already collected",
      },
    ],
    connectors: [EHR, { id: "connector-patient-app", name: "Patient app / SMS", roleInPipeline: "Where the patient answers" }],
    trust: [review("The clinician confirms the summary with the patient; it is a summary, not a diagnosis."), DEPLOY, TRACES],
  },
  {
    id: "chat-with-record",
    name: "Chat with your own medical record",
    category: "Patient-facing",
    short: "Patients ask their record in plain language",
    outcome: "Conversational AI supporting patients across their full health journey (preparation, adherence, prevention).",
    whenToUse:
      "Patients leave visits with questions they forgot to ask and instructions they half-remember, and their own record is hard to read. Questions pile up until the next appointment or a call to the clinic, and adherence suffers in between.",
    howItWorks:
      "The patient connects their record and asks questions in plain language: what do my results mean, why this medication, what should I do before the surgery. Answers are drawn from the record with the source shown, phrased for a layperson. It does not diagnose or advise treatment; medical questions are referred to the clinician.",
    keywords: ["patient", "patients", "chat", "record", "results", "explain", "plain language", "adherence", "prevention", "questions", "portal"],
    pipeline: [
      {
        primitiveId: "corti-models",
        roleInPipeline: "Finds the answer in the patient's own record, with the source shown",
        clinicianOutcome: "Fewer calls to the clinic between visits",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Phrases it for a layperson",
        clinicianOutcome: "Patients understand results and instructions — adherence improves",
      },
    ],
    connectors: [EHR, { id: "connector-patient-app", name: "Patient app / portal", roleInPipeline: "Where the patient chats" }],
    trust: [review("It does not diagnose or advise treatment; medical questions are referred to the clinician."), DEPLOY, TRACES],
  },

  // ═══════════════════════════════════════════════════════════════════
  // Not in the demo tree — listed under "See all capabilities", and the
  // composer agent can still match them (they then join the tree).
  // ═══════════════════════════════════════════════════════════════════

  // ——————————————— Clinician-facing ———————————————
  {
    id: "after-visit-tasks",
    name: "After-visit task extraction",
    category: "Clinician-facing",
    short: "Follow-up tasks pulled from the visit",
    outcome:
      "Takes the follow-up tasks from a visit and carries them out (referrals, forms, booking follow-ups), with approval steps.",
    whenToUse:
      "Consultations produce actions that need to happen afterwards (referrals to send, tests to order, follow-up appointments, things to tell the patient), and those get lost today.",
    howItWorks:
      "Takes the transcript and note from the visit and pulls out the actions the clinician decided on (referral to send, test to order, follow-up to book, instruction to the patient). Each action becomes a task with the details filled in from the visit, f.e. a referral form drafted for the receiving clinic. Tasks that send or book anything wait for staff approval. Actions the clinician did not clearly decide on are not extracted.",
    keywords: ["follow-up", "follow up", "tasks", "task", "after visit", "referral form", "order test", "book follow-up", "actions", "to-do"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Pulls the decided actions from transcript and note and turns each into a task",
        clinicianOutcome: "Referrals, tests and follow-ups stop getting lost after the visit",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Fills in each task's details, f.e. drafts the referral form",
        clinicianOutcome: "Staff approve prepared tasks instead of writing them",
      },
    ],
    connectors: [EHR],
    trust: [review("Tasks that send or book anything wait for staff approval. Actions the clinician did not clearly decide on are not extracted."), DEPLOY, TRACES],
  },
  {
    id: "chart-search",
    name: "Chart search",
    category: "Clinician-facing",
    short: "Ask the record, get the source",
    outcome: "Semantic search on top of the record, returning documents or answering a question directly with the source shown.",
    whenToUse: "How a clinician finds a specific piece of information in the EHR today, and where that breaks down.",
    howItWorks:
      "Indexes the documents in the patient's record (notes, letters, results, reports). The clinician asks in natural language; it finds the matching passages and answers the question directly, with each statement linked to the document and place it came from. It only searches the record and only shows what the clinician is authorized to see. It is read-only and never writes to the chart.",
    keywords: ["search", "find", "chart", "record", "look up", "where is", "history", "ehr search"],
    pipeline: [
      {
        primitiveId: "corti-models",
        roleInPipeline: "Indexes the record and finds the matching passages",
        clinicianOutcome: "Find it in seconds instead of clicking through documents",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Answers directly, each statement linked to its source",
        clinicianOutcome: "Every answer shows the document and place it came from",
      },
    ],
    connectors: [EHR],
    trust: [review("Only shows what the clinician is authorized to see. It is read-only and never writes to the chart."), DEPLOY, TRACES],
  },
  {
    id: "diagnosis-assistant",
    name: "Diagnosis assistant",
    category: "Clinician-facing",
    short: "Ranked differentials and the path to diagnosis",
    outcome: "Suggest differential diagnosis and care path to diagnosis.",
    whenToUse:
      "Reaching a diagnosis takes several visits: order tests, see the patient again, narrow it down. With limited time per patient and thousands of rare conditions, uncommon diagnoses are considered late and unnecessary tests get ordered along the way.",
    howItWorks:
      "Takes the patient's history, symptoms, findings and results and produces a ranked differential diagnosis, with the reasoning and supporting evidence for each candidate. It also proposes the path to a diagnosis: which tests or referrals would confirm or rule out what. The clinician keeps the decision; the suggestions are advisory only.",
    keywords: ["diagnosis", "diagnose", "differential", "ddx", "rare disease", "symptoms", "which test"],
    pipeline: [
      {
        primitiveId: "corti-models",
        roleInPipeline: "Ranks the differential from history, symptoms, findings and results",
        clinicianOutcome: "Uncommon diagnoses considered early, not after several visits",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Explains the reasoning and proposes tests or referrals to confirm or rule out",
        clinicianOutcome: "Fewer unnecessary tests on the way to a diagnosis",
      },
    ],
    connectors: [EHR],
    trust: [review("The clinician keeps the decision; the suggestions are advisory only."), DEPLOY, TRACES],
  },
  {
    id: "documentation-check",
    name: "Documentation check against transcript",
    category: "Clinician-facing",
    short: "Notes checked against what was said",
    outcome:
      "Checks a clinical note against the transcript and against itself for unsupported, missing or mixed-up details, with the source shown for each finding.",
    whenToUse:
      "Notes can contain details that were never said, leave out things that were said, or mix up details like left and right. Clinicians sign notes under time pressure and rarely have time to check every line against the consultation.",
    howItWorks:
      "Takes the transcript and the note. Compares the note to the transcript and to itself, then lists each finding (unsupported, missing, inconsistent) with the source passage. The clinician decides what to change. The capability does not edit the note and does not make clinical judgments.",
    keywords: ["check", "verify", "note quality", "hallucination", "missing", "left right", "accuracy", "review note", "qa"],
    pipeline: [
      {
        primitiveId: "speech-to-text",
        roleInPipeline: "Provides the transcript of what was actually said",
        clinicianOutcome: "The consultation itself is the reference",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Compares note to transcript and to itself, listing each finding with its source",
        clinicianOutcome: "Unsupported, missing or mixed-up details caught before you sign",
      },
    ],
    connectors: [EHR],
    trust: [review("The clinician decides what to change. It does not edit the note and does not make clinical judgments."), DEPLOY, TRACES],
  },
  {
    id: "patient-at-a-glance",
    name: "Patient-at-a-glance / Timeline",
    category: "Clinician-facing",
    short: "The patient's story before you walk in",
    outcome:
      "Creates a summary of the patient based on all the information in the EHR. What clinicians want to see first depends on role and context.",
    whenToUse:
      "Before seeing a patient, the clinician digs through the record to reconstruct the story: what changed since last time, which results matter, what the other clinic did. The information exists but is scattered across notes, letters and results, and finding it costs minutes per patient.",
    howItWorks:
      "Pulls the patient's documents, notes, results and medications from the EHR and builds a summary: the history in order, what changed since the last visit, open items. Content and order follow the role and setting (GP visit vs. hospital admission). Every statement links back to its source in the record. It is a view for preparation, not a second copy of the record.",
    keywords: ["summary", "timeline", "at a glance", "overview", "prepare", "preparation", "history", "what changed", "pre-charting"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Pulls documents, notes, results and medications from the EHR",
        clinicianOutcome: "No more digging through the record before each patient",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Builds the timeline — what changed, open items — ordered for your role",
        clinicianOutcome: "Minutes saved per patient, every statement linked to its source",
      },
    ],
    connectors: [EHR],
    trust: [review("Every statement links back to its source. It is a view for preparation, not a second copy of the record."), DEPLOY, TRACES],
  },

  // ——————————————— Operations ———————————————
  {
    id: "health-monitoring",
    name: "Continuous Health Monitoring",
    category: "Operations",
    short: "Deterioration spotted in the data, not the call",
    outcome: "Continuous patient base monitoring and alerting based on health parameters analysis.",
    whenToUse:
      "Practices hold a steady stream of patient data (results, readings, notes), but nobody can watch all of it. Deterioration and overdue checks are noticed when the patient calls, not from the data, so avoidable problems surface late.",
    howItWorks:
      "An agent runs over the practice's patient data on a schedule and watches the parameters defined per condition (lab values, readings, overdue intervals). When a patient crosses a threshold or shows a worrying trend, it creates an alert with the values and the relevant context from the record. Alerts go to staff, who decide what to do; the capability does not contact patients.",
    keywords: ["monitoring", "monitor", "alert", "alerts", "deterioration", "threshold", "chronic", "lab values", "readings", "population"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Watches the parameters defined per condition across the patient base",
        clinicianOutcome: "Worrying trends caught before the patient calls",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Writes each alert with the values and context from the record",
        clinicianOutcome: "Staff see why the alert fired, at a glance",
      },
    ],
    connectors: [EHR],
    trust: [review("Alerts go to staff, who decide what to do; the capability does not contact patients."), DEPLOY, TRACES],
  },
  {
    id: "denial-management",
    name: "Denial management and appeals",
    category: "Operations",
    short: "Denied claims answered point by point",
    outcome:
      "When a claim is denied or an insurer disputes a bill, pulls together the patient record, coverage policy and prior documentation, and drafts the appeal for staff to review and send.",
    whenToUse:
      "Denied claims and insurer audits cost time and money, and many are never appealed because building the case means going through records, policies and earlier correspondence by hand.",
    howItWorks:
      "Takes the denied claim together with the coverage policy and the patient record. Finds the documentation behind the billed codes and works out what the payer is disputing. Drafts an appeal that answers the denial point by point, citing the record and the policy, and lists the supporting documents to attach. Staff review, edit and send; the capability does not submit anything itself.",
    keywords: ["denial", "denied", "appeal", "appeals", "insurer", "payer", "dispute", "claim", "audit", "rejected"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Gathers the claim, coverage policy and patient record and works out what's disputed",
        clinicianOutcome: "The case is built for you — no digging through correspondence",
      },
      {
        primitiveId: "medical-coding",
        roleInPipeline: "Finds the documentation behind each billed code",
        clinicianOutcome: "Every disputed code backed by the record",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Drafts the appeal point by point, citing record and policy",
        clinicianOutcome: "More denials appealed, with less staff time",
      },
    ],
    connectors: [EHR, { id: "connector-billing", name: "Billing / claims system", roleInPipeline: "The denied claim and payer correspondence" }],
    trust: [review("Staff review, edit and send; the capability does not submit anything itself."), DEPLOY, TRACES],
  },
  {
    id: "routines",
    name: "Routines",
    category: "Operations",
    short: "Scheduled sweeps that hand you a worklist",
    outcome:
      "Runs automatically on a schedule across a whole list of patients, and hands staff an actionable worklist (f.e. pending-results sweep, MDT prep), patient by patient.",
    whenToUse:
      "Many recurring jobs are the same check run over many patients (who is overdue for a review, whose results are still pending, who needs a recall). Today these sweeps are done by hand, irregularly, or not at all.",
    howItWorks:
      "An agent runs on a schedule (f.e. every morning) over a patient list or registry. For each patient it checks the record for the condition of the sweep (results still pending, review overdue) and writes a short case summary with the suggested next step. Patients end up on a worklist for staff, sorted by urgency. The agent does not contact patients; staff act on each item.",
    keywords: ["routine", "routines", "sweep", "worklist", "overdue", "recall", "pending results", "mdt", "registry", "schedule", "every morning"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Runs on a schedule over the patient list, checking each record for the sweep's condition",
        clinicianOutcome: "Recurring checks actually happen — every day, every patient",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Writes a short case summary and next step per patient",
        clinicianOutcome: "A worklist sorted by urgency, ready to act on",
      },
    ],
    connectors: [EHR],
    trust: [review("The agent does not contact patients; staff act on each item."), DEPLOY, TRACES],
  },
  {
    id: "scheduling-assistant",
    name: "Scheduling assistant",
    category: "Operations",
    short: "Calendars tuned to demand and no-shows",
    outcome: "Predictive scheduling for HCPs to optimize filling rate and activity split.",
    whenToUse:
      "Clinic calendars are balanced by hand: urgent cases wait while some slots go unused, and clinicians end up with the wrong mix of activity. Nobody has time to adjust the schedule to demand and no-show patterns, so filling rates stay below what they could be.",
    howItWorks:
      "Learns from the practice's booking history: demand per visit type, visit durations, no-show and cancellation rates. It recommends slot layouts and where to place which visit type, and predicts which bookings are likely to be cancelled. Staff decide what to adopt; existing appointments are not moved on their own.",
    keywords: ["scheduling", "schedule", "calendar", "slots", "no-show", "no show", "capacity", "filling rate", "utilization", "cancellation"],
    pipeline: [
      {
        primitiveId: "corti-models",
        roleInPipeline: "Learns demand, durations, no-show and cancellation patterns from booking history",
        clinicianOutcome: "Predicts which bookings are likely to be cancelled",
      },
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Recommends slot layouts and where to place each visit type",
        clinicianOutcome: "Fewer empty slots, shorter waits for urgent cases",
      },
    ],
    connectors: [{ id: "connector-scheduling", name: "Scheduling system", roleInPipeline: "Booking history and calendar" }],
    trust: [review("Staff decide what to adopt; existing appointments are not moved on their own."), DEPLOY, TRACES],
  },

  // ——————————————— Patient-facing ———————————————
  {
    id: "patient-triage",
    name: "Patient triage",
    category: "Patient-facing",
    short: "The right level of care, red flags escalated",
    outcome:
      "Assesses a patient's symptoms when they get in touch (phone, chat or app) and directs them to the right level of care, with clear escalation to a clinician on red flags.",
    whenToUse:
      "Patients contacting a clinic or helpline need to be directed to the right level of care quickly, and staff time for safe triage is limited. Getting it wrong in either direction is a patient safety and capacity problem.",
    howItWorks:
      "Takes what the patient reports on the call or in chat, transcribed if voice. Asks follow-up questions until enough is known, then maps the picture to a level of care with the reasoning shown. Red-flag answers escalate to a clinician immediately instead of going through the rest of the flow. The outcome is a recommendation for staff; the capability does not diagnose and does not turn anyone away.",
    keywords: ["triage", "urgent", "urgency", "symptoms", "level of care", "red flag", "helpline", "prioritize", "acute", "assess"],
    pipeline: [
      {
        primitiveId: "speech-to-text",
        roleInPipeline: "Transcribes what the patient reports on a call",
        clinicianOutcome: "Phone, chat or app — same triage",
      },
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Asks follow-ups and maps the picture to a level of care; red flags escalate immediately",
        clinicianOutcome: "Urgent cases reach a clinician first",
      },
      {
        primitiveId: "text-generation",
        roleInPipeline: "Writes the recommendation with the reasoning shown",
        clinicianOutcome: "Staff see why each patient was routed where",
      },
    ],
    connectors: [{ id: "connector-telephony", name: "Telephony / chat", roleInPipeline: "Where patients get in touch" }, EHR],
    trust: [review("The outcome is a recommendation for staff; it does not diagnose and does not turn anyone away. Red flags escalate immediately."), DEPLOY, TRACES],
  },

  // ——————————————— Platform (all users) ———————————————
  {
    id: "ai-chat",
    name: "AI Chat",
    category: "Platform (all users)",
    short: "One chat window for every product action",
    outcome: "Unified conversational interface with agentic capabilities covering all product actions.",
    whenToUse:
      "Every action lives in its own screen and menu: find a patient, write a document, book, bill. Time goes to navigating the product instead of doing the task, and features people do not know about go unused.",
    howItWorks:
      "A single chat window where the user says what they need. An agent plans the steps, calls the product actions behind them (pull up the patient, draft the document, book the slot) and shows the result for review. Sensitive or irreversible actions require explicit confirmation. It only calls actions the product already has; it is a new surface, not new functionality.",
    keywords: ["chat", "assistant", "copilot", "natural language", "navigate", "one place", "conversational", "ask"],
    pipeline: [
      {
        primitiveId: "agentic-framework",
        roleInPipeline: "Plans the steps and calls the product actions behind them",
        clinicianOutcome: "Say what you need instead of hunting through menus",
      },
      {
        primitiveId: "corti-models",
        roleInPipeline: "Understands the request and shows the result for review",
        clinicianOutcome: "Features you didn't know about get used",
      },
    ],
    connectors: [{ id: "connector-host", name: "Host product actions", roleInPipeline: "The only actions it can call" }],
    trust: [review("Sensitive or irreversible actions require explicit confirmation. It only calls actions the product already has."), DEPLOY, TRACES],
  },
];

/** Example goal chips on the "try it yourself" screen. */
export const EXAMPLE_GOALS: { goal: string; capabilityId: string }[] = [
  { goal: "Stop typing notes during my consultations", capabilityId: "ambient-scribe" },
  { goal: "Write discharge letters from the record", capabilityId: "document-generation" },
  { goal: "Catch coding mismatches before claims go out", capabilityId: "billing-assistant" },
  { goal: "Take routine calls off my reception desk", capabilityId: "phone-assistant" },
  { goal: "Collect patient history before the visit", capabilityId: "patient-intake" },
  { goal: "Catch medication conflicts between sources", capabilityId: "medication-reconciliation" },
];

/** The 10 shown in the library tree (see header comment for how they were chosen). */
export const FEATURED_IDS: string[] = [
  "ambient-scribe",
  "medical-dictation",
  "document-generation",
  "care-plan-assistant",
  "medical-knowledge-assistant",
  "medication-reconciliation",
  "billing-assistant",
  "phone-assistant",
  "patient-intake",
  "chat-with-record",
];
export const FEATURED_CAPABILITIES: Capability[] = FEATURED_IDS.map((id) => CAPABILITIES.find((c) => c.id === id)!).filter(Boolean);

/** Notion categories in display order. */
export const CATEGORIES = ["Clinician-facing", "Operations", "Patient-facing", "Platform (all users)"] as const;

export function getCapability(id: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.id === id);
}
