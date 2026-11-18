import { useEffect, useState } from "react";

/**
 * In-memory hand-off of people from a profile or an unencrypted DM.
 * Kept out of the URL so participant ids never land in history, analytics or
 * referrers.
 */
export interface E2eePrefillPerson {
  readonly profileId: string;
  readonly handle: string | null;
  readonly pfp: string | null;
  readonly wallet: string | null;
}

interface E2eeComposePrefill {
  readonly ownerProfileId: string;
  readonly people: readonly E2eePrefillPerson[];
  readonly source: "dm" | "profile";
}

let pendingPrefill: E2eeComposePrefill | null = null;

export function setE2eeComposePrefill(prefill: E2eeComposePrefill): void {
  pendingPrefill = prefill;
}

export function peekE2eeComposePrefill(): E2eeComposePrefill | null {
  return pendingPrefill;
}

export function clearE2eeComposePrefill(): void {
  pendingPrefill = null;
}

export function useE2eeComposePrefill(source: E2eeComposePrefill["source"]) {
  const [prefill] = useState(() => {
    const pending = peekE2eeComposePrefill();
    return pending?.source === source ? pending : null;
  });

  useEffect(() => {
    if (prefill && pendingPrefill === prefill) clearE2eeComposePrefill();
  }, [prefill]);

  return prefill;
}
