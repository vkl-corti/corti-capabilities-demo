// ————————————————————————————————————————————————
// "A day in the clinic" — inspiration view for clinicians.
//
// Each persona is an ordinary working day. Each moment is a situation they
// will recognise, told in their words, and the capability that helps right
// then. Capabilities are referenced by id only; name, track (product /
// build with us) and the primitives breakdown come from capabilities.ts.
//
// Edit freely: add a persona, reorder moments, swap capabilities. Unknown
// ids are skipped (and warned about in the console).
// ————————————————————————————————————————————————

export interface Moment {
  time: string;
  /** The situation, in the clinician's voice. */
  scene: string;
  capabilityId: string;
  /** What changes with Corti, one line. */
  withCorti: string;
}

export interface Persona {
  id: string;
  label: string;
  setting: string;
  moments: Moment[];
}

export const PERSONAS: Persona[] = [
  {
    id: "gp",
    label: "GP",
    setting: "A day in general practice",
    moments: [
      {
        time: "07:50",
        scene: "Forty new lab results came in overnight.",
        capabilityId: "results-review",
        withCorti: "One short summary per patient: trends, new abnormals and the source of each value.",
      },
      {
        time: "08:10",
        scene: "First patient in five minutes. You haven't seen her since spring.",
        capabilityId: "patient-at-a-glance",
        withCorti: "What changed since last time, on one screen, with every line linked to the record.",
      },
      {
        time: "08:15",
        scene: "She filled in the pre-visit questions on her phone last night.",
        capabilityId: "patient-intake",
        withCorti: "Her story arrives as a structured summary, so the visit starts with the history already taken.",
      },
      {
        time: "08:20",
        scene: "The consultation. You'd rather look at her than at the keyboard.",
        capabilityId: "ambient-scribe",
        withCorti: "The note is drafted by the time she stands up. You review it and sign.",
      },
      {
        time: "09:40",
        scene: "Your next patient arrives with a chatbot's diagnosis printed out.",
        capabilityId: "patient-ai-review",
        withCorti: "Every claim checked against his record, plus three talking points for the visit.",
      },
      {
        time: "11:05",
        scene: "Quick check: can this dose be used with reduced kidney function?",
        capabilityId: "medical-knowledge-assistant",
        withCorti: "A sourced answer from the guideline, without leaving the consultation.",
      },
      {
        time: "13:30",
        scene: "A sick note and an insurance questionnaire are waiting.",
        capabilityId: "form-autofill",
        withCorti: "Both forms pre-filled from the record, each field showing where it came from.",
      },
      {
        time: "17:20",
        scene: "Six unsigned notes and two letters stand between you and home.",
        capabilityId: "end-of-day",
        withCorti: "One list, sorted by urgency, each item ready to sign in a couple of clicks.",
      },
    ],
  },
  {
    id: "ward",
    label: "Hospital doctor",
    setting: "A day on the ward",
    moments: [
      {
        time: "07:30",
        scene: "Morning handover. Twenty-two patients and a night's worth of changes.",
        capabilityId: "shift-handover",
        withCorti: "A structured SBAR handover per patient, ordered by acuity, each item linked to its note.",
      },
      {
        time: "09:00",
        scene: "New admission. His GP letter, his wife and the old chart all disagree on his medication.",
        capabilityId: "medication-reconciliation",
        withCorti: "The conflicts listed line by line, ready to resolve with the patient.",
      },
      {
        time: "10:15",
        scene: "The CT report and the old op notes don't tell the same story.",
        capabilityId: "anatomy-overview",
        withCorti: "One overview of the altered anatomy, with disagreements flagged instead of guessed.",
      },
      {
        time: "12:00",
        scene: "Three discharges before two o'clock.",
        capabilityId: "document-generation",
        withCorti: "Discharge letters drafted from the record in the hospital's structure. You edit and sign.",
      },
      {
        time: "12:20",
        scene: "The patient going home needs to understand what changed.",
        capabilityId: "after-visit-summary",
        withCorti: "Plain-language instructions in her own language, approved by you before they're sent.",
      },
      {
        time: "14:30",
        scene: "You're dictating a procedure note into the EHR field.",
        capabilityId: "medical-dictation",
        withCorti: "Speech to text, live, in any field, with drug names and dosages right.",
      },
      {
        time: "18:45",
        scene: "Discharged patients need their diagnoses coded before the claim goes out.",
        capabilityId: "billing-assistant",
        withCorti: "Codes suggested from the documentation, and mismatches flagged before submission.",
      },
    ],
  },
  {
    id: "surgeon",
    label: "Surgeon",
    setting: "A day in surgery",
    moments: [
      {
        time: "07:00",
        scene: "Tumour board at seven. Fourteen patients on the agenda.",
        capabilityId: "mdt-prep",
        withCorti: "A one-page cited case summary per patient, with pending results and conflicts listed separately.",
      },
      {
        time: "08:15",
        scene: "Third laparotomy for this patient. Where are the anastomoses and the old mesh?",
        capabilityId: "anatomy-overview",
        withCorti: "The current anatomy by body region, every drain and line, linked to the op note that placed it.",
      },
      {
        time: "11:40",
        scene: "Out of theatre. The operative note still has to be written.",
        capabilityId: "medical-dictation",
        withCorti: "Dictate it straight into the note while it's fresh.",
      },
      {
        time: "13:00",
        scene: "Afternoon outpatient clinic.",
        capabilityId: "ambient-scribe",
        withCorti: "Ambient notes for every consultation, structured to the surgical template.",
      },
      {
        time: "15:30",
        scene: "A referral fax arrives, again without the imaging report.",
        capabilityId: "referral-intake",
        withCorti: "What's missing is spotted on arrival, and the request back to the referrer is already drafted.",
      },
      {
        time: "16:30",
        scene: "Your resident wants feedback on her clinic notes.",
        capabilityId: "trainee-feedback",
        withCorti: "Teaching feedback against the consultation. You review it before she sees it.",
      },
      {
        time: "17:10",
        scene: "The insurer wants a justification for the MRI.",
        capabilityId: "insurance-letters",
        withCorti: "The letter drafted from the record, every statement cited.",
      },
    ],
  },
  {
    id: "practice",
    label: "Practice team",
    setting: "A day at the front desk",
    moments: [
      {
        time: "07:45",
        scene: "The phones open and the line is already full.",
        capabilityId: "phone-assistant",
        withCorti: "Routine bookings, changes and reminders handled. Red flags come straight to you with a summary.",
      },
      {
        time: "08:00",
        scene: "Sixty emails and voicemails from overnight.",
        capabilityId: "inbox-assistant",
        withCorti: "All of them ranked by urgency, each with a drafted reply and the tasks pulled out.",
      },
      {
        time: "09:30",
        scene: "A stack of scanned letters and pasted lab results to file.",
        capabilityId: "document-import",
        withCorti: "Scans become editable text, and lab values go into the lab chart with H/L flags.",
      },
      {
        time: "10:30",
        scene: "Next week's calendar has gaps on Tuesday and a queue on Monday.",
        capabilityId: "scheduling-assistant",
        withCorti: "Slot layouts based on real demand and no-show patterns. You decide what to change.",
      },
      {
        time: "11:00",
        scene: "Who is overdue for their diabetes review?",
        capabilityId: "routines",
        withCorti: "A morning sweep over the registry that leaves a worklist sorted by urgency.",
      },
      {
        time: "14:00",
        scene: "Two home blood-pressure readings crossed the threshold this week.",
        capabilityId: "health-monitoring",
        withCorti: "An alert with the values and context, before the patient has to call.",
      },
      {
        time: "15:30",
        scene: "A claim came back denied.",
        capabilityId: "denial-management",
        withCorti: "The appeal drafted point by point from the record and the policy, ready to review.",
      },
    ],
  },
];
