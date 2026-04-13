import { useEffect, useEffectEvent, useState } from "react";

type MediaQueryListOptionalListeners = {
  addEventListener?: MediaQueryList["addEventListener"];
  removeEventListener?: MediaQueryList["removeEventListener"];
};

type BrowserWindowWithMatchMedia = {
  readonly matchMedia?: (query: string) => MediaQueryList;
};

const getBrowserWindow = (): BrowserWindowWithMatchMedia | undefined =>
  (globalThis as { window?: BrowserWindowWithMatchMedia }).window;

const getMediaQueryList = (query: string): MediaQueryList | null => {
  const browserWindow = getBrowserWindow();
  if (
    browserWindow === undefined ||
    typeof browserWindow.matchMedia !== "function"
  ) {
    return null;
  }

  return browserWindow.matchMedia(query);
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

    const mediaQueryListListeners =
      mediaQueryList as MediaQueryListOptionalListeners;

    if (
      typeof mediaQueryListListeners.addEventListener === "function" &&
      typeof mediaQueryListListeners.removeEventListener === "function"
    ) {
      mediaQueryListListeners.addEventListener("change", handleChange);
      return () =>
        mediaQueryListListeners.removeEventListener?.("change", handleChange);
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
