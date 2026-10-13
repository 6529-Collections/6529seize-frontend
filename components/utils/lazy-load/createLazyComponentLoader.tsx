"use client";

import {
  useEffect,
  useReducer,
  useRef,
  type ComponentType,
  type JSX,
} from "react";

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
  // Starts fetching once the browser is idle, from the first mounted caller
  // while enabled. The fetch is scheduled at most once, however many callers.
  readonly usePreloadWhenIdle: (enabled?: boolean) => void;
  // True once the module is loaded. A module that is already cached reports
  // true during the first render, so opening something already fetched
  // commits in a single pass.
  readonly useIsReady: (options?: UseLazyReadyOptions) => boolean;
  // Renders the loaded component. Render it only when useIsReady is true.
  readonly Loaded: (props: P) => JSX.Element | null;
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
  let idleScheduled = false;

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

  const preloadWhenIdle = (): void => {
    if (loaded || idleScheduled) return;
    idleScheduled = true;
    runWhenIdle(preload);
  };

  const usePreloadWhenIdle = (enabled = true): void => {
    useEffect(() => {
      if (enabled) preloadWhenIdle();
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
    // mounted before the chunk arrived (for example through idle preload)
    // still renders it synchronously the moment it is needed.
    return loaded !== undefined;
  };

  const Loaded = (props: P): JSX.Element | null => {
    const Component = loaded;
    return Component ? (
      <Component {...(props as P & JSX.IntrinsicAttributes)} />
    ) : null;
  };

  return { preload, usePreloadWhenIdle, useIsReady, Loaded };
}
