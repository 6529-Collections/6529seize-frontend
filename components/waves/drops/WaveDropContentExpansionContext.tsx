"use client";

import type { ReactNode, RefObject } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface WaveDropContentExpansionContextValue {
  readonly enabled: boolean;
  readonly expandedKeys: ReadonlySet<string>;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly setExpanded: (key: string, expanded: boolean) => void;
}

const WaveDropContentExpansionContext =
  createContext<WaveDropContentExpansionContextValue | null>(null);
const EMPTY_SCROLL_CONTAINER_REF: RefObject<HTMLDivElement | null> = {
  current: null,
};
const ignoreExpansionChange = () => undefined;

interface WaveDropContentExpansionProviderProps {
  readonly children: ReactNode;
  readonly enabled: boolean;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function WaveDropContentExpansionProvider({
  children,
  enabled,
  scrollContainerRef,
}: WaveDropContentExpansionProviderProps) {
  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const setExpanded = useCallback((key: string, expanded: boolean) => {
    setExpandedKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      if (expanded) {
        nextKeys.add(key);
      } else {
        nextKeys.delete(key);
      }
      return nextKeys;
    });
  }, []);
  const value = useMemo<WaveDropContentExpansionContextValue>(
    () => ({
      enabled,
      expandedKeys,
      scrollContainerRef,
      setExpanded,
    }),
    [enabled, expandedKeys, scrollContainerRef, setExpanded]
  );

  return (
    <WaveDropContentExpansionContext.Provider value={value}>
      {children}
    </WaveDropContentExpansionContext.Provider>
  );
}

export function useWaveDropContentExpansion(key: string): Omit<
  WaveDropContentExpansionContextValue,
  "expandedKeys"
> & {
  readonly isExpanded: boolean;
} {
  const context = useContext(WaveDropContentExpansionContext);

  return {
    enabled: context?.enabled ?? false,
    isExpanded: context?.expandedKeys.has(key) ?? false,
    scrollContainerRef:
      context?.scrollContainerRef ?? EMPTY_SCROLL_CONTAINER_REF,
    setExpanded: context?.setExpanded ?? ignoreExpansionChange,
  };
}
