"use client";

import { useCallback, useEffect, useState } from "react";
import type { E2eeEligibility, E2eeEngine } from "@/lib/e2ee/types";

export type E2eeEligibilityState =
  | E2eeEligibility["status"]
  | "checking"
  | "error";

type EligibilityResults = Readonly<Record<string, E2eeEligibilityState>>;

/** Fills every requested id: engine results first, the fallback for the rest. */
function mergeResults(
  previous: EligibilityResults,
  ids: readonly string[],
  eligibility: readonly E2eeEligibility[],
  fallback: E2eeEligibilityState
): EligibilityResults {
  const next: Record<string, E2eeEligibilityState> = { ...previous };
  for (const item of eligibility) {
    next[item.profileId] = item.status;
  }
  for (const id of ids) {
    next[id] ??= fallback;
  }
  return next;
}

async function loadEligibility(
  engine: E2eeEngine,
  ids: readonly string[]
): Promise<E2eeEligibility[]> {
  try {
    return await engine.checkEligibility([...ids]);
  } catch {
    // Unchecked ids fall back to "error" so the user can retry each one.
    return [];
  }
}

/**
 * Checks, once per person, whether they can receive encrypted messages from
 * the viewer (DM policy, blocks, devices). Results are cached per profile id.
 */
export function useE2eeEligibility(
  engine: E2eeEngine | null,
  profileIds: readonly string[]
): {
  readonly statusFor: (profileId: string) => E2eeEligibilityState;
  readonly retry: (profileId: string) => void;
} {
  const [results, setResults] = useState<EligibilityResults>({});
  const missingKey = [...new Set(profileIds)]
    .filter((id) => results[id] === undefined)
    .sort((a, b) => a.localeCompare(b))
    .join(",");

  useEffect(() => {
    if (!engine || !missingKey) {
      return;
    }
    const ids = missingKey.split(",");
    const run = { cancelled: false };
    const check = async () => {
      const eligibility = await loadEligibility(engine, ids);
      if (!run.cancelled) {
        setResults((previous) =>
          mergeResults(previous, ids, eligibility, "error")
        );
      }
    };
    void check();
    return () => {
      run.cancelled = true;
    };
  }, [engine, missingKey]);

  const statusFor = useCallback(
    (profileId: string): E2eeEligibilityState =>
      results[profileId] ?? "checking",
    [results]
  );

  const retry = useCallback((profileId: string) => {
    setResults((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([id]) => id !== profileId)
      )
    );
  }, []);

  return { statusFor, retry };
}
