import { useEffect, useMemo, useRef, useState } from "react";
import { CAPABILITIES, CATEGORIES, FEATURED_IDS, PRIMITIVES } from "../data/capabilities";

// Full capability list (all Notion rows), grouped by category. Picking one
// closes the panel and shows it in the tree + detail panel.

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (capId: string) => void;
}

export function AllCapabilities({ open, onClose, onSelect }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Latest onClose without re-running the open/close effect (parent passes an inline arrow).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (c: (typeof CAPABILITIES)[number]) =>
      !needle ||
      [c.name, c.outcome, c.whenToUse, ...c.keywords, ...c.pipeline.map((p) => PRIMITIVES[p.primitiveId]?.name ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    return CATEGORIES.map((cat) => ({ cat, caps: CAPABILITIES.filter((c) => c.category === cat && match(c)) })).filter(
      (g) => g.caps.length > 0,
    );
  }, [q]);

  if (!open) return null;
  const shown = groups.reduce((n, g) => n + g.caps.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="All capabilities">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="cd-fade-up relative flex h-full w-full max-w-[720px] flex-col border-l border-corti-border-faint bg-corti-bg-primary">
        {/* Header */}
        <div className="border-b border-corti-border-faint px-8 pb-5 pt-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="cd-eyebrow mb-2">Capability library</p>
              <h2 className="cd-h2">All {CAPABILITIES.length} capabilities</h2>
              <p className="mt-1 text-[13.5px] text-corti-text-tertiary">
                {FEATURED_IDS.length} are in the tree. Pick any capability to see how it’s built.
              </p>
            </div>
            <button type="button" className="cd-btn-ghost cd-btn-sm font-mono !text-[12px]" onClick={onClose}>
              Esc ✕
            </button>
          </div>
          <input
            ref={inputRef}
            className="cd-input !h-10 w-full !text-[14px]"
            placeholder="Filter by name, problem or primitive…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-8 py-5">
          {shown === 0 && <p className="text-[14px] text-corti-text-tertiary">No capability matches “{q}”.</p>}
          {groups.map(({ cat, caps }) => (
            <section key={cat} className="mb-6 last:mb-0">
              <p className="cd-tag mb-2 flex items-center justify-between">
                <span>{cat}</span>
                <span className="normal-case">{caps.length}</span>
              </p>
              <ul className="space-y-1.5">
                {caps.map((c) => {
                  const featured = FEATURED_IDS.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        className="cd-card group grid w-full grid-cols-[1fr_auto] items-start gap-x-4 gap-y-1.5 px-4 py-3 text-left transition-colors hover:border-corti-border-strong hover:bg-corti-bg-secondary"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="font-sans text-[15px] font-medium leading-tight group-hover:text-corti-accent">
                              {c.name}
                            </span>
                            {featured && (
                              <span className="rounded-xs border border-corti-accent/50 px-1 py-px font-mono text-[9.5px] uppercase tracking-mono text-corti-accent">
                                In tree
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-[13px] leading-snug text-corti-text-secondary">{c.outcome}</span>
                        </span>
                        <span className="pt-0.5 font-mono text-[12px] text-corti-text-tertiary group-hover:text-corti-text-primary">
                          →
                        </span>
                        <span className="col-span-2 flex flex-wrap gap-1">
                          {c.pipeline.map((s) => (
                            <span
                              key={s.primitiveId}
                              className="rounded-full border border-corti-border-faint px-2 py-px font-mono text-[10.5px] text-corti-text-tertiary"
                            >
                              {PRIMITIVES[s.primitiveId]?.name ?? s.primitiveId}
                            </span>
                          ))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
