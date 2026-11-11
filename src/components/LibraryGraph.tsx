import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CAPABILITIES, FEATURED_IDS, PRIMITIVES, getCapability } from "../data/capabilities";
import type { Capability, ComposerResponse } from "../types";

// Library diagram: the four primitives stacked on the left, every capability
// on the right, arrows from each primitive to the capabilities built from it.
//
// Layout is plain CSS grid/flex — the SVG edges are computed from the REAL
// rendered positions of the cards (measured relative to the container) and
// re-measured on any resize, font load or content change. So the arrows stay
// attached whatever the surrounding layout does (side panel open, window
// resized, projector resolution…). No hard-coded pixel coordinates.

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Geometry {
  w: number;
  h: number;
  prims: Record<string, Rect>;
  caps: Record<string, Rect>;
}

interface Props {
  /** Pinned highlight (agent match or user click). Hover previews override it. */
  highlightedCapId: string | null;
  /** The composer agent's pick — gets the BEST MATCH badge. */
  matchedCapId?: string | null;
  insights?: Record<string, string>;
  onSelectCapability: (capId: string) => void;
  /** Non-featured capabilities to add to the tree (picked from the full list, or matched by the agent). */
  extraCapIds?: (string | null | undefined)[];
  /** Opens the full capability list. */
  onShowAll?: () => void;
}

const PRIM_IDS = Object.keys(PRIMITIVES);
const ARROW = 7;

/** Order capabilities by the mean position of their primitives → fewer crossings. */
function orderCaps(caps: Capability[]): Capability[] {
  return caps
    .map((c, i) => ({
      c,
      i,
      b: c.pipeline.reduce((s, p) => s + PRIM_IDS.indexOf(p.primitiveId), 0) / Math.max(1, c.pipeline.length),
    }))
    .sort((a, b) => a.b - b.b || a.i - b.i)
    .map((x) => x.c);
}

const NO_INSIGHTS: Record<string, string> = {};

export function LibraryGraph({
  highlightedCapId,
  matchedCapId,
  insights = NO_INSIGHTS,
  onSelectCapability,
  extraCapIds,
  onShowAll,
}: Props) {
  // Featured 10 + any extras → the nodes in the tree.
  const extraKey = (extraCapIds ?? []).filter(Boolean).join(",");
  const orderedCaps = useMemo(() => {
    const ids = [...FEATURED_IDS];
    for (const id of extraKey ? extraKey.split(",") : []) if (!ids.includes(id) && getCapability(id)) ids.push(id);
    return orderCaps(ids.map((id) => getCapability(id)!));
  }, [extraKey]);
  const capNumber = useMemo(
    () => new Map(orderedCaps.map((c, i) => [c.id, String(i + 1).padStart(2, "0")])),
    [orderedCaps],
  );
  const capsRef = useRef(orderedCaps);
  capsRef.current = orderedCaps;

  const containerRef = useRef<HTMLDivElement>(null);
  const primRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const capRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [hoverCap, setHoverCap] = useState<string | null>(null);
  const [hoverPrim, setHoverPrim] = useState<string | null>(null);

  // ——— Measure real DOM positions ———
  const measure = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const base = c.getBoundingClientRect();
    const rel = (el: Element): Rect => {
      const r = el.getBoundingClientRect();
      return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    };
    const prims: Record<string, Rect> = {};
    const caps: Record<string, Rect> = {};
    for (const id of PRIM_IDS) {
      const el = primRefs.current[id];
      if (el) prims[id] = rel(el);
    }
    for (const cap of capsRef.current) {
      const el = capRefs.current[cap.id];
      if (el) caps[cap.id] = rel(el);
    }
    const next: Geometry = { w: base.width, h: base.height, prims, caps };
    // Skip no-op updates so ResizeObserver callbacks never cause render churn.
    setGeo((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (containerRef.current) ro.observe(containerRef.current);
    Object.values(primRefs.current).forEach((el) => el && ro.observe(el));
    Object.values(capRefs.current).forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, orderedCaps]);

  // Content that can change card heights → re-measure after paint.
  useLayoutEffect(() => {
    measure();
  }, [measure, highlightedCapId, matchedCapId, insights]);

  // ——— Highlight state ———
  const activeCap = hoverCap ?? (hoverPrim ? null : highlightedCapId);
  const activeCapObj = activeCap ? getCapability(activeCap) : undefined;
  const anyActive = activeCap != null || hoverPrim != null;

  const capIsHi = (capId: string) =>
    capId === activeCap ||
    (hoverPrim != null && !!getCapability(capId)?.pipeline.some((s) => s.primitiveId === hoverPrim));
  const primIsHi = (primId: string) =>
    primId === hoverPrim || !!activeCapObj?.pipeline.some((s) => s.primitiveId === primId);
  const edgeIsHi = (from: string, to: string) =>
    activeCap != null ? to === activeCap : hoverPrim != null ? from === hoverPrim : false;

  // ——— Edges, with fanned ports so lines never stack on top of each other ———
  const edges = useMemo(() => {
    if (!geo) return [];
    const raw: { from: string; to: string; step: number }[] = [];
    for (const cap of orderedCaps) {
      cap.pipeline.forEach((s, step) => {
        if (geo.prims[s.primitiveId] && geo.caps[cap.id]) raw.push({ from: s.primitiveId, to: cap.id, step });
      });
    }
    const cy = (r: Rect) => r.y + r.h / 2;

    // Source ports: spread over the primitive's right edge, ordered by target y.
    const outPort = new Map<string, number>();
    for (const pid of PRIM_IDS) {
      const out = raw.filter((e) => e.from === pid).sort((a, b) => cy(geo.caps[a.to]) - cy(geo.caps[b.to]));
      const r = geo.prims[pid];
      if (!r) continue;
      const span = Math.min(r.h * 0.6, out.length * 9);
      out.forEach((e, i) => {
        const t = out.length === 1 ? 0.5 : i / (out.length - 1);
        outPort.set(`${e.from}->${e.to}`, cy(r) - span / 2 + t * span);
      });
    }
    // Target ports: spread over the capability's left edge, ordered by source y.
    const inPort = new Map<string, number>();
    for (const cap of orderedCaps) {
      const inc = raw.filter((e) => e.to === cap.id).sort((a, b) => cy(geo.prims[a.from]) - cy(geo.prims[b.from]));
      const r = geo.caps[cap.id];
      if (!r) continue;
      const span = Math.min(r.h * 0.5, (inc.length - 1) * 7);
      inc.forEach((e, i) => {
        const t = inc.length === 1 ? 0.5 : i / (inc.length - 1);
        inPort.set(`${e.from}->${e.to}`, cy(r) - span / 2 + t * span);
      });
    }

    return raw.map((e, i) => {
      const p = geo.prims[e.from];
      const c = geo.caps[e.to];
      const id = `${e.from}->${e.to}`;
      const x1 = p.x + p.w;
      const y1 = outPort.get(id)!;
      const x2 = c.x - ARROW;
      const y2 = inPort.get(id)!;
      const dx = Math.max(24, (x2 - x1) * 0.5);
      return {
        ...e,
        id,
        i,
        d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`,
      };
    });
  }, [geo, orderedCaps]);

  return (
    <div ref={containerRef} className="relative">
      {/* Column headers */}
      <div className="mb-3 grid grid-cols-[minmax(210px,260px)_minmax(72px,1fr)_minmax(280px,1.5fr)] items-end">
        <p className="cd-eyebrow">
          <span className="text-corti-text-tertiary">A /</span> Primitives
        </p>
        <span />
        <p className="cd-eyebrow flex items-center justify-between">
          <span>
            <span className="text-corti-text-tertiary">B /</span> What they build
          </span>
          <span className="flex items-center gap-3">
            <span className="cd-tag normal-case">
              {orderedCaps.length} of {CAPABILITIES.length}
            </span>
            {onShowAll && (
              <button
                type="button"
                onClick={onShowAll}
                className="font-mono text-[11px] normal-case tracking-normal text-corti-text-primary underline decoration-dotted underline-offset-4 hover:text-corti-accent"
              >
                See all {CAPABILITIES.length} →
              </button>
            )}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-[minmax(210px,260px)_minmax(72px,1fr)_minmax(280px,1.5fr)]">
        {/* Primitives — stretched to the full height of the capability column */}
        <div className="flex flex-col justify-between gap-3">
          {PRIM_IDS.map((id, idx) => {
            const p = PRIMITIVES[id];
            const hi = primIsHi(id);
            const dim = anyActive && !hi;
            const uses = orderedCaps.filter((c) => c.pipeline.some((s) => s.primitiveId === id)).length;
            return (
              <div
                key={id}
                ref={(el) => {
                  primRefs.current[id] = el;
                }}
                onMouseEnter={() => setHoverPrim(id)}
                onMouseLeave={() => setHoverPrim(null)}
                className={`cd-card relative z-10 flex flex-col gap-1 px-4 py-3 transition-[opacity,border-color,background-color] duration-200 ${
                  hi ? "!border-corti-accent/70 bg-[#121510]" : ""
                }`}
                style={{ opacity: dim ? 0.4 : 1 }}
              >
                <div className="flex items-center justify-between">
                  <span className={`cd-tag ${hi ? "!text-corti-accent" : ""}`}>
                    {String(idx + 1).padStart(2, "0")} · Primitive
                  </span>
                  <span className="cd-tag normal-case" title={`Used by ${uses} capabilities`}>
                    → {uses}
                  </span>
                </div>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit font-sans text-[17px] font-heading leading-tight tracking-[-0.01em] hover:text-corti-accent"
                  title={`${p.name} on corti.ai`}
                >
                  {p.name} <span className="text-[12px] text-corti-text-tertiary">↗</span>
                </a>
                <p className="line-clamp-2 text-[13px] leading-snug text-corti-text-secondary">{p.what}</p>
              </div>
            );
          })}
        </div>

        {/* Edge gutter (the SVG overlays the whole grid) */}
        <div aria-hidden />

        {/* Capabilities — spread to the same height as the primitive column so both end level */}
        <div className="flex flex-col justify-between gap-1.5">
          {orderedCaps.map((c) => {
            const hi = capIsHi(c.id);
            const dim = anyActive && !hi;
            const isMatch = matchedCapId === c.id;
            const pinned = highlightedCapId === c.id;
            const insight = insights[c.id];
            return (
              <button
                key={c.id}
                ref={(el) => {
                  capRefs.current[c.id] = el;
                }}
                type="button"
                onMouseEnter={() => setHoverCap(c.id)}
                onMouseLeave={() => setHoverCap(null)}
                onClick={() => onSelectCapability(c.id)}
                className={`cd-card relative z-10 grid grid-cols-[28px_1fr_auto] items-center gap-x-3 px-3.5 py-2 text-left transition-[opacity,border-color,background-color] duration-200 hover:bg-corti-bg-secondary ${
                  hi ? "!border-corti-accent/70" : ""
                } ${pinned ? "bg-[#121510]" : ""}`}
                style={{ opacity: dim ? 0.35 : 1 }}
              >
                <span className={`font-mono text-[11px] ${hi ? "text-corti-accent" : "text-corti-text-tertiary"}`}>
                  {capNumber.get(c.id)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-sans text-[15px] font-medium leading-tight" title={c.name}>
                    {c.name}
                  </span>
                  <span className="block truncate text-[12.5px] leading-snug text-corti-text-tertiary">
                    {insight ?? c.short}
                  </span>
                </span>
                <span className="flex gap-1" aria-label={`${c.pipeline.length} primitives`}>
                  {c.pipeline.map((s) => (
                    <span
                      key={s.primitiveId}
                      className={`h-1.5 w-1.5 rounded-full ${hi ? "bg-corti-accent" : "bg-corti-border-tree"}`}
                    />
                  ))}
                </span>
                {!FEATURED_IDS.includes(c.id) && !isMatch && (
                  <span className="absolute -top-2 right-3 rounded-xs border border-corti-border-tree bg-corti-bg-primary px-1.5 py-px font-mono text-[9.5px] uppercase tracking-mono text-corti-text-secondary">
                    From full list
                  </span>
                )}
                {isMatch && (
                  <span className="absolute -top-2 right-3 rounded-xs bg-corti-accent px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase tracking-mono text-black">
                    Best match
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Edges — absolutely positioned over the measured layout */}
      {geo && (
        <svg
          className="pointer-events-none absolute inset-0 z-0 overflow-visible"
          width={geo.w}
          height={geo.h}
          aria-hidden
        >
          <defs>
            <marker id="cd-arrow" viewBox="0 0 10 10" refX="1" refY="5" markerWidth={ARROW} markerHeight={ARROW} markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#3b3e43" />
            </marker>
            <marker id="cd-arrow-hi" viewBox="0 0 10 10" refX="1" refY="5" markerWidth={ARROW} markerHeight={ARROW} markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#b8f818" />
            </marker>
          </defs>
          {edges.map((e) => {
            const hi = edgeIsHi(e.from, e.to);
            return (
              <path
                key={e.id}
                d={e.d}
                fill="none"
                stroke={hi ? "#b8f818" : "#3b3e43"}
                strokeWidth={hi ? 1.75 : 1.25}
                opacity={anyActive && !hi ? 0.22 : hi ? 0.55 : 0.9}
                markerEnd={hi ? "url(#cd-arrow-hi)" : "url(#cd-arrow)"}
                pathLength={1}
                strokeDasharray={1}
                style={{
                  ["--len" as string]: 1,
                  animation: `cd-draw 700ms cubic-bezier(0.3,0.6,0.2,1) ${120 + e.i * 22}ms both`,
                  transition: "opacity 200ms, stroke 200ms",
                }}
              />
            );
          })}
          {/* Flowing overlay on highlighted edges: "data moves through the pipeline" */}
          {edges
            .filter((e) => edgeIsHi(e.from, e.to))
            .map((e) => (
              <path key={`flow-${e.id}`} d={e.d} fill="none" stroke="#b8f818" strokeWidth={2} className="cd-edge-flow" />
            ))}
        </svg>
      )}
    </div>
  );
}

/** Shown above the graph after a compose run: the agent's pick. */
export function ComposeBanner({ response, goal }: { response: ComposerResponse; goal: string }) {
  const cap = CAPABILITIES.find((c) => c.id === response.capabilityId);
  const alt = response.alternativeId ? CAPABILITIES.find((c) => c.id === response.alternativeId) : undefined;
  return (
    <div className="cd-fade-up grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        <p className="cd-eyebrow mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-corti-accent" />
          You asked: <span className="normal-case tracking-normal text-corti-text-primary">“{goal}”</span>
        </p>
        <h1 className="cd-h1 mb-3">{response.clinicianFraming || cap?.name}</h1>
        <p className="cd-lede max-w-3xl">{response.rationale}</p>
      </div>
      <div className="flex flex-col items-start gap-1 lg:items-end">
        <span className="cd-tag">Composer confidence</span>
        <span className="font-sans text-[40px] font-heading leading-none tracking-heading text-corti-accent">
          {Math.round(response.confidence * 100)}%
        </span>
        {alt && <span className="cd-tag normal-case">Runner-up: {alt.name}</span>}
      </div>
    </div>
  );
}
