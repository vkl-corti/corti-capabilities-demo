import { INFO_SOURCES, JOBS, PRIMITIVES, getCapability } from "../data/capabilities";
import { ADVANCE_PROGRAM, PRODUCTS } from "../data/products";
import { CAPABILITIES } from "../data/capabilities";
import { similarity } from "../data/recommend";
import type { Capability, ComposeResult } from "../types";

// One capability, told in three beats:
//   1. The capability — the problem and how it works (from Notion).
//   2. Boiled down — the primitives it is built from and what each does here.
//   3. Next step — product → go use it; custom → build it with us (Advance).

interface Props {
  /** Present in the composer result view; absent when browsing. */
  result?: ComposeResult | null;
  capabilityId: string;
  onSelect?: (id: string) => void;
  onShowInMap?: (id: string) => void;
  /** Questionnaire answers that led here → "Why this fits you". */
  why?: string[];
}

export function DetailPanel({ result, capabilityId, onSelect, onShowInMap, why }: Props) {
  const cap = getCapability(capabilityId);
  if (!cap) return null;
  const insights = result?.response.nodeInsights ?? {};
  const isMatch = !!result && result.response.capabilityId === cap.id;
  const product = cap.productId ? PRODUCTS[cap.productId] : undefined;
  const job = JOBS[cap.job];

  return (
    <aside key={cap.id} className="cd-card cd-fade-up flex flex-col overflow-hidden">
      {/* 1 — The capability */}
      <div className="border-b border-corti-border-faint p-5">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <TrackBadge cap={cap} />
          <span className="cd-tag">{cap.category}</span>
          <span className="cd-tag">· {job.label}</span>
          {isMatch && <span className="cd-tag !text-corti-accent">· Best match</span>}
        </div>
        <h2 className="cd-h2 mb-2">{cap.name}</h2>
        <p className="text-[14px] leading-relaxed text-corti-text-secondary">{cap.outcome}</p>
        {why && why.length > 0 && (
          <div className="mt-4 rounded-md border border-corti-accent/30 bg-[#121510] px-3.5 py-2.5">
            <p className="cd-tag mb-1 !text-corti-accent">Why this fits you</p>
            <p className="text-[13px] leading-relaxed text-corti-text-primary">
              Because {why.join(" and ")}.
            </p>
          </div>
        )}
      </div>

      <div className="border-b border-corti-border-faint p-5">
        <p className="cd-tag mb-2">The problem</p>
        <p className="mb-4 text-[13.5px] leading-relaxed text-corti-text-secondary">{cap.whenToUse}</p>
        <p className="cd-tag mb-2">How it works</p>
        <p className="mb-4 text-[13.5px] leading-relaxed text-corti-text-secondary">{cap.howItWorks}</p>
        <p className="cd-tag mb-2">Works from</p>
        <div className="flex flex-wrap gap-1">
          {cap.inputs.map((i) => (
            <span key={i} className="rounded-full border border-corti-border-faint px-2 py-px text-[12px] text-corti-text-secondary">
              {INFO_SOURCES[i]}
            </span>
          ))}
        </div>
      </div>

      {/* 2 — Boiled down */}
      <div className="border-b border-corti-border-faint p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="cd-tag">
            Boiled down · {cap.pipeline.length} primitive{cap.pipeline.length > 1 ? "s" : ""}
          </p>
          {onShowInMap && (
            <button
              type="button"
              onClick={() => onShowInMap(cap.id)}
              className="font-mono text-[11px] text-corti-text-tertiary underline decoration-dotted underline-offset-4 hover:text-corti-accent"
            >
              See it in the tree →
            </button>
          )}
        </div>
        <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-corti-border-tree">
          {cap.pipeline.map((step, i) => {
            const prim = PRIMITIVES[step.primitiveId];
            return (
              <li key={step.primitiveId} className="relative grid grid-cols-[24px_1fr] gap-3">
                <span className="z-10 flex h-6 w-6 items-center justify-center rounded-full border border-corti-accent/60 bg-corti-bg-card font-mono text-[10px] text-corti-accent">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <a href={prim?.href} target="_blank" rel="noreferrer" className="text-[14px] font-medium hover:text-corti-accent">
                    {prim?.name ?? step.primitiveId} <span className="text-corti-text-tertiary">↗</span>
                  </a>
                  <p className="text-[13px] leading-snug text-corti-text-secondary">{step.roleInPipeline}</p>
                  <p className="mt-1 text-[13px] leading-snug text-corti-text-primary">
                    <span className="text-corti-accent">→</span> {step.clinicianOutcome}
                  </p>
                  {insights[step.primitiveId] && (
                    <p className="mt-1 text-[12px] italic leading-snug text-corti-text-tertiary">For your goal: {insights[step.primitiveId]}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 grid grid-cols-2 gap-5">
          <div>
            <p className="cd-tag mb-1.5">Connects to</p>
            <ul className="space-y-0.5 text-[12.5px]">
              {cap.connectors.map((c) => (
                <li key={c.id} title={c.roleInPipeline} className="text-corti-text-secondary">
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="cd-tag mb-1.5">Trust layer</p>
            <ul className="space-y-0.5 text-[12.5px]">
              {cap.trust.map((t) => (
                <li key={t.id} title={t.roleInPipeline} className="text-corti-text-secondary">
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3 — Next step */}
      {product ? (
        <div className="bg-[#121510] p-5">
          <p className="cd-tag mb-2 !text-corti-accent">Available today · Corti {product.name}</p>
          <p className="mb-4 text-[14px] leading-relaxed text-corti-text-primary">{product.pitch}</p>
          <a href={product.href} target="_blank" rel="noreferrer" className="cd-btn-primary inline-flex">
            {product.cta} →
          </a>
        </div>
      ) : (
        <CustomCta cap={cap} onSelect={onSelect} />
      )}
    </aside>
  );
}

/** Custom capability → Advance program, plus the product(s) it shares blocks with as a way in today. */
function CustomCta({ cap, onSelect }: { cap: Capability; onSelect?: (id: string) => void }) {
  const startWith = CAPABILITIES.filter((c) => c.track === "product")
    .map((c) => ({ c, s: similarity(cap, c).score }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map((x) => x.c);
  return (
    <div className="bg-[#121510] p-5">
      <p className="cd-tag mb-2 !text-corti-accent">Build it with us · {ADVANCE_PROGRAM.name}</p>
      <p className="mb-4 text-[14px] leading-relaxed text-corti-text-primary">{ADVANCE_PROGRAM.pitch}</p>
      <a
        href={`${ADVANCE_PROGRAM.href}?capability=${encodeURIComponent(cap.id)}`}
        target="_blank"
        rel="noreferrer"
        className="cd-btn-primary inline-flex"
      >
        {ADVANCE_PROGRAM.cta} →
      </a>
      {startWith.length > 0 && onSelect && (
        <p className="mt-4 text-[12.5px] leading-relaxed text-corti-text-tertiary">
          Shares building blocks with{" "}
          {startWith.map((p, i) => (
            <span key={p.id}>
              {i > 0 && " and "}
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className="text-corti-text-secondary underline decoration-dotted underline-offset-4 hover:text-corti-accent"
              >
                {PRODUCTS[p.productId!].name}
              </button>
            </span>
          ))}
          , which you can use today.
        </p>
      )}
    </div>
  );
}

export function TrackBadge({ cap }: { cap: Capability }) {
  return cap.track === "product" ? (
    <span className="rounded-xs bg-corti-accent px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase tracking-mono text-black">
      Product
    </span>
  ) : (
    <span className="rounded-xs border border-corti-border-tree px-1.5 py-px font-mono text-[9.5px] uppercase tracking-mono text-corti-text-secondary">
      Build with us
    </span>
  );
}
