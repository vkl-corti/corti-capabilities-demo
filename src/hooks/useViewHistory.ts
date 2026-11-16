import { useCallback, useState } from "react";

// Capabilities the visitor has opened, most recent last. Stored in
// localStorage so "For you" survives a reload. In production this would
// come from product analytics / CRM; recommend() doesn't care where.

const KEY = "corti-capability-history";
const MAX = 12;

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function useViewHistory() {
  const [history, setHistory] = useState<string[]>(load);

  const record = useCallback((id: string) => {
    setHistory((prev) => {
      const next = [...prev.filter((x) => x !== id), id].slice(-MAX);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* private mode — keep in memory only */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { history, record, clear };
}
