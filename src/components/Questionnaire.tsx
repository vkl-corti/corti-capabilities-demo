import { useEffect, useMemo, useState } from "react";
import { QUESTIONS, scoreAnswers, type Answers } from "../data/questionnaire";
import { ADVANCE_PROGRAM, PRODUCTS } from "../data/products";
import { DetailPanel } from "./DetailPanel";
import { LibraryGraph } from "./LibraryGraph";

// Guided recommendations: four quick steps of statements to react to,
// then the visitor's own tree, ranked, with why each one was picked.

interface Props {
  /** Switch to free-text + AI composer. */
  onFreeText: () => void;
  /** Called once with the top picks (feeds history / recommendations). */
  onResult: (ids: string[]) => void;
}

export function Questionnaire({ onFreeText, onResult }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const done = step >= QUESTIONS.length;

  if (done) return <Result answers={answers} onEdit={() => setStep(0)} onRestart={() => {
          setAnswers({});
          setStep(0);
        }} onResult={onResult} />;

  const q = QUESTIONS[step];
  const picked = answers[q.id] ?? [];
  const canNext = q.multi ? q.id === "situations" || picked.length > 0 : picked.length === 1;

  const toggle = (id: string) => {
    if (!q.multi) {
      setAnswers((a) => ({ ...a, [q.id]: [id] }));
      setTimeout(() => setStep((s) => s + 1), 180); // auto-advance on single choice
      return;
    }
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      if (cur.includes(id)) return { ...a, [q.id]: cur.filter((x) => x !== id) };
      if (q.max && cur.length >= q.max) return a;
      return { ...a, [q.id]: [...cur, id] };
    });
  };

  return (
    <section className="cd-dotted flex min-h-[calc(100vh-112px)] items-start px-8 py-14">
      <div key={q.id} className="cd-fade-up mx-auto w-full max-w-[780px]">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-3">
          {QUESTIONS.map((x, i) => (
            <span key={x.id} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-corti-accent" : "bg-corti-border-faint"}`} />
          ))}
          <span className="cd-tag ml-2 shrink-0">
            {step + 1} / {QUESTIONS.length}
          </span>
        </div>

        <h1 className="cd-h1 mb-2">{q.title}</h1>
        <p className="cd-lede mb-8">{q.subtitle}</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {q.options.map((o) => {
            const on = picked.includes(o.id);
            const full = !!q.max && picked.length >= q.max && !on;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                disabled={full}
                className={`group flex items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
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
                  <span className={`block text-[15.5px] leading-snug ${on ? "text-corti-text-primary" : "text-corti-text-secondary group-hover:text-corti-text-primary"}`}>
                    {o.label}
                  </span>
                  {o.hint && <span className="block text-[12.5px] text-corti-text-tertiary">{o.hint}</span>}
                </span>
              </button>
            );
          })}
        </div>

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

function Result({
  answers,
  onEdit,
  onRestart,
  onResult,
}: {
  answers: Answers;
  onEdit: () => void;
  onRestart: () => void;
  onResult: (ids: string[]) => void;
}) {
  const matches = useMemo(() => scoreAnswers(answers, 6), [answers]);
  const ids = matches.map((m) => m.capability.id);
  const [selected, setSelected] = useState<string | null>(ids[0] ?? null);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (idsKey) onResult(idsKey.split(",").slice(0, 3));
    window.scrollTo({ top: 0 });
  }, [idsKey, onResult]);

  const answerChips = QUESTIONS.flatMap((q) => (answers[q.id] ?? []).map((id) => q.options.find((o) => o.id === id)?.label ?? id));
  const productIds = [...new Set(matches.filter((m) => m.capability.track === "product").map((m) => m.capability.productId!))];
  const custom = matches.filter((m) => m.capability.track === "custom");
  const why = matches.find((m) => m.capability.id === selected)?.because;

  if (!matches.length) {
    return (
      <section className="px-8 py-16 text-center">
        <p className="cd-lede mb-4">Please answer a few more questions so we can recommend capabilities.</p>
        <button type="button" className="cd-btn-primary" onClick={onRestart}>
          Start again
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="cd-rule px-8 py-8">
        <div className="cd-fade-up flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="cd-eyebrow mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-corti-accent" /> Your recommendations
            </p>
            <h1 className="cd-h1 mb-3">Where Corti can help</h1>
            <div className="flex max-w-[820px] flex-wrap gap-1.5">
              {answerChips.map((c) => (
                <span key={c} className="rounded-full border border-corti-border-faint px-2.5 py-0.5 text-[12px] text-corti-text-tertiary">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="cd-btn-ghost cd-btn-sm" onClick={onEdit}>
              Change answers
            </button>
            <button type="button" className="cd-btn-ghost cd-btn-sm" onClick={onRestart}>
              Start over
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <LibraryGraph
            baseIds={ids}
            keepOrder
            highlightedCapId={selected}
            matchedCapId={ids[0]}
            onSelectCapability={setSelected}
            extraCapIds={[selected]}
          />
          {/* Next steps */}
          <div className="mt-8 grid gap-4 rounded-lg border border-corti-border-faint p-6 sm:grid-cols-2">
            <div>
              <p className="cd-tag mb-2 !text-corti-accent">Start today</p>
              {productIds.length ? (
                <div className="flex flex-wrap gap-2">
                  {productIds.map((pid) => (
                    <a key={pid} href={PRODUCTS[pid].href} target="_blank" rel="noreferrer" className="cd-btn-primary cd-btn-sm">
                      {PRODUCTS[pid].cta} ↗
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed text-corti-text-tertiary">
                  None of these is an off-the-shelf product yet. All are built on the same primitives.
                </p>
              )}
            </div>
            <div>
              <p className="cd-tag mb-2">Build the rest with us · {custom.length}</p>
              <p className="mb-3 text-[13px] leading-relaxed text-corti-text-secondary">{ADVANCE_PROGRAM.pitch}</p>
              <a
                href={`${ADVANCE_PROGRAM.href}?capabilities=${encodeURIComponent(custom.map((m) => m.capability.id).join(","))}`}
                target="_blank"
                rel="noreferrer"
                className="cd-btn-ghost cd-btn-sm"
              >
                {ADVANCE_PROGRAM.cta} →
              </a>
            </div>
          </div>
        </div>
        <div className="xl:pt-[30px]">{selected && <DetailPanel capabilityId={selected} onSelect={setSelected} why={why} />}</div>
      </section>
    </>
  );
}
