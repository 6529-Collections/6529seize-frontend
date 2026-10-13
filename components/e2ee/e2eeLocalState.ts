/**
 * Small, non-secret per-browser markers for encrypted messages. They hold no
 * keys or message data (those stay in the engine's IndexedDB storage); they
 * only decide whether to load the engine early and which device notices the
 * user has already seen.
 */
const ENROLLED_KEY_PREFIX = "6529:e2ee:enrolled:";
const KNOWN_DEVICES_KEY_PREFIX = "6529:e2ee:known-devices:";
const MAX_KNOWN_DEVICES = 64;

const readItem = (key: string): string | null => {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeItem = (key: string, value: string | null): void => {
  try {
    if (value === null) {
      globalThis.localStorage.removeItem(key);
    } else {
      globalThis.localStorage.setItem(key, value);
    }
  } catch {
    // Storage can be unavailable (private mode, quota); markers are optional.
  }
};

/** True when this browser enrolled an encrypted-messages device for the profile. */
export function hasE2eeEnrollmentMarker(profileId: string): boolean {
  return readItem(`${ENROLLED_KEY_PREFIX}${profileId}`) === "1";
}

export function setE2eeEnrollmentMarker(
  profileId: string,
  enrolled: boolean
): void {
  writeItem(`${ENROLLED_KEY_PREFIX}${profileId}`, enrolled ? "1" : null);
}

/** Device keys the user has already been told about, or null if never recorded. */
export function readKnownE2eeDevices(profileId: string): Set<string> | null {
  const raw = readItem(`${KNOWN_DEVICES_KEY_PREFIX}${profileId}`);
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return new Set(
      parsed.filter((value): value is string => typeof value === "string")
    );
  } catch {
    return null;
  }
}

export function writeKnownE2eeDevices(
  profileId: string,
  deviceKeys: Iterable<string>
): void {
  const values = [...new Set(deviceKeys)].slice(-MAX_KNOWN_DEVICES);
  writeItem(`${KNOWN_DEVICES_KEY_PREFIX}${profileId}`, JSON.stringify(values));
}
