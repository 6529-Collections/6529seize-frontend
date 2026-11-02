/**
 * In-memory hand-off of people for `/messages/encrypted/new` (for example
 * from a plaintext DM's "Start an encrypted chat with the same people").
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
  readonly people: readonly E2eePrefillPerson[];
  readonly source: "dm";
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
