"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useRef,
  useState,
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

/** Shared draft protection and nested titles for responsive phone surfaces. */
export function useMobilePageState(guardDrafts = true) {
  const drafts = useRef(
    new Map<string, () => { dirty: boolean; busy: boolean }>()
  );
  const [navigationStack, setNavigationState] = useState(
    new Map<string, MobilePageNavigation>()
  );
  const navigation = [...navigationStack.values()].at(-1);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const registerDraft = useCallback(
    (id: string, read: () => { dirty: boolean; busy: boolean }) => {
      drafts.current.set(id, read);
      return () => {
        drafts.current.delete(id);
      };
    },
    []
  );
  const setNavigation = useCallback(
    (id: string, value: MobilePageNavigation | null) => {
      setNavigationState((current) => {
        const next = new Map(current);
        if (value) next.set(id, value);
        else next.delete(id);
        return next;
      });
    },
    []
  );
  const pageContext = useMemo(
    () => ({ registerDraft, setNavigation }),
    [registerDraft, setNavigation]
  );
  const guard = useCallback(
    (leave: () => void) => {
      if (!guardDrafts) return false;
      const states = [...drafts.current.values()].map((read) => read());
      if (states.some((state) => state.busy)) return true;
      if (!states.some((state) => state.dirty)) return false;
      setPendingLeave(() => leave);
      return true;
    },
    [guardDrafts]
  );
  return {
    pageContext,
    navigation,
    navigationStack,
    guard,
    pendingLeave,
    setPendingLeave,
  };
}

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
