import { useMemo, useState } from "react";
import { getCapability } from "../data/capabilities";
import { PERSONAS } from "../data/day";
import { ADVANCE_PROGRAM, PRODUCTS } from "../data/products";
import type { Capability } from "../types";
import { TrackBadge } from "./DetailPanel";

// "A day in the clinic": inspiration for clinicians. Pick who you are and
// walk through an ordinary day, with the capability that helps at each
// moment. Click a moment to open the full capability (breakdown + CTA).

interface Props {
  onOpen: (id: string) => void;
  onTree: () => void;
}

export function DayPage({ onOpen, onTree }: Props) {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const persona = PERSONAS.find((p) => p.id === personaId)!;

  const moments = useMemo(
    () =>
      persona.moments
        .map((m) => ({ ...m, cap: getCapability(m.capabilityId) }))
        .filter((m): m is typeof m & { cap: Capability } => {
          if (!m.cap) console.warn(`[day] unknown capability "${m.capabilityId}" in ${persona.id}`);
          return !!m.cap;
        }),
    [persona],
  );
  const products = [...new Set(moments.filter((m) => m.cap.track === "product").map((m) => m.cap.productId!))];
  const customCount = new Set(moments.filter((m) => m.cap.track === "custom").map((m) => m.cap.id)).size;

  return (
    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Who are you? */}
      <aside className="border-b border-corti-border-faint px-8 py-8 lg:border-b-0 lg:border-r">
        <div className="lg:sticky lg:top-24">
          <p className="cd-eyebrow mb-4">I am a…</p>
          <ul className="space-y-1">
            {PERSONAS.map((p) => {
              const on = p.id === personaId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setPersonaId(p.id)}
                    className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                      on ? "border-corti-accent/60 bg-[#121510]" : "border-transparent hover:bg-corti-bg-card"
                    }`}
                  >
                    <span className={`block text-[16px] font-medium ${on ? "text-corti-accent" : ""}`}>{p.label}</span>
                    <span className="block text-[12.5px] text-corti-text-tertiary">{p.setting}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* The day */}
      <section className="px-8 py-8 lg:px-12">
        <div key={persona.id} className="cd-fade-up mx-auto max-w-[760px]">
          <p className="cd-eyebrow mb-3">{persona.setting}</p>
          <h1 className="cd-h1 mb-3">Where Corti fits in your day</h1>
          <p className="cd-lede mb-10 max-w-[56ch]">
            Ordinary moments from {persona.setting.charAt(0).toLowerCase() + persona.setting.slice(1)}, and what changes at each one. Click a moment to see how it's built.
          </p>

          <ol className="relative">
            {moments.map((m, i) => (
              <li key={`${m.time}-${m.capabilityId}`} className="grid grid-cols-[56px_24px_minmax(0,1fr)] gap-x-3">
                <span className="pt-[3px] font-mono text-[13px] text-corti-text-tertiary">{m.time}</span>
                <span className="relative flex justify-center">
                  <span className="z-10 mt-[7px] h-2.5 w-2.5 rounded-full border border-corti-accent bg-corti-bg-primary" />
                  {i < moments.length - 1 && <span className="absolute bottom-0 top-[18px] w-px bg-corti-border-tree" />}
                </span>
                <button
                  type="button"
                  onClick={() => onOpen(m.cap.id)}
                  className="group mb-7 rounded-lg text-left"
                >
                  <p className="mb-3 font-sans text-[19px] leading-snug tracking-[-0.01em] text-corti-text-primary">{m.scene}</p>
                  <div className="cd-card px-4 py-3 transition-colors group-hover:border-corti-accent/60 group-hover:bg-[#121510]">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-medium group-hover:text-corti-accent">{m.cap.name}</span>
                      <TrackBadge cap={m.cap} />
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-corti-text-secondary">{m.withCorti}</p>
                  </div>
                </button>
              </li>
            ))}
          </ol>

          {/* Wrap-up */}
          <div className="mt-4 grid gap-4 rounded-lg border border-corti-border-faint p-6 sm:grid-cols-2">
            <div>
              <p className="cd-tag mb-2 !text-corti-accent">Use today</p>
              {products.length ? (
                <div className="flex flex-wrap gap-2">
                  {products.map((pid) => (
                    <a key={pid} href={PRODUCTS[pid].href} target="_blank" rel="noreferrer" className="cd-btn-primary cd-btn-sm">
                      {PRODUCTS[pid].name} ↗
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-corti-text-tertiary">No ready-made product in this day.</p>
              )}
            </div>
            <div>
              <p className="cd-tag mb-2">Build with us · {customCount} in this day</p>
              <a
                href={`${ADVANCE_PROGRAM.href}?persona=${persona.id}`}
                target="_blank"
                rel="noreferrer"
                className="cd-btn-ghost cd-btn-sm"
              >
                {ADVANCE_PROGRAM.cta} →
              </a>
            </div>
            <p className="text-[12.5px] text-corti-text-tertiary sm:col-span-2">
              All of these are built from the same five primitives.{" "}
              <button
                type="button"
                onClick={onTree}
                className="text-corti-text-secondary underline decoration-dotted underline-offset-4 hover:text-corti-accent"
              >
                See the tree
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
