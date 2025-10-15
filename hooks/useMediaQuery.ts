import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (
      typeof globalThis.window === "undefined" ||
      !globalThis.window.matchMedia
    ) {
      return;
    }

    const m = globalThis.window.matchMedia(query);
    setMatches(m.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
