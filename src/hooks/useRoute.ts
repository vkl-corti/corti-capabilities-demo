import { useCallback, useEffect, useState } from "react";

// Minimal hash router — works on GitHub Pages without server rewrites.
//   #/        → tree (home)
//   #/day     → a day in the clinic
//   #/all     → all capabilities
//   #/try     → try it yourself (composer)

export type Route = "tree" | "day" | "all" | "try";
const ROUTES: Route[] = ["tree", "day", "all", "try"];

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return (ROUTES as string[]).includes(h) ? (h as Route) : "tree";
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const navigate = useCallback((r: Route) => {
    const hash = r === "tree" ? "#/" : `#/${r}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    setRoute(r);
    window.scrollTo({ top: 0 });
  }, []);

  return { route, navigate };
}
