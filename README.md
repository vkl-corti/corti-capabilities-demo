# Corti — Capability Composer demo

Opens on the **capability library**: the four primitives stacked on the left,
arrows to the ten capabilities they compose. Hover a primitive or capability
to trace its pipeline, click a capability to pin it. A **"Try it out
yourself"** CTA hands over to the composer: a clinician says what they want to
get done, a real Corti agent maps the goal to a capability, and the same tree
lights up the match with its pipeline detail.

Flips the corti.ai narrative: not "here are our primitives", but "here is
what they add up to for you".

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
- **One drop-in file.** `src/data/capabilities.ts` holds the taxonomy. When
  the real capability content arrives, replace its contents — components,
  prompt and agent are untouched. The agent prompt is regenerated from the
  file (`toAgentTaxonomy()`) and PATCHed onto the live agent at every run,
  so taxonomy edits propagate on restart.
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

Capabilities and primitives are synced from Corti's internal capability
database, last synced 2026-11-11. Name, category, one-liner, clinical problem, how it works and
primitives used come from Notion; pipeline-step wording and match keywords are
derived from "How it works".

All 21 Notion capabilities are in the data and the composer agent matches
against all of them. The library tree shows a featured 10
(`FEATURED_IDS`). The rest are under **"See all 21"** (graph header)
or **"All 21 capabilities"** (top bar) — a filterable list grouped by Notion
category. Picking one, or an agent match outside the 10, adds it to the tree
marked "From full list". Primitives are the five build blocks; Notion's
"Embedded Assistant" tag is a UI surface and is left out. To change the
selection or re-sync, edit `src/data/capabilities.ts` only.
