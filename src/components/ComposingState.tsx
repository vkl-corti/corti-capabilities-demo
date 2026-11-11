import { useEffect, useState } from "react";

const LINES = [
  "reading your goal",
  "loading capability taxonomy",
  "composer agent: matching outcome",
  "composing pipeline",
  "checking guardrails",
];

export function ComposingState({ goal }: { goal: string }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible((v) => (v >= LINES.length ? v : v + 1));
    }, 260);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="cd-dotted flex min-h-[calc(100vh-112px)] items-center px-8 py-16">
      <div className="cd-card cd-fade-up mx-auto w-full max-w-lg p-6">
        <p className="cd-eyebrow mb-3 flex items-center gap-2">
          <span className="cd-pulse h-1.5 w-1.5 rounded-full bg-corti-accent" /> Composing
        </p>
        <p className="mb-5 font-sans text-[20px] font-heading leading-snug tracking-[-0.01em]">“{goal}”</p>
        <div className="space-y-1.5 border-t border-corti-border-faint pt-4 font-mono text-[12.5px]">
          {LINES.map((l, i) => (
            <p
              key={l}
              className={`flex items-center gap-2 transition-opacity duration-200 ${
                i < visible ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className={i < visible - 1 ? "text-corti-accent" : "text-corti-text-tertiary"}>
                {i < visible - 1 ? "✓" : "›"}
              </span>
              <span className="text-corti-text-secondary">{l}</span>
              {i === visible - 1 && <span className="cd-caret h-3.5 w-[2px] bg-corti-accent" />}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
