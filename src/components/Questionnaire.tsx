import { useEffect, useMemo, useState } from "react";
import { QUESTIONS, questionCopy, roleOf, scoreAnswers, visibleOptions, type Answers, type Option } from "../data/questionnaire";
import { ADVANCE_PROGRAM, PRODUCTS } from "../data/products";
import { DetailPanel } from "./DetailPanel";
import { LibraryGraph } from "./LibraryGraph";

// "Match to your priorities": four quick steps of statements to react to,
// shaped by the role picked in step 1, then the visitor's own capability map
// (same layout as the home page) with their next steps beside it.

interface Props {
  /** Switch to free-text + AI composer. */
  onFreeText: () => void;
  /** Called once with the top picks (feeds history / recommendations). */
  onResult: (ids: string[]) => void;
}

export function Questionnaire({ onFreeText, onResult }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  if (step >= QUESTIONS.length) {
    return (
      <Result
        answers={answers}
        onEdit={() => setStep(0)}
        onResult={onResult}
      />
    );
  }

  const q = QUESTIONS[step];
  const role = roleOf(answers);
  const { title, subtitle } = questionCopy(q, role);
  const options = visibleOptions(q, role);
  const picked = (answers[q.id] ?? []).filter((id) => options.some((o) => o.id === id));
  const canNext = q.multi ? q.id === "situations" || picked.length > 0 : picked.length === 1;

  const toggle = (id: string) => {
    if (!q.multi) {
      // A new role resets later answers: the options differ per role.
      setAnswers((a) => (q.id === "role" && a.role?.[0] !== id ? { role: [id] } : { ...a, [q.id]: [id] }));
      setTimeout(() => setStep((s) => s + 1), 180); // auto-advance on single choice
      return;
    }
    setAnswers((a) => {
      const cur = (a[q.id] ?? []).filter((x) => options.some((o) => o.id === x));
      if (cur.includes(id)) return { ...a, [q.id]: cur.filter((x) => x !== id) };
      if (q.max && cur.length >= q.max) return a;
      return { ...a, [q.id]: [...cur, id] };
    });
  };

  // Questions with headings (situations) list their options per group, three columns wide.
  const sections = q.groups
    ? q.groups.map((group) => ({ group, opts: options.filter((o) => o.group === group) })).filter((s) => s.opts.length > 0)
    : [{ group: "", opts: options }];

  const renderOption = (o: Option) => {
    const on = picked.includes(o.id);
    const full = !!q.max && picked.length >= q.max && !on;
    return (
      <button
        key={o.id}
        type="button"
        onClick={() => toggle(o.id)}
        disabled={full}
        className={`group flex items-start gap-3 rounded-lg border px-4 text-left transition-colors ${q.groups ? "py-3" : "py-3.5"} ${
          on
            ? "border-corti-accent bg-[#121510]"
            : full
              ? "border-corti-border-faint opacity-40"
              : "border-corti-border-faint bg-corti-bg-card hover:border-corti-border-strong"
        }`}
      >
        <span
          className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] ${q.multi ? "rounded-[4px]" : "rounded-full"} ${
            on ? "border-corti-accent bg-corti-accent text-black" : "border-corti-border-tree"
          }`}
        >
          {on && "✓"}
        </span>
        <span>
          <span
            className={`block leading-snug ${q.groups ? "text-[14.5px]" : "text-[15.5px]"} ${
              on ? "text-corti-text-primary" : "text-corti-text-secondary group-hover:text-corti-text-primary"
            }`}
          >
            {o.label}
          </span>
          {o.hint && <span className="block text-[12.5px] text-corti-text-tertiary">{o.hint}</span>}
        </span>
      </button>
    );
  };

  return (
    <section className="cd-dotted flex min-h-[calc(100vh-112px)] items-start px-8 py-12">
      <div key={q.id} className={`cd-fade-up mx-auto w-full ${q.groups ? "max-w-[1060px]" : "max-w-[780px]"}`}>
        {/* Progress, labelled */}
        <ol className="mb-8 grid grid-cols-4 gap-3">
          {QUESTIONS.map((x, i) => (
            <li key={x.id}>
              <span className={`block h-1 rounded-full ${i <= step ? "bg-corti-accent" : "bg-corti-border-faint"}`} />
              <span className={`mt-2 block font-mono text-[11px] uppercase tracking-mono ${i === step ? "text-corti-text-primary" : "text-corti-text-tertiary"}`}>
                {i + 1} · {x.short}
              </span>
            </li>
          ))}
        </ol>

        <h1 className="cd-h1 mb-2">{title}</h1>
        <p className="cd-lede mb-8">{subtitle}</p>

        {sections.map(({ group, opts }) => (
          <div key={group || "all"} className={group ? "mb-5 last:mb-0" : ""}>
            {group && <p className="cd-tag mb-2">{group}</p>}
            <div className={`grid gap-2.5 sm:grid-cols-2 ${group ? "lg:grid-cols-3" : ""}`}>{opts.map(renderOption)}</div>
          </div>
        ))}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            className="cd-btn-ghost cd-btn-sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{ visibility: step === 0 ? "hidden" : "visible" }}
          >
            ← Back
          </button>
          {q.multi && (
            <button type="button" className="cd-btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              {q.id === "situations" && picked.length === 0 ? "None of these →" : "Next →"}
            </button>
          )}
        </div>

        <p className="mt-12 text-center text-[13px] text-corti-text-tertiary">
          Already know what you are looking for?{" "}
          <button type="button" onClick={onFreeText} className="text-corti-text-secondary underline decoration-dotted underline-offset-4 hover:text-corti-accent">
            Describe it in your own words
          </button>{" "}
          and a Corti agent will find the right capability.
        </p>
      </div>
    </section>
  );
}

function Result({ answers, onEdit, onResult }: { answers: Answers; onEdit: () => void; onResult: (ids: string[]) => void }) {
  const matches = useMemo(() => scoreAnswers(answers, 8), [answers]);
  const ids = matches.map((m) => m.capability.id);
  const idsKey = ids.join(",");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (idsKey) onResult(idsKey.split(",").slice(0, 3));
    window.scrollTo({ top: 0 });
  }, [idsKey, onResult]);

  if (!matches.length) {
    return (
      <section className="px-8 py-16 text-center">
        <p className="cd-lede mb-4">Please answer a few more questions so we can match capabilities to your priorities.</p>
        <button type="button" className="cd-btn-primary" onClick={onEdit}>
          Change answers
        </button>
      </section>
    );
  }

  const productIds = [...new Set(matches.filter((m) => m.capability.track === "product").map((m) => m.capability.productId!))];
  const custom = matches.filter((m) => m.capability.track === "custom");

  return (
    <>
      <section className="cd-rule flex flex-wrap items-end justify-between gap-6 px-8 py-7">
        <div className="cd-fade-up">
          <p className="cd-eyebrow mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-corti-accent" /> Matched to your priorities
          </p>
          <h1 className="cd-h1 mb-3 !text-[36px] xl:!text-[40px]">Your capability map</h1>
          <p className="cd-lede max-w-[62ch]">
            Capabilities matched to your role and priorities. Select any capability to see what it does, what it is built from,
            and whether you can use it today or build it with us.
          </p>
        </div>
        <button type="button" className="cd-btn-ghost" onClick={onEdit}>
          Change answers
        </button>
      </section>

      <section className="px-8 pb-10 pt-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <LibraryGraph
              baseIds={ids}
              keepOrder
              highlightedCapId={selected}
              extraCapIds={[selected]}
              onSelectCapability={(id) => setSelected(selected === id ? null : id)}
            />
          </div>
          <div className="xl:pt-[30px]">
            {selected ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mb-3 font-mono text-[11px] text-corti-text-tertiary underline decoration-dotted underline-offset-4 hover:text-corti-text-primary"
                >
                  ← Your next steps
                </button>
                <DetailPanel capabilityId={selected} onSelect={setSelected} />
              </>
            ) : (
              <div className="cd-card cd-fade-up flex flex-col overflow-hidden">
                <div className="border-b border-corti-border-faint p-5">
                  <p className="cd-eyebrow mb-2">Your next steps</p>
                  <p className="text-[14px] leading-relaxed text-corti-text-secondary">
                    Select a capability in the map to see what it does and what it is built from.
                  </p>
                </div>
                {productIds.length > 0 && (
                  <div className="border-b border-corti-border-faint p-5">
                    <p className="cd-tag mb-3 !text-corti-accent">Available today</p>
                    <div className="flex flex-wrap gap-2">
                      {productIds.map((pid) => (
                        <a key={pid} href={PRODUCTS[pid].href} target="_blank" rel="noreferrer" className="cd-btn-primary cd-btn-sm">
                          {PRODUCTS[pid].cta} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {custom.length > 0 && (
                  <div className="bg-[#121510] p-5">
                    <p className="cd-tag mb-2">Build with us · {custom.length} in your map</p>
                    <p className="mb-4 text-[13.5px] leading-relaxed text-corti-text-primary">{ADVANCE_PROGRAM.pitch}</p>
                    <a
                      href={`${ADVANCE_PROGRAM.href}?capabilities=${encodeURIComponent(custom.map((m) => m.capability.id).join(","))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="cd-btn-ghost cd-btn-sm"
                    >
                      Explore these with us →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
