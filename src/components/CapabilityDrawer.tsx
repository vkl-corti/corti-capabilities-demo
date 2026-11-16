import { useEffect, useRef } from "react";
import { getCapability } from "../data/capabilities";
import { recommend } from "../data/recommend";
import { DetailPanel, TrackBadge } from "./DetailPanel";

// Slide-over with the full capability detail, plus "related" picks computed
// from the taxonomy (same primitives / job / inputs / user group).

interface Props {
  capabilityId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onShowInMap: (id: string) => void;
}

export function CapabilityDrawer({ capabilityId, onClose, onSelect, onShowInMap }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const scrollRef = useRef<HTMLDivElement>(null);
  const open = !!capabilityId;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [capabilityId]);

  if (!capabilityId || !getCapability(capabilityId)) return null;
  const related = recommend([capabilityId], { limit: 3 });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Capability detail">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="cd-fade-up relative flex h-full w-full max-w-[560px] flex-col border-l border-corti-border-faint bg-corti-bg-primary">
        <div className="flex items-center justify-between border-b border-corti-border-faint px-6 py-3">
          <p className="cd-eyebrow">Capability</p>
          <button type="button" className="cd-btn-ghost cd-btn-sm font-mono !text-[12px]" onClick={onClose}>
            Esc ✕
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          <DetailPanel capabilityId={capabilityId} onSelect={onSelect} onShowInMap={onShowInMap} />
          {related.length > 0 && (
            <div className="mt-5">
              <p className="cd-tag mb-2">Related</p>
              <ul className="space-y-1.5">
                {related.map((r) => (
                  <li key={r.capability.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(r.capability.id)}
                      className="cd-card group grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-left hover:border-corti-border-strong"
                    >
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium group-hover:text-corti-accent">{r.capability.name}</span>
                        <span className="block text-[12px] text-corti-text-tertiary">{r.reason}</span>
                      </span>
                      <TrackBadge cap={r.capability} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
