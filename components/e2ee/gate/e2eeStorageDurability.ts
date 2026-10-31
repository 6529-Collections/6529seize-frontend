/**
 * Whether this browser keeps encrypted-messages data between visits.
 *
 * Some people set their browser to delete cookies and site data when it
 * closes. Every visit then loses the sign-in and all of IndexedDB, so
 * encrypted messages enroll a new device each time: one more wallet
 * signature, one more device slot, and no history. These helpers spot that
 * pattern from the profile's devices and ask the browser to keep our data.
 */

const DAY_MS = 86_400_000;

/** Devices with this browser's name registered within this window count. */
export const E2EE_CLEAR_ON_EXIT_WINDOW_MS = 30 * DAY_MS;
/** How many such devices suggest the browser deletes its data. */
export const E2EE_CLEAR_ON_EXIT_MIN_DEVICES = 2;
/** A counted device must not have been used for longer than this. */
export const E2EE_CLEAR_ON_EXIT_UNSEEN_MS = DAY_MS;

/** The fields of a device record (GET /e2ee/me) the heuristic reads. */
export interface E2eeDeviceTrace {
  readonly label: string;
  /** Unix ms. */
  readonly created_at: number;
  /** Unix ms; null when the device was never seen after registering. */
  readonly last_seen_at: number | null;
}

const normalizeLabel = (label: string): string => label.trim().toLowerCase();

/**
 * True when this browser most likely deletes its data on close: it has no
 * encrypted-messages state of its own (the caller checks that), yet the
 * profile already has at least two devices with this browser's name that
 * were registered in the last 30 days and then not used for over a day.
 * Each of those is a visit whose data the browser threw away.
 */
export function looksLikeClearOnExitBrowser({
  devices,
  label,
  now,
}: {
  readonly devices: readonly E2eeDeviceTrace[];
  /** This browser's device name, such as "Chrome on Windows". */
  readonly label: string;
  readonly now: number;
}): boolean {
  const name = normalizeLabel(label);
  if (name.length === 0) {
    return false;
  }
  const abandoned = devices.filter((device) => {
    const lastUsed = device.last_seen_at ?? device.created_at;
    return (
      normalizeLabel(device.label) === name &&
      now - device.created_at <= E2EE_CLEAR_ON_EXIT_WINDOW_MS &&
      now - lastUsed > E2EE_CLEAR_ON_EXIT_UNSEEN_MS
    );
  });
  return abandoned.length >= E2EE_CLEAR_ON_EXIT_MIN_DEVICES;
}

/**
 * - persisted: the browser agreed to keep this site's data
 * - not-persisted: it may still delete the data (eviction, or settings)
 * - unsupported: no Storage API, or the check failed (no warning)
 */
export type E2eeStoragePersistence =
  | "persisted"
  | "not-persisted"
  | "unsupported";

interface StorageManagerLike {
  readonly persist?: (() => Promise<boolean>) | undefined;
  readonly persisted?: (() => Promise<boolean>) | undefined;
}

const defaultStorage = (): StorageManagerLike | undefined =>
  typeof navigator === "undefined" ? undefined : navigator.storage;

/**
 * Asks the browser to keep this site's data (`navigator.storage.persist()`),
 * then records the outcome with `navigator.storage.persisted()`.
 *
 * Call it synchronously from a click handler, before any await: browsers
 * only grant persistence, or ask (Firefox shows a permission prompt), during
 * a user gesture. It never rejects.
 */
export function requestE2eePersistentStorage(
  storage: StorageManagerLike | undefined = defaultStorage()
): Promise<E2eeStoragePersistence> {
  const persist = storage?.persist;
  const persisted = storage?.persisted;
  if (typeof persist !== "function" || typeof persisted !== "function") {
    return Promise.resolve("unsupported");
  }
  let request: Promise<boolean>;
  try {
    // Started now, inside the gesture; awaited below.
    request = persist.call(storage);
  } catch {
    return Promise.resolve("unsupported");
  }
  return request
    .then(() => persisted.call(storage))
    .then(
      (kept): E2eeStoragePersistence => (kept ? "persisted" : "not-persisted")
    )
    .catch((): E2eeStoragePersistence => "unsupported");
}
