"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

export interface MobilePageNavigation {
  readonly title: string;
  readonly back: () => void;
  readonly protectDrafts: boolean;
}

export const MobilePageContext = createContext<{
  readonly registerDraft: (
    id: string,
    read: () => { dirty: boolean; busy: boolean }
  ) => () => void;
  readonly setNavigation: (
    id: string,
    navigation: MobilePageNavigation | null
  ) => void;
} | null>(null);

/** Forms report their draft; the containing phone view owns dismissal. */
export function useMobilePageDraft(dirty: boolean, busy = false) {
  const context = useContext(MobilePageContext);
  const id = useId();
  const current = useRef({ dirty, busy });
  useLayoutEffect(() => {
    current.current = { dirty, busy };
  }, [dirty, busy]);
  const registerDraft = context?.registerDraft;
  useEffect(
    () => registerDraft?.(id, () => current.current),
    [registerDraft, id]
  );
}

/** A nested editor lends its Back action and title to the single header. */
export function useMobilePageNavigation(
  title: string,
  back: (() => void) | undefined,
  protectDrafts = false
) {
  const context = useContext(MobilePageContext);
  const id = useId();
  const callback = useRef(back);
  useLayoutEffect(() => {
    callback.current = back;
  }, [back]);
  const setNavigation = context?.setNavigation;
  const enabled = back !== undefined;
  useEffect(() => {
    if (!enabled || !setNavigation) return;
    setNavigation(id, {
      title,
      back: () => callback.current?.(),
      protectDrafts,
    });
    return () => setNavigation(id, null);
  }, [setNavigation, id, title, enabled, protectDrafts]);
  return context !== null;
}

export function MobilePageDraft({
  dirty,
  busy = false,
  children,
}: {
  readonly dirty: boolean;
  readonly busy?: boolean;
  readonly children: ReactNode;
}) {
  useMobilePageDraft(dirty, busy);
  return children;
}
