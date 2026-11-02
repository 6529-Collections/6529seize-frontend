"use client";

import { useCallback, useState } from "react";

/**
 * A model's state with its Break it (EXPLAINED.md §8.1): pressing Break it
 * keeps the state the reader had and applies the broken one; pressing it
 * again restores what they had. Any other change leaves the broken state.
 */
export interface Breakable<S> {
  readonly state: S;
  readonly broken: boolean;
  /** While broken, the state the reader had, which Break it restores. */
  readonly saved: S | null;
  /** Changes the state; leaves the broken state if it was on. */
  readonly set: (next: Partial<S>) => void;
  readonly toggleBreak: () => void;
}

export function useBreakable<S extends object>(
  initial: S,
  broken: (state: S) => S
): Breakable<S> {
  const [model, setModel] = useState<{ state: S; saved: S | null }>({
    state: initial,
    saved: null,
  });
  const set = useCallback((next: Partial<S>) => {
    setModel((current) => ({
      state: { ...current.state, ...next },
      saved: null,
    }));
  }, []);
  const toggleBreak = useCallback(() => {
    setModel((current) =>
      current.saved === null
        ? { state: broken(current.state), saved: current.state }
        : { state: current.saved, saved: null }
    );
  }, [broken]);
  return {
    state: model.state,
    broken: model.saved !== null,
    saved: model.saved,
    set,
    toggleBreak,
  };
}
