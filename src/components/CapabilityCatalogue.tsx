import { useMemo, useState } from "react";
import { CATEGORIES, CUSTOM_CAPABILITIES, JOBS, JOB_ORDER, PRIMITIVES, PRODUCT_CAPABILITIES, getCapability } from "../data/capabilities";
import { PRODUCTS } from "../data/products";
import { recommend } from "../data/recommend";
import type { Capability, CapabilityCategory } from "../types";

// Capability-first landing body:
//   A. Products: use today, straight to the product.
//   B. For you: recommend() from what this visitor opened.
//   C. Build with us: every other capability, grouped by job, filterable by
//      user group. Each opens the detail, which boils it down to primitives.

interface Props {
  onOpen: (id: string) => void;
  history: string[];
  onClearHistory: () => void;
  role: CapabilityCategory | null;
  setRole: (r: CapabilityCategory | null) => void;
}

const FLOW_LABEL = { import: "Import", transform: "Transform", act: "Act" } as const;

export function CapabilityCatalogue({ onOpen, history, onClearHistory, role, setRole }: Props) {
  const [q, setQ] = useState("");

  const forYou = useMemo(() => (history.length ? recommend(history, { role, limit: 4 }) : []), [history, role]);
  const lastSeen = history.length ? getCapability(history[history.length - 1]) : undefined;

  const columns = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (c: Capability) =>
      (!role || c.category === role) &&
      (!needle ||
        [c.name, c.short, c.outcome, c.whenToUse, ...c.keywords, ...c.pipeline.map((p) => PRIMITIVES[p.primitiveId]?.name ?? "")]
          .join(" ")
          .toLowerCase()
          .includes(needle));
    return JOB_ORDER.map((job) => ({ job, caps: CUSTOM_CAPABILITIES.filter((c) => c.job === job && match(c)) }));
  }, [q, role]);
  const shown = columns.reduce((n, c) => n + c.caps.length, 0);

  return (
    <>
      {/* A — Products */}
      <section className="cd-rule px-8 py-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="cd-eyebrow mb-1">
              <span className="text-corti-text-tertiary">01 /</span> Use today
            </p>
            <h2 className="cd-h2">Corti products</h2>
          </div>
          <p className="max-w-[44ch] text-right text-[13px] text-corti-text-tertiary">
            Ready-made capabilities. Open one to see what it's built from, or go straight to the product.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PRODUCT_CAPABILITIES.map((c) => {
            const p = PRODUCTS[c.productId!];
            return (
              <div key={c.id} className="cd-card group flex flex-col gap-3 p-4 transition-colors hover:border-corti-accent/60">
                <button type="button" onClick={() => onOpen(c.id)} className="flex flex-1 flex-col gap-1 text-left">
                  <span className="cd-tag !text-corti-accent">Product</span>
                  <span className="font-sans text-[22px] font-heading leading-tight tracking-heading group-hover:text-corti-accent">
                    {p.name}
                  </span>
                  <span className="text-[13px] leading-snug text-corti-text-secondary">{p.pitch}</span>
                </button>
                <PrimChips cap={c} />
                <div className="flex items-center gap-3 border-t border-corti-border-faint pt-3">
                  <a href={p.href} target="_blank" rel="noreferrer" className="cd-btn-primary cd-btn-sm">
                    Open {p.name} ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpen(c.id)}
                    className="text-[12.5px] text-corti-text-tertiary underline decoration-dotted underline-offset-4 hover:text-corti-text-primary"
                  >
                    How it's built
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* B — For you (only once there is history) */}
      {forYou.length > 0 && (
        <section className="cd-rule cd-fade-up px-8 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="cd-eyebrow">
              For you{lastSeen && <span className="normal-case tracking-normal text-corti-text-tertiary"> · because you looked at {lastSeen.name}</span>}
            </p>
            <button
              type="button"
              onClick={onClearHistory}
              className="font-mono text-[11px] text-corti-text-tertiary underline decoration-dotted underline-offset-4 hover:text-corti-text-primary"
            >
              Reset history
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {forYou.map((r) => (
              <CapCard key={r.capability.id} cap={r.capability} onOpen={onOpen} note={r.reason} />
            ))}
          </div>
        </section>
      )}

      {/* C — Build with us */}
      <section id="catalogue" className="cd-rule px-8 py-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="cd-eyebrow mb-1">
              <span className="text-corti-text-tertiary">02 /</span> Build with us
            </p>
            <h2 className="cd-h2">
              {CUSTOM_CAPABILITIES.length} more capabilities{" "}
              <span className="text-corti-text-tertiary">from the same primitives</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {[null, ...CATEGORIES].map((r) => (
                <button
                  key={r ?? "all"}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-full border px-3 py-1 text-[12.5px] transition-colors ${
                    role === r
                      ? "border-corti-accent text-corti-accent"
                      : "border-corti-border-faint text-corti-text-secondary hover:border-corti-border-strong"
                  }`}
                >
                  {r ?? "Everyone"}
                </button>
              ))}
            </div>
            <input
              className="cd-input !h-8 w-[200px] !text-[13px]"
              placeholder="Filter…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {shown === 0 ? (
          <p className="text-[14px] text-corti-text-tertiary">No capability matches. Try “Tell us what you need” above.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {columns.map(({ job, caps }) => (
              <div key={job} className="min-w-0">
                <div className="mb-2 border-b border-corti-border-faint pb-2">
                  <p className="flex items-center justify-between">
                    <span className="font-sans text-[16px] font-medium">{JOBS[job].label}</span>
                    <span className="cd-tag normal-case" title="Design-team grouping: import / transform / act">
                      {FLOW_LABEL[JOBS[job].flow]} · {caps.length}
                    </span>
                  </p>
                  <p className="text-[12px] text-corti-text-tertiary">{JOBS[job].verb}</p>
                </div>
                <div className="space-y-1.5">
                  {caps.map((c) => (
                    <CapCard key={c.id} cap={c} onOpen={onOpen} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function CapCard({ cap, onOpen, note }: { cap: Capability; onOpen: (id: string) => void; note?: string }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(cap.id)}
      className="cd-card group flex w-full flex-col gap-1.5 px-3.5 py-2.5 text-left transition-colors hover:border-corti-border-strong hover:bg-corti-bg-secondary"
    >
      {note && <span className="cd-tag normal-case !text-corti-accent">{note}</span>}
      <span className="font-sans text-[14.5px] font-medium leading-tight group-hover:text-corti-accent">{cap.name}</span>
      <span className="text-[12.5px] leading-snug text-corti-text-tertiary">{cap.short}</span>
      <PrimChips cap={cap} small />
    </button>
  );
}

function PrimChips({ cap, small }: { cap: Capability; small?: boolean }) {
  return (
    <span className="flex flex-wrap gap-1">
      {cap.pipeline.map((s) => (
        <span
          key={s.primitiveId}
          className={`rounded-full border border-corti-border-faint font-mono text-corti-text-tertiary ${
            small ? "px-1.5 py-px text-[9.5px]" : "px-2 py-px text-[10.5px]"
          }`}
        >
          {PRIMITIVES[s.primitiveId]?.name ?? s.primitiveId}
        </span>
      ))}
    </span>
  );
}
