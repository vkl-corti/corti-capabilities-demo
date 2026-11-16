import type { Product } from "../types";

// ————————————————————————————————————————————————
// Where each capability's CTA leads.
//
// Products: capabilities that are a Corti product today. Their CTA sends
// the visitor straight to the product.
// Everything else: explained, broken down into primitives, and the CTA leads
// to the Advance program (build it with Corti, tailored to the customer).
//
// URLs verified on corti.ai 2026-11-16. Scribe and Dictation have no page of
// their own yet. Both sections live on /speech-to-text. There is no chat
// product page, so Chat points to the "user-facing assistants" section on
// /agentic-framework. There is no Advance program page either; /contact
// ("Talk to an AI expert") is the CTA target used across corti.ai. Swap the
// URLs here when the dedicated pages exist.
// ————————————————————————————————————————————————

export const PRODUCTS: Record<string, Product> = {
  scribe: {
    id: "scribe",
    name: "Scribe",
    pitch: "Ambient documentation: the note is ready when the visit ends.",
    href: "https://corti.ai/speech-to-text",
    cta: "Get started with Scribe",
  },
  dictation: {
    id: "dictation",
    name: "Dictation",
    pitch: "Real-time medical speech-to-text in any field.",
    href: "https://corti.ai/speech-to-text",
    cta: "Get started with Dictation",
  },
  coding: {
    id: "coding",
    name: "Coding",
    pitch: "ICD-10 and CPT codes with the evidence behind each one.",
    href: "https://corti.ai/medical-coding",
    cta: "Get started with Coding",
  },
  chat: {
    id: "chat",
    name: "Chat",
    pitch: "Ask clinical questions, get answers with the source shown.",
    href: "https://corti.ai/agentic-framework",
    cta: "Get started with Chat",
  },
};

export const PRODUCT_ORDER = ["scribe", "dictation", "coding", "chat"] as const;

export const ADVANCE_PROGRAM = {
  name: "Advance program",
  pitch:
    "Not an off-the-shelf product. We build it with you on the same primitives, shaped to your workflows, systems and rules.",
  href: "https://corti.ai/contact",
  cta: "Build it with us",
};
