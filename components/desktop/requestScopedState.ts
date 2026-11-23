"use client";

import { useEffect, useRef, useState } from "react";

interface Scope {
  /** Increases on every change of request, client or round. */
  readonly seq: number;
  readonly key: string;
  readonly client: unknown;
  readonly round: number;
}

/**
 * The result of an async check, valid only for the latest check run: one
 * run per (request `key`, read `client`, retry `round`), and every change
 * of any of them, including a return to an earlier request, starts a new
 * run. Until that run answers the result is null, so neither a previous
 * request's result nor an older run of the same request can stand in for
 * it. `run` must not throw; a null `run` skips the check.
 */
export function useCheckResult<T>(
  key: string,
  client: unknown,
  run: (() => Promise<T>) | null,
  round: number
): T | null {
  const [scope, setScope] = useState<Scope>({ seq: 0, key, client, round });
  if (scope.key !== key || scope.client !== client || scope.round !== round) {
    // A new request, client or round: a new run (adjusted during render).
    setScope({ seq: scope.seq + 1, key, client, round });
  }
  const [answer, setAnswer] = useState<{
    readonly seq: number;
    readonly result: T;
  } | null>(null);
  const latest = useRef(run);
  // Declared first, so it runs before the check effect in each commit.
  useEffect(() => {
    latest.current = run;
  });
  const enabled = run !== null;
  const { seq } = scope;
  useEffect(() => {
    const current = latest.current;
    if (!enabled || current === null) return undefined;
    let active = true;
    const start = async () => {
      const result = await current();
      if (active) setAnswer({ seq, result });
    };
    void start();
    return () => {
      active = false;
    };
  }, [seq, enabled]);
  const current =
    scope.key === key && scope.client === client && scope.round === round;
  return current && answer?.seq === seq ? answer.result : null;
}

/**
 * A user's yes (a ticked box, "Send anyway") that belongs to one request:
 * every change of `key` clears it, also a return to an earlier request.
 */
export function useScopedFlag(
  key: string
): readonly [boolean, (value: boolean) => void] {
  const [state, setState] = useState<{
    readonly key: string;
    readonly value: boolean;
  }>({ key, value: false });
  if (state.key !== key) setState({ key, value: false });
  const value = state.key === key && state.value;
  return [value, (next: boolean) => setState({ key, value: next })];
}
