import { useEffect, useState } from "react";

/**
 * In-memory hand-off of people from a profile or an unencrypted DM.
 * Only an opaque navigation ID goes in the profile composer URL.
 */
export interface E2eePrefillPerson {
  readonly profileId: string;
  readonly handle: string | null;
  readonly pfp: string | null;
  readonly wallet: string | null;
}

export const PROFILE_MESSAGE_PREFILL_PARAM = "compose";

type E2eeComposePrefill = Readonly<{
  ownerProfileId: string;
  people: readonly E2eePrefillPerson[];
}> &
  (
    | { readonly source: "dm" }
    | { readonly source: "profile"; readonly navigationId: string }
  );

let pendingPrefill: E2eeComposePrefill | null = null;

export function setE2eeComposePrefill(prefill: E2eeComposePrefill): void {
  pendingPrefill = prefill;
}

function clearE2eeComposePrefill(prefill: E2eeComposePrefill | null): void {
  if (pendingPrefill === prefill) pendingPrefill = null;
}

export function useE2eeComposePrefill(
  source: E2eeComposePrefill["source"],
  navigationId?: string | null
) {
  const [prefill] = useState(() => {
    const pending = pendingPrefill;
    if (pending?.source !== source) return null;
    if (pending.source === "profile" && pending.navigationId !== navigationId) {
      return null;
    }
    return pending;
  });

  useEffect(() => {
    clearE2eeComposePrefill(prefill);
  }, [prefill]);

  return prefill;
}
