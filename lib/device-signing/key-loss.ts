import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { readDeviceGrantHint } from "./grant-hint";

/**
 * A browser can drop this site's IndexedDB (storage eviction, or a store it
 * recreates at startup) while keeping its cookies and localStorage. The grant
 * note this browser keeps in localStorage then names a grant whose key is
 * gone. The loss is recorded per wallet before that note is cleared, so the
 * composer can explain why Signed Posts needs a new signature, and the grant
 * this browser held can be revoked once it signs a new one.
 *
 * Only this browser's own note is used: the grant id is one it recorded
 * itself, never another browser's.
 */
export interface DeviceKeyLoss {
  /** The grant this browser held for the wallet, from its own note. */
  readonly grantId: string;
  /** The wallet's own profile, when the note recorded it. */
  readonly ownProfileId: string | null;
  /** The lost grant's device public key, when the note recorded it. */
  readonly deviceKey?: string | null | undefined;
  readonly detectedAt: number;
  /** Whole hours from the note's last write to the detection, when known. */
  readonly hintAgeHours: number | null;
  /** Failed attempts to revoke the lost grant so far (absent: none). */
  readonly revokeAttempts?: number | undefined;
}

const LOSS_KEY_PREFIX = "6529-device-key-loss:";
/** Fired on window when a loss is recorded or cleared for a wallet. */
export const DEVICE_KEY_LOSS_EVENT = "6529-device-key-loss-change";

const lossKey = (address: string): string =>
  `${LOSS_KEY_PREFIX}${address.toLowerCase()}`;

const isLoss = (value: unknown): value is DeviceKeyLoss => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["grantId"] === "string" &&
    typeof candidate["detectedAt"] === "number" &&
    (candidate["ownProfileId"] === null ||
      typeof candidate["ownProfileId"] === "string") &&
    (candidate["hintAgeHours"] === null ||
      typeof candidate["hintAgeHours"] === "number") &&
    (candidate["revokeAttempts"] === undefined ||
      typeof candidate["revokeAttempts"] === "number") &&
    (candidate["deviceKey"] === undefined ||
      candidate["deviceKey"] === null ||
      typeof candidate["deviceKey"] === "string")
  );
};

const notifyChange = (address: string): void => {
  if (typeof globalThis.dispatchEvent !== "function") {
    return;
  }
  globalThis.dispatchEvent(
    new CustomEvent(DEVICE_KEY_LOSS_EVENT, {
      detail: { address: address.toLowerCase() },
    })
  );
};

/** The raw stored value, for subscribing with useSyncExternalStore. */
export function readDeviceKeyLossRaw(address: string): string | null {
  try {
    return safeLocalStorage.getItem(lossKey(address));
  } catch {
    return null;
  }
}

export function parseDeviceKeyLoss(raw: string | null): DeviceKeyLoss | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isLoss(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readDeviceKeyLoss(address: string): DeviceKeyLoss | null {
  return parseDeviceKeyLoss(readDeviceKeyLossRaw(address));
}

export function clearDeviceKeyLoss(address: string): void {
  try {
    if (safeLocalStorage.getItem(lossKey(address)) === null) {
      return;
    }
    safeLocalStorage.removeItem(lossKey(address));
  } catch {
    return;
  }
  notifyChange(address);
}

/** Counts one failed attempt to revoke the lost grant; the record stays. */
export function noteLostGrantRevokeFailure(address: string): void {
  const loss = readDeviceKeyLoss(address);
  if (!loss) {
    return;
  }
  try {
    safeLocalStorage.setItem(
      lossKey(address),
      JSON.stringify({ ...loss, revokeAttempts: (loss.revokeAttempts ?? 0) + 1 })
    );
  } catch {
    // Without the count the next attempt simply runs again.
  }
}

/**
 * Called when this browser holds no key record at all for the wallet. When
 * its grant note says it held a grant, records the loss once and returns it;
 * otherwise (never granted here, or already recorded) returns null.
 */
export function recordMissingDeviceKey(
  address: string,
  nowMs: number
): DeviceKeyLoss | null {
  const hint = readDeviceGrantHint(address);
  if (!hint || readDeviceKeyLoss(address)) {
    return null;
  }
  const loss: DeviceKeyLoss = {
    grantId: hint.grantId,
    ownProfileId: hint.ownProfileId,
    deviceKey: hint.deviceKey ?? null,
    detectedAt: nowMs,
    hintAgeHours:
      hint.writtenAt === undefined
        ? null
        : Math.max(0, Math.floor((nowMs - hint.writtenAt) / 3_600_000)),
  };
  try {
    safeLocalStorage.setItem(lossKey(address), JSON.stringify(loss));
  } catch {
    // Storage full or unavailable: the composer shows the ordinary prompt.
    return null;
  }
  notifyChange(address);
  return loss;
}

/** Follows recorded losses, here and in other tabs. */
export function subscribeToDeviceKeyLoss(onChange: () => void): () => void {
  globalThis.addEventListener("storage", onChange);
  globalThis.addEventListener(DEVICE_KEY_LOSS_EVENT, onChange);
  return () => {
    globalThis.removeEventListener("storage", onChange);
    globalThis.removeEventListener(DEVICE_KEY_LOSS_EVENT, onChange);
  };
}
