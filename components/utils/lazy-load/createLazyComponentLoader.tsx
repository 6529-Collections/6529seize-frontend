"use client";

import {
  createElement,
  useEffect,
  useReducer,
  useRef,
  type Attributes,
  type ComponentType,
  type ReactElement,
} from "react";

import { preloadOnFirstInteraction } from "./preloadOnFirstInteraction";
import { runWhenIdle } from "./runWhenIdle";

type ComponentModule<P> = { readonly default: ComponentType<P> };

interface UseLazyReadyOptions {
  // Fetch only when true. The module cache is read either way.
  readonly enabled?: boolean | undefined;
  // Called when the chunk fails to load, so the owner can reset its state.
  readonly onError?: (() => void) | undefined;
}

interface LazyComponentLoader<P extends object> {
  // Starts fetching now. Safe to call repeatedly.
  readonly preload: () => void;
  // Starts fetching on the visitor's first interaction, or once the browser is
  // idle if that comes first, from the first mounted caller while enabled. It
  // is scheduled at most once, however many callers.
  readonly usePreloadEarly: (enabled?: boolean) => void;
  // True once the module is loaded. A module that is already cached reports
  // true during the first render, so opening something already fetched
  // commits in a single pass.
  readonly useIsReady: (options?: UseLazyReadyOptions) => boolean;
  // Renders the loaded component. Render it only when useIsReady is true.
  readonly Loaded: (props: P) => ReactElement | null;
}

// A small state-based alternative to next/dynamic for surfaces that open on
// user intent. next/dynamic suspends on the first render even when the module
// is already loaded, and React then throttles the reveal (about 300 ms). Here
// nothing suspends: a cached module renders synchronously, and while it is
// still loading the caller renders its own fallback (or nothing).
export function createLazyComponentLoader<P extends object>(
  importComponent: () => Promise<ComponentModule<P>>
): LazyComponentLoader<P> {
  let loaded: ComponentType<P> | undefined;
  let pending: Promise<ComponentType<P>> | undefined;
  let earlyScheduled = false;

  const fetchComponent = async (): Promise<ComponentType<P>> => {
    const loadedModule = await importComponent();
    loaded = loadedModule.default;
    return loadedModule.default;
  };

  const load = (): Promise<ComponentType<P>> => {
    if (!pending) {
      const attempt = fetchComponent();
      pending = attempt;
      // Forget a failed attempt so the next call fetches again.
      attempt.catch(() => {
        if (pending === attempt) pending = undefined;
      });
    }
    return pending;
  };

  const preload = (): void => {
    if (loaded) return;
    load().catch(() => undefined);
  };

  const preloadEarly = (enabled: boolean): void => {
    if (!enabled || loaded || earlyScheduled) return;
    earlyScheduled = true;
    // Whichever fires first starts the download; the other is then a no-op.
    // Idle is only the fallback: a busy main thread can delay it for seconds.
    preloadOnFirstInteraction(preload);
    runWhenIdle(preload);
  };

  const usePreloadEarly = (enabled = true): void => {
    useEffect(() => {
      preloadEarly(enabled);
    }, [enabled]);
  };

  const useIsReady = ({
    enabled = true,
    onError,
  }: UseLazyReadyOptions = {}): boolean => {
    const [, rerender] = useReducer((count: number) => count + 1, 0);
    const onErrorRef = useRef(onError);

    useEffect(() => {
      onErrorRef.current = onError;
    });

    useEffect(() => {
      if (!enabled || loaded) return undefined;
      let cancelled = false;
      const waitForModule = async () => {
        try {
          await load();
          if (!cancelled) rerender();
        } catch (error) {
          if (cancelled) return;
          console.error("Failed to load a lazy component", error);
          onErrorRef.current?.();
        }
      };
      void waitForModule();
      return () => {
        cancelled = true;
      };
    }, [enabled]);

    // The module-level cache is read on every render, so an instance that
    // mounted before the chunk arrived (for example through an early preload)
    // still renders it synchronously the moment it is needed.
    return loaded !== undefined;
  };

  // createElement rather than JSX on purpose. The React Compiler inlines a
  // lowercase alias such as `const Component = loaded` into the tag, and a
  // lowercase JSX tag compiles to a DOM element: `<loaded>` rendered nothing,
  // so the modal never opened. A createElement call has no tag to mangle.
  const Loaded = (props: P): ReactElement | null =>
    loaded ? createElement(loaded, props as P & Attributes) : null;

  return { preload, usePreloadEarly, useIsReady, Loaded };
}
