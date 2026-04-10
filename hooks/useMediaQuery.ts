import { useEffect, useEffectEvent, useState } from "react";

const getMediaQueryList = (query: string): MediaQueryList | null => {
  if (
    typeof globalThis.window === "undefined" ||
    typeof globalThis.window.matchMedia !== "function"
  ) {
    return null;
  }

  return globalThis.window.matchMedia(query);
};

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const syncMatches = useEffectEvent((nextMatches: boolean) => {
    setMatches((currentMatches) =>
      currentMatches === nextMatches ? currentMatches : nextMatches
    );
  });

  useEffect(() => {
    const mediaQueryList = getMediaQueryList(query);
    if (!mediaQueryList) {
      return;
    }

    syncMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncMatches(event.matches);
    };

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }

    const previousOnChange = mediaQueryList.onchange;
    const fallbackHandler: NonNullable<MediaQueryList["onchange"]> = (
      event
    ) => {
      previousOnChange?.call(mediaQueryList, event);
      syncMatches(mediaQueryList.matches);
    };

    mediaQueryList.onchange = fallbackHandler;

    return () => {
      if (mediaQueryList.onchange === fallbackHandler) {
        mediaQueryList.onchange = previousOnChange;
      }
    };
  }, [query]);

  return matches;
}
