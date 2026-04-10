import { useCallback, useSyncExternalStore } from "react";

const getMediaQueryList = (query: string): MediaQueryList | null => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }

  return window.matchMedia(query);
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

      mediaQueryList.addListener(handler);
      return () => mediaQueryList.removeListener(handler);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => getMediaQueryList(query)?.matches ?? false,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
