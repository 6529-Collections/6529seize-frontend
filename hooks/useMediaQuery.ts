import { useMemo, useSyncExternalStore } from "react";

type MediaQueryListOptionalListeners = {
  addEventListener?: MediaQueryList["addEventListener"];
  removeEventListener?: MediaQueryList["removeEventListener"];
};

type BrowserWindowWithMatchMedia = {
  readonly matchMedia?: (query: string) => MediaQueryList;
};

type LegacySubscription = {
  readonly listeners: Set<() => void>;
  readonly handler: NonNullable<MediaQueryList["onchange"]>;
  readonly previousOnChange: MediaQueryList["onchange"];
};

const legacySubscriptions = new WeakMap<MediaQueryList, LegacySubscription>();

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

const subscribeWithOnChange = (
  mediaQueryList: MediaQueryList,
  onStoreChange: () => void
): (() => void) => {
  let subscription = legacySubscriptions.get(mediaQueryList);

  if (subscription === undefined) {
    const listeners = new Set<() => void>();
    const previousOnChange = mediaQueryList.onchange;
    const handler: NonNullable<MediaQueryList["onchange"]> = (event) => {
      previousOnChange?.call(mediaQueryList, event);
      listeners.forEach((listener) => listener());
    };

    subscription = { listeners, handler, previousOnChange };
    legacySubscriptions.set(mediaQueryList, subscription);
    mediaQueryList.onchange = handler;
  }

  subscription.listeners.add(onStoreChange);
  let isSubscribed = true;

  return () => {
    if (!isSubscribed) {
      return;
    }

    isSubscribed = false;
    subscription.listeners.delete(onStoreChange);
    if (subscription.listeners.size > 0) {
      return;
    }

    legacySubscriptions.delete(mediaQueryList);
    if (mediaQueryList.onchange === subscription.handler) {
      mediaQueryList.onchange = subscription.previousOnChange;
    }
  };
};

const subscribeToMediaQueryList = (
  mediaQueryList: MediaQueryList | null,
  onStoreChange: () => void
): (() => void) => {
  if (mediaQueryList === null) {
    return () => undefined;
  }

  const mediaQueryListListeners =
    mediaQueryList as MediaQueryListOptionalListeners;

  if (
    typeof mediaQueryListListeners.addEventListener === "function" &&
    typeof mediaQueryListListeners.removeEventListener === "function"
  ) {
    mediaQueryListListeners.addEventListener("change", onStoreChange);
    return () =>
      mediaQueryListListeners.removeEventListener?.("change", onStoreChange);
  }

  return subscribeWithOnChange(mediaQueryList, onStoreChange);
};

const getServerSnapshot = (): boolean => false;

export function useMediaQuery(query: string): boolean {
  const store = useMemo(() => {
    const mediaQueryList = getMediaQueryList(query);

    return {
      getSnapshot: () => mediaQueryList?.matches ?? false,
      subscribe: (onStoreChange: () => void) =>
        subscribeToMediaQueryList(mediaQueryList, onStoreChange),
    };
  }, [query]);

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot
  );
}
