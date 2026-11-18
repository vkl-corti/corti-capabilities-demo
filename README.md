# Corti — Capabilities demo

Three pages, one taxonomy (hash routes, so it works on GitHub Pages):

| Page | Route | For |
| --- | --- | --- |
| **Capability tree** (home) | `#/` | Capabilities (left) → the building blocks they are composed from (right). Select one to read it, see what it is built from and where it leads. Lenses: **Highlights** (top of the priority list) or one group: Documentation, Intake & data, Drafting, Quality & safety, Insight & search, Automation. |
| **All capabilities** | `#/all` | The full list: products first, then everything else by group, in priority order. Filter by user group or search. Linked from the home page. |
| **Get recommendations** | `#/try` | Four short questions (role, where time is spent unnecessarily, situations that apply, main objective) for clinicians, care organisations, health-tech teams or anyone exploring a build, all statements to react to, no ideas needed. Ends in a list of up to 8 recommendations for inspiration, split into "Available today" and "Build with us", each showing what it does, what it is built from and its own CTA, plus the tree of how they are built. Questions and scoring in `src/data/questionnaire.ts`. Free text with the live Corti agent stays available as an alternative. |

Every capability ends in one of two next steps:
- **Product** (Scribe, Dictation, Coding, Chat): available today, go straight to the product.
- **Build with us**: developed together through the **Advance program**; explained and boiled down to primitives, with a CTA to get in touch.

## Run it

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default http://localhost:5173). Without
credentials it runs fully in **MOCK** mode — keyword matching over the same
taxonomy — and the tree looks identical to LIVE mode.

## What's real vs. mocked

| Part | Status |
| --- | --- |
| App, tree rendering/animation, detail panel | **Real** (browser) |
| `composeCapability(goal)` — composer agent mapping goal → capability | **Real** via Corti Agentic Framework when `.env` credentials are present; keyword-matching mock as automatic fallback |
| Capability taxonomy, primitives, corti.ai links | **Grounded data** (`src/data/capabilities.ts`) — the agent picks from it, never invents it |
| Clinical goals | Fictional example chips / free text |

The footer badge shows **Corti API: LIVE** (real calls) or **Corti API: MOCK**
(offline heuristics so the demo never breaks).

## Enabling the real API

```bash
cp .env.example .env
# fill in CORTI_CLIENT_ID, CORTI_CLIENT_SECRET, CORTI_TENANT (and
# CORTI_ENVIRONMENT=eu|us), then restart: npm run dev
```

Credentials come from the Corti Console (API client with access to the
Agentic Framework). Without them, the demo runs in mock mode automatically.

## Architecture

- **The agent picks, the frontend composes.** The composer agent
  (`capabilities-demo-composer-v1`) returns a small ID-bearing response:
  `capabilityId`, restated goal, rationale, framing headline, confidence,
  optional alternative and per-node insights. The tree is built in the
  browser from `src/data/capabilities.ts` — so corti.ai URLs and pipeline
  copy are never hallucinated, and mock and LIVE trees are identical.
- **Two data files.** `notion-snapshot.json` (Notion, verbatim) plus
  `capabilities.ts` (editorial layer), with CTA targets in `products.ts`.
  Components, prompt and agent are untouched by taxonomy changes. The agent
  prompt is regenerated from the data (`toAgentTaxonomy()`, now including
  track and job) and PATCHed onto the live agent at every run.
- **Vite plugin backend** (`server/cortiAgentServer.ts`) holds the OAuth
  client-credentials in `.env`, creates/reuses the agent by name
  (persistent lifecycle, schema connector set at creation), and serves
  `POST /api/corti/compose` + `GET /api/corti/status`.

## Design

Matches corti.ai's design language (extracted from their production CSS):
dark `#08090a`, 80rem page shell with hairline rails, lime `#b8f818` used
only as accent, Booton (self-hosted, `public/fonts`) for headings/body at
weight 550 / -0.03em, IBM Plex Mono uppercase eyebrows, 8px-radius buttons
(white primary). Tokens in `tailwind.config.js` (`corti.*`) and
`src/index.css` (`.cd-*`).

The library diagram (`LibraryGraph.tsx`) lays out with CSS grid and draws its
SVG edges from the **measured** card positions (ResizeObserver), so arrows
stay attached through any layout change. Capabilities are auto-ordered by the
mean position of their primitives to minimise crossings.

## Source of truth

`src/data/notion-snapshot.json` is a verbatim copy of the public-safe fields
of Corti's capability database (name, category, one-liner, clinical problem,
how it works, primitives used, backlog), synced 2026-11-16. Internal notes and
competitor columns are deliberately **not** copied, because the site is public.

`src/data/capabilities.ts` adds a small editorial layer per Notion row
(tagline, job, inputs, per-primitive pipeline wording, connectors,
review rule, product link). On load it warns in the console when:
- a Notion row has no editorial entry (it is skipped), or
- Notion's "Primitives used" ≠ the pipeline's primitives.

Excluded: rows ticked **Backlog** (Care Plan Assistant, Diagnosis assistant,
Patient triage), and **AI review trail**, which is a trust-layer item on
every capability instead of a card (as its Notion note suggests).

Re-sync = re-export the snapshot, then fill any warnings.

## Products vs. build-with-us

`src/data/products.ts` is the only place CTA targets live.

| Product | Notion capability | Link (verified 2026-11-16) |
| --- | --- | --- |
| Scribe | Ambient scribe | corti.ai/speech-to-text (no dedicated page yet) |
| Dictation | Medical dictation | corti.ai/speech-to-text (no dedicated page yet) |
| Coding | Billing Assistant | corti.ai/medical-coding |
| Chat | Medical Knowledge Assistant | corti.ai/agentic-framework (no chat page yet) |
| Advance program | all other capabilities | corti.ai/contact?capability=<id> (no program page yet) |

## Structuring capabilities programmatically (for design)

Each capability carries facets that are data, not copy:

| Facet | Values | Use |
| --- | --- | --- |
| `track` | product · custom | Which CTA: go to the product, or build it with us |
| `job` | document · intake · write · check · understand · automate | Primary grouping (the lenses and the All page) |
| `JOBS[job].flow` | import · transform · act | The import/transform split, derived from the job |
| `inputs` | conversation, voice, record, documents, messages, patient, rules, schedule | Filters and similarity |
| `category` | Clinician-facing · Operations · Patient-facing (Notion) | Role filter |
| `pipeline` | primitives | The boil-down, and similarity |

Import vs. transform works as a derived flag, not as the main axis: some
capabilities fit neither side (the "act" ones: phone, inbox, routines,
monitoring), and many do both (Scribe imports a conversation *and*
transforms it into a note). Grouping by the primary job keeps every
capability in one group, and import/transform stays filterable on top.

`src/data/recommend.ts` exports `recommend(history, { role, track, limit })`.
It is pure and deterministic, scoring by shared primitives (rare ones
weighted higher), same job, shared inputs and same user group. With no
history it puts products first. The demo feeds it from localStorage
(`useViewHistory`) and shows it as "Suggested for you" on the tree and "Related" in the detail drawer. In production, pass any history source (analytics, CRM,
product usage); the function doesn't care.

## Prioritisation

`PRIORITY` in `src/data/capabilities.ts` is one ordered list of capability ids.
It sets the order everywhere (tree, groups, All page) and its first
`HIGHLIGHT_COUNT` entries are the Highlights. Rubric, in order of weight:
available today as a product; extends the documentation core (Scribe,
Dictation) or Coding; proven market demand; differentiation; breadth across
clinicians, operations and patients. To re-prioritise, move an id up or down.
The console warns if an id is missing from the list or unknown.
