import { useState } from "react";
import type { ComposeResult } from "../types";

export function UnderTheHood({ result }: { result: ComposeResult }) {
  const [open, setOpen] = useState(false);
  const t = result.trace;

  return (
    <div>
      <button type="button" className="cd-btn-ghost cd-btn-sm font-mono !text-[12px]" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} Under the hood
      </button>

      {open && (
        <div className="cd-card cd-fade-up mt-2 p-5 font-mono text-[12px] leading-relaxed">
          <div className="mb-3 flex flex-wrap gap-4">
            <span className="cd-tag">
              mode: <span className={t.mode === "real" ? "text-corti-accent" : ""}>{t.mode.toUpperCase()}</span>
            </span>
            <span className="cd-tag">agent: {t.agent}</span>
            <span className="cd-tag">duration: {t.durationMs}ms</span>
          </div>

          {t.fallbackReason && (
            <p className="mb-3 rounded-md border border-corti-error p-2 text-corti-error-light">
              fallback reason: {t.fallbackReason}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="cd-tag mb-1">REQUEST</p>
              <pre className="max-h-80 overflow-auto rounded-md border border-corti-border-faint bg-corti-bg-dark p-3 text-[11.5px] text-corti-text-secondary">
                {JSON.stringify(t.request, null, 2)}
              </pre>
            </div>
            <div>
              <p className="cd-tag mb-1">AGENT RESPONSE</p>
              <pre className="max-h-80 overflow-auto rounded-md border border-corti-border-faint bg-corti-bg-dark p-3 text-[11.5px] text-corti-text-secondary">
                {JSON.stringify(t.response, null, 2)}
              </pre>
            </div>
          </div>
          <p className="mt-4 font-sans text-[13px] text-corti-text-tertiary">
            The composer agent runs on the Corti Agentic Framework. It reads the goal and the
            capability taxonomy and picks the best match — the library graph and every primitive
            link are built from the grounded taxonomy in this app, never invented by the model.
          </p>
        </div>
      )}
    </div>
  );
}
