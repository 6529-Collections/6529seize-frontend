import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { generateDeviceKeyPair } from "./ed25519";
import { deviceKeyStorage, type StoredDeviceKey } from "./device-key-storage";
import { writeDeviceGrantHint } from "./grant-hint";

const DEVICE_GRANT_CHANGED_EVENT = "6529-device-grant-changed";
const DAY_MS = 24 * 60 * 60 * 1000;
const GRANT_RENEWAL_WINDOW_MS = 14 * DAY_MS;
/** Grants this close to expiry are not used, so the server never sees one expire mid-write. */
const SIGNING_EXPIRY_MARGIN_MS = 60 * 1000;

type DeviceGrantStatus = "none" | "active" | "renewal" | "expired";

const normalizeAddress = (address: string): string => address.toLowerCase();

async function withDeviceKeyLock<T>(
  address: string,
  task: () => Promise<T>
): Promise<T> {
  // Web Locks serialize key and sequence updates across tabs where available.
  const locks = (globalThis.navigator as Partial<Navigator> | undefined)?.locks;
  if (!locks) {
    return await task();
  }
  return await locks.request(`6529-device-key:${address}`, task);
}

function notifyDeviceGrantChanged(address: string): void {
  if (typeof globalThis.dispatchEvent !== "function") {
    return;
  }
  globalThis.dispatchEvent(
    new CustomEvent(DEVICE_GRANT_CHANGED_EVENT, { detail: { address } })
  );
}

export function subscribeToDeviceGrantChanges(
  listener: () => void
): () => void {
  globalThis.addEventListener(DEVICE_GRANT_CHANGED_EVENT, listener);
  return () =>
    globalThis.removeEventListener(DEVICE_GRANT_CHANGED_EVENT, listener);
}

export function getDeviceGrantStatus(
  grant: ApiDeviceGrant | null,
  nowMs: number
): DeviceGrantStatus {
  // Only a revocation time revokes; a missing value (an older or partial
  // record) does not.
  if (!grant || typeof grant.revoked_at === "number") {
    return "none";
  }
  if (grant.expires_at <= nowMs) {
    return "expired";
  }
  return grant.expires_at - nowMs <= GRANT_RENEWAL_WINDOW_MS
    ? "renewal"
    : "active";
}

/** The stored grant when it can sign a write right now, otherwise null. */
function getUsableGrant(
  record: StoredDeviceKey,
  nowMs: number
): ApiDeviceGrant | null {
  const grant = record.grant;
  if (!grant || typeof grant.revoked_at === "number") {
    return null;
  }
  if (grant.expires_at <= nowMs + SIGNING_EXPIRY_MARGIN_MS) {
    return null;
  }
  const matchesKey =
    grant.device_key.toLowerCase() === record.publicKeyHex.toLowerCase() &&
    grant.wallet.toLowerCase() === record.address;
  return matchesKey ? grant : null;
}

export async function readDeviceKey(
  address: string
): Promise<StoredDeviceKey | null> {
  return (await deviceKeyStorage.read(normalizeAddress(address))) ?? null;
}

/**
 * Reads the record without the cross-tab lock (a read never changes it) and
 * refreshes the grant note. Used to warm IndexedDB and the key before a
 * write, so signing at send time is fast.
 */
export async function readUsableDeviceGrant(
  address: string,
  nowMs: number
): Promise<{
  readonly record: StoredDeviceKey;
  readonly grant: ApiDeviceGrant;
} | null> {
  const normalized = normalizeAddress(address);
  const record = await deviceKeyStorage.read(normalized);
  const grant = record ? getUsableGrant(record, nowMs) : null;
  writeDeviceGrantHint(normalized, grant, record?.ownProfileId);
  return record && grant ? { record, grant } : null;
}

/** Returns this device's key for the wallet, creating it on first use. */
export async function ensureDeviceKey(
  address: string
): Promise<StoredDeviceKey> {
  const normalized = normalizeAddress(address);
  return await withDeviceKeyLock(normalized, async () => {
    const existing = await deviceKeyStorage.read(normalized);
    if (existing) {
      return existing;
    }
    const { keyPair, publicKeyHex } = await generateDeviceKeyPair();
    const record: StoredDeviceKey = {
      address: normalized,
      keyPair,
      publicKeyHex,
      grant: null,
      lastSeq: 0,
    };
    await deviceKeyStorage.write(record);
    return record;
  });
}

/** Stores a grant returned at sign-in when it grants this device's key. */
export async function saveDeviceGrant(
  address: string,
  grant: ApiDeviceGrant,
  ownProfileId: string | null = null
): Promise<boolean> {
  const normalized = normalizeAddress(address);
  const saved = await withDeviceKeyLock(normalized, async () => {
    const record = await deviceKeyStorage.read(normalized);
    const grantsThisKey =
      record?.publicKeyHex.toLowerCase() === grant.device_key.toLowerCase() &&
      grant.wallet.toLowerCase() === normalized;
    if (!record || !grantsThisKey) {
      return false;
    }
    const nextOwnProfileId = ownProfileId ?? record.ownProfileId ?? null;
    await deviceKeyStorage.write({
      ...record,
      grant,
      ownProfileId: nextOwnProfileId,
    });
    writeDeviceGrantHint(normalized, grant, nextOwnProfileId);
    return true;
  });
  if (saved) {
    notifyDeviceGrantChanged(normalized);
  }
  return saved;
}

/** Drops the local grant (keeping the key and its sequence). */
export async function forgetDeviceGrant(
  address: string,
  grantId?: string
): Promise<void> {
  const normalized = normalizeAddress(address);
  const forgotten = await withDeviceKeyLock(normalized, async () => {
    const record = await deviceKeyStorage.read(normalized);
    if (!record?.grant) {
      return false;
    }
    if (grantId !== undefined && record.grant.id !== grantId) {
      return false;
    }
    await deviceKeyStorage.write({ ...record, grant: null });
    writeDeviceGrantHint(normalized, null, null);
    return true;
  });
  if (forgotten) {
    notifyDeviceGrantChanged(normalized);
  }
}

/**
 * Allocates the next sequence number for a usable grant and persists it
 * before anything is signed, so a sequence is never reused.
 */
export async function allocateDeviceSeq(
  address: string,
  nowMs: number,
  /** Called once the cross-tab lock is held, for timing diagnostics. */
  onLocked?: () => void
): Promise<{
  readonly record: StoredDeviceKey;
  readonly grant: ApiDeviceGrant;
  readonly seq: number;
} | null> {
  const normalized = normalizeAddress(address);
  return await withDeviceKeyLock(normalized, async () => {
    onLocked?.();
    const record = await deviceKeyStorage.read(normalized);
    const grant = record ? getUsableGrant(record, nowMs) : null;
    writeDeviceGrantHint(normalized, grant, record?.ownProfileId);
    if (!record || !grant) {
      return null;
    }
    const seq = Math.max(record.lastSeq + 1, nowMs);
    const updated: StoredDeviceKey = { ...record, lastSeq: seq };
    await deviceKeyStorage.write(updated);
    return { record: updated, grant, seq };
  });
}

/** Public keys of every device key held by this browser. */
export async function listLocalDevicePublicKeys(): Promise<string[]> {
  const records = await deviceKeyStorage.readAll();
  return records.map((record) => record.publicKeyHex.toLowerCase());
}
