import {
  getDeviceTimeZone,
  LOCAL_DISPLAY_TIME_ZONE,
  LOCAL_TIME_ZONE_PREFERENCE,
  normalizeDisplayTimeZonePreference,
  resolveDisplayTimeZone,
  type DisplayTimeZone,
  type DisplayTimeZonePreference,
} from "@/lib/display-time-zone/displayTimeZone";

/**
 * Where the display time zone lives. The setting is saved on this device only
 * (never sent to 6529). The wave switch is a per-tab override that ends when
 * the tab or the app closes, so it is kept in session storage.
 */
export const DISPLAY_TIME_ZONE_STORAGE_KEY = "displayTimeZonePreference";
export const DISPLAY_TIME_ZONE_OVERRIDE_STORAGE_KEY =
  "displayTimeZoneSessionOverride";
const CHANGE_EVENT = "display-time-zone-change";

export interface DisplayTimeZoneSnapshot {
  /** The saved setting. */
  readonly preference: DisplayTimeZonePreference;
  /** The wave switch for this tab, or null when it is off. */
  readonly override: DisplayTimeZonePreference | null;
}

const SERVER_SNAPSHOT: DisplayTimeZoneSnapshot = Object.freeze({
  preference: LOCAL_TIME_ZONE_PREFERENCE,
  override: null,
});

let cachedSnapshot: DisplayTimeZoneSnapshot | null = null;

function readStorage(storage: "local" | "session", key: string): string | null {
  try {
    const target =
      storage === "local" ? globalThis.localStorage : globalThis.sessionStorage;
    return target?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(
  storage: "local" | "session",
  key: string,
  value: string | null
): void {
  try {
    const target =
      storage === "local" ? globalThis.localStorage : globalThis.sessionStorage;
    if (!target) return;
    if (value === null) {
      target.removeItem(key);
    } else {
      target.setItem(key, value);
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data). The
    // in-memory snapshot below still applies for this page view.
  }
}

function readSnapshot(): DisplayTimeZoneSnapshot {
  const preference = normalizeDisplayTimeZonePreference(
    readStorage("local", DISPLAY_TIME_ZONE_STORAGE_KEY) ??
      LOCAL_TIME_ZONE_PREFERENCE
  );
  const storedOverride = readStorage(
    "session",
    DISPLAY_TIME_ZONE_OVERRIDE_STORAGE_KEY
  );
  const override =
    storedOverride === null
      ? null
      : normalizeDisplayTimeZonePreference(storedOverride);
  return {
    preference,
    // An override equal to the setting changes nothing; treat it as off.
    override: override === preference ? null : override,
  };
}

function publish(next: DisplayTimeZoneSnapshot): void {
  cachedSnapshot = next;
  globalThis.dispatchEvent?.(new Event(CHANGE_EVENT));
}

export function getDisplayTimeZoneSnapshot(): DisplayTimeZoneSnapshot {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }
  cachedSnapshot ??= readSnapshot();
  return cachedSnapshot;
}

export function getDisplayTimeZoneServerSnapshot(): DisplayTimeZoneSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeToDisplayTimeZone(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== DISPLAY_TIME_ZONE_STORAGE_KEY) {
      return;
    }
    cachedSnapshot = readSnapshot();
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

/** Saves the setting on this device and turns the wave switch off. */
export function setDisplayTimeZonePreference(
  preference: DisplayTimeZonePreference
): void {
  const normalized = normalizeDisplayTimeZonePreference(preference);
  writeStorage("local", DISPLAY_TIME_ZONE_STORAGE_KEY, normalized);
  writeStorage("session", DISPLAY_TIME_ZONE_OVERRIDE_STORAGE_KEY, null);
  publish({ preference: normalized, override: null });
}

/** Turns the wave switch on for this tab, or off with `null`. */
export function setDisplayTimeZoneOverride(
  override: DisplayTimeZonePreference | null
): void {
  const { preference } = getDisplayTimeZoneSnapshot();
  const normalized =
    override === null ? null : normalizeDisplayTimeZonePreference(override);
  const effective = normalized === preference ? null : normalized;
  writeStorage("session", DISPLAY_TIME_ZONE_OVERRIDE_STORAGE_KEY, effective);
  publish({ preference, override: effective });
}

/** Test hook: forget the cached snapshot so the next read hits storage. */
export function resetDisplayTimeZoneSnapshotForTests(): void {
  cachedSnapshot = null;
}

/**
 * The display zone right now, for code outside React (for example preview
 * models built from fetched data). Components should use the
 * `useDisplayTimeZone` hook, which also re-renders on changes.
 */
export function getCurrentDisplayTimeZone(): DisplayTimeZone {
  if (typeof window === "undefined") {
    return LOCAL_DISPLAY_TIME_ZONE;
  }
  const { preference, override } = getDisplayTimeZoneSnapshot();
  return resolveDisplayTimeZone(override ?? preference, getDeviceTimeZone());
}
