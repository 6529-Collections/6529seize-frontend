import { useCallback, useSyncExternalStore } from "react";

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
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = getMediaQueryList(query);
      if (!mediaQueryList) {
        return () => {};
      }

      const handler = () => {
        onStoreChange();
      };

      if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener("change", handler);
        return () => mediaQueryList.removeEventListener("change", handler);
      }

      const previousOnChange = mediaQueryList.onchange;
      const fallbackHandler: NonNullable<MediaQueryList["onchange"]> = (
        event
      ) => {
        previousOnChange?.call(mediaQueryList, event);
        onStoreChange();
      };

      mediaQueryList.onchange = fallbackHandler;

      return () => {
        if (mediaQueryList.onchange === fallbackHandler) {
          mediaQueryList.onchange = previousOnChange;
        }
      };
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => getMediaQueryList(query)?.matches ?? false,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
