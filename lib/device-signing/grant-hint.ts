import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";

/**
 * A synchronous note that this browser holds a usable grant for a wallet,
 * kept beside the IndexedDB record. The record stays the source of truth;
 * the note only answers "was this write expected to be signed?" when the
 * record cannot be read in time, so such a write is never sent unsigned
 * silently. It holds no key material and no content.
 */
interface DeviceGrantHint {
  readonly grantId: string;
  readonly expiresAt: number;
  readonly scopes: readonly string[];
  readonly ownProfileId: string | null;
}

const HINT_KEY_PREFIX = "6529-device-grant-hint:";

const hintKey = (address: string): string =>
  `${HINT_KEY_PREFIX}${address.toLowerCase()}`;

const isHint = (value: unknown): value is DeviceGrantHint => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["grantId"] === "string" &&
    typeof candidate["expiresAt"] === "number" &&
    Array.isArray(candidate["scopes"]) &&
    (candidate["ownProfileId"] === null ||
      typeof candidate["ownProfileId"] === "string")
  );
};

export function readDeviceGrantHint(address: string): DeviceGrantHint | null {
  try {
    const raw = safeLocalStorage.getItem(hintKey(address));
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isHint(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDeviceGrantHint(
  address: string,
  grant: ApiDeviceGrant | null,
  ownProfileId: string | null | undefined
): void {
  try {
    if (!grant) {
      safeLocalStorage.removeItem(hintKey(address));
      return;
    }
    const hint: DeviceGrantHint = {
      grantId: grant.id,
      expiresAt: grant.expires_at,
      scopes: [...grant.scopes],
      ownProfileId: ownProfileId ?? null,
    };
    safeLocalStorage.setItem(hintKey(address), JSON.stringify(hint));
  } catch {
    // The note is best effort; signing reads the record itself.
  }
}
