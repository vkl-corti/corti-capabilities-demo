import { useMemo, useState } from "react";
import { CAPABILITIES, CATEGORIES, JOBS, JOB_ORDER, PRIMITIVES } from "../data/capabilities";
import type { Capability, CapabilityCategory } from "../types";

// The complete list: every capability, grouped, in priority order. Products
// are marked inline (they lead their group). Click opens the detail drawer.

interface Props {
  onOpen: (id: string) => void;
}

export function AllPage({ onOpen }: Props) {
  const [role, setRole] = useState<CapabilityCategory | null>(null);
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (c: Capability) =>
      (!role || c.category === role) &&
      (!needle ||
        [c.name, c.short, c.outcome, c.whenToUse, ...c.keywords, ...c.pipeline.map((p) => PRIMITIVES[p.primitiveId]?.name ?? "")]
          .join(" ")
          .toLowerCase()
          .includes(needle));
    return JOB_ORDER.map((job) => ({ job, caps: CAPABILITIES.filter((c) => c.job === job && match(c)) })).filter((g) => g.caps.length);
  }, [q, role]);

  const shown = groups.reduce((n, g) => n + g.caps.length, 0);
  const filtered = shown !== CAPABILITIES.length;

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-[1040px]">
        <p className="cd-eyebrow mb-3">All capabilities</p>
        <h1 className="cd-h1 mb-2">Everything Corti can do</h1>
        <p className="mb-8 text-[14px] text-corti-text-tertiary">
          {filtered ? `Showing ${shown} of ${CAPABILITIES.length} capabilities` : `${CAPABILITIES.length} capabilities`}
        </p>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-corti-border-faint pb-4">
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-corti-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="rounded-xs border border-corti-accent/50 px-1 font-mono text-[9px] uppercase text-corti-accent">Product</span>
              Available today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="rounded-xs border border-corti-border-tree px-1 font-mono text-[9px] uppercase text-corti-text-secondary">
                Build with us
              </span>
              Developed together with you
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {[null, ...CATEGORIES].map((r) => (
              <button
                key={r ?? "all"}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-full border px-3 py-1 text-[12.5px] transition-colors ${
                  role === r ? "border-corti-accent text-corti-accent" : "border-corti-border-faint text-corti-text-secondary hover:border-corti-border-strong"
                }`}
              >
                {r ?? "Everyone"}
              </button>
            ))}
            <input className="cd-input !h-8 w-[180px] !text-[13px]" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {groups.length === 0 && <p className="text-[14px] text-corti-text-tertiary">Nothing matches. Try another word.</p>}
        <div className="space-y-10">
          {groups.map(({ job, caps }) => (
            <section key={job} className="grid gap-x-8 gap-y-3 md:grid-cols-[200px_minmax(0,1fr)]">
              <div>
                <h2 className="font-sans text-[18px] font-medium">
                  {JOBS[job].label} <span className="ml-1 font-mono text-[12px] text-corti-text-tertiary">{caps.length}</span>
                </h2>
                <p className="text-[12.5px] leading-snug text-corti-text-tertiary">{JOBS[job].verb}</p>
              </div>
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {caps.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(c.id)}
                      className="group flex w-full items-baseline justify-between gap-3 border-b border-corti-border-faint py-2.5 text-left"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[14.5px] font-medium group-hover:text-corti-accent">{c.name}</span>
                          {c.track === "product" && (
                            <span className="rounded-xs border border-corti-accent/50 px-1 font-mono text-[9px] uppercase text-corti-accent">Product</span>
                          )}
                        </span>
                        <span className="block text-[12.5px] text-corti-text-tertiary">{c.short}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[12px] text-corti-text-tertiary group-hover:text-corti-accent">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
