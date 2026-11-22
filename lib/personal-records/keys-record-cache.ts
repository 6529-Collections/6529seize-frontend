import type { SignedRecordEvent } from "@/lib/signed-records/record-event";

/**
 * This device's signed `keys` record, kept so later submits resend the same
 * event and 6529.io logs it once. One entry per device key; it serves while
 * the sender-key generation, the grant, the stream and the provider keys
 * stay the same. Losing it only costs a fresh keys record.
 */

const STORAGE_PREFIX = "6529-personal-records-keys:";

interface KeysRecordScope {
  readonly deviceKey: string;
  readonly gen: number;
  readonly grantId: string;
  readonly wave: string;
  readonly providerKeys: readonly {
    readonly id: string;
    readonly publicKey: string;
  }[];
}

interface StoredKeysRecord {
  readonly gen: number;
  readonly grantId: string;
  readonly wave: string;
  readonly providers: string;
  readonly event: SignedRecordEvent;
}

/** The provider keys as one comparable string, in id order. */
const providersOf = (scope: KeysRecordScope): string =>
  scope.providerKeys
    .map((key) => `${key.id}=${key.publicKey.toLowerCase()}`)
    .sort()
    .join(",");

const storageKey = (deviceKey: string) =>
  `${STORAGE_PREFIX}${deviceKey.toLowerCase()}`;

function isStoredKeysRecord(value: unknown): value is StoredKeysRecord {
  const stored = value as Partial<StoredKeysRecord> | null;
  const event = stored?.event as Partial<SignedRecordEvent> | undefined;
  return (
    typeof stored?.gen === "number" &&
    typeof stored.grantId === "string" &&
    typeof stored.wave === "string" &&
    typeof stored.providers === "string" &&
    typeof event?.id === "string" &&
    typeof event.anchor === "number" &&
    typeof event.device_key === "string" &&
    typeof event.auth_ref === "string" &&
    Array.isArray(event.refs)
  );
}

/** The stored keys record for this scope, or null (none, another scope, unreadable). */
export function readKeysRecord(
  scope: KeysRecordScope
): SignedRecordEvent | null {
  try {
    const raw = globalThis.localStorage.getItem(storageKey(scope.deviceKey));
    const stored: unknown = raw === null ? null : JSON.parse(raw);
    if (!isStoredKeysRecord(stored)) {
      return null;
    }
    const { event } = stored;
    const matches =
      stored.gen === scope.gen &&
      stored.grantId === scope.grantId.toLowerCase() &&
      stored.wave === scope.wave &&
      stored.providers === providersOf(scope) &&
      event.wave === scope.wave &&
      event.device_key === scope.deviceKey.toLowerCase() &&
      event.auth_ref === scope.grantId.toLowerCase() &&
      event.refs.length === 1 &&
      event.refs[0] === "keys";
    return matches ? event : null;
  } catch {
    return null;
  }
}

export function storeKeysRecord(
  scope: KeysRecordScope,
  event: SignedRecordEvent
): void {
  const stored: StoredKeysRecord = {
    gen: scope.gen,
    grantId: scope.grantId.toLowerCase(),
    wave: scope.wave,
    providers: providersOf(scope),
    event,
  };
  try {
    globalThis.localStorage.setItem(
      storageKey(scope.deviceKey),
      JSON.stringify(stored)
    );
  } catch {
    // Not kept: the next submit signs a fresh keys record.
  }
}

export function forgetKeysRecord(deviceKey: string): void {
  try {
    globalThis.localStorage.removeItem(storageKey(deviceKey));
  } catch {
    // Nothing to forget.
  }
}
