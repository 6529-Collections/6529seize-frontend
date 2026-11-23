"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The result of an async check, valid only for the request it was made for
 * (`key`: the request's exact content and the read client's chain) and the
 * retry `round` it ran in. While a new request or round is being checked
 * it is null: a previous request's result never stands in for the current
 * one. `run` must not throw; a null `run` skips the check.
 */
export function useCheckResult<T>(
  key: string,
  run: (() => Promise<T>) | null,
  round: number
): T | null {
  const [tagged, setTagged] = useState<{
    readonly key: string;
    readonly round: number;
    readonly result: T;
  } | null>(null);
  const latest = useRef(run);
  // Declared first, so it runs before the check effect in each commit.
  useEffect(() => {
    latest.current = run;
  });
  const enabled = run !== null;
  useEffect(() => {
    const current = latest.current;
    if (!enabled || current === null) return undefined;
    let active = true;
    const start = async () => {
      const result = await current();
      if (active) setTagged({ key, round, result });
    };
    void start();
    return () => {
      active = false;
    };
  }, [key, round, enabled]);
  return tagged?.key === key && tagged.round === round ? tagged.result : null;
}

/**
 * A user's yes (a ticked box, "Send anyway") that belongs to one request:
 * it reads false as soon as `key` (the request's content) changes.
 */
export function useScopedFlag(
  key: string
): readonly [boolean, (value: boolean) => void] {
  const [state, setState] = useState<{
    readonly key: string;
    readonly value: boolean;
  } | null>(null);
  const value = state !== null && state.key === key && state.value;
  return [value, (next: boolean) => setState({ key, value: next })];
}
