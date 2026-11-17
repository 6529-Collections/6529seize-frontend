import { getDesktopShellApi, getDesktopUpdater } from "@/helpers/desktop-shell";
import {
  type DesktopUpdateState,
  parseDesktopUpdateState,
  readDesktopUpdateText,
} from "@/lib/desktop/updateState";
import type { DesktopUpdater } from "@/types/desktop-shell";

/**
 * 6529 Desktop automatic updates, in-app side: whether this app installs
 * its own updates, the state it reports (U1-U14, in its own words) and the
 * actions on it. Only auto-installing builds take part: they report
 * `getInfo().supportsInAppUpdates === true` and define `getState`,
 * `onUpdateState`, `offUpdateState` and `setSettings`. Everywhere else
 * (0.1.0-rc.2, the older app, the web) this reports `unsupported` and the
 * update notice keeps its earlier behaviour.
 */

type AutoMethods =
  | "getState"
  | "onUpdateState"
  | "offUpdateState"
  | "setSettings";
type AutoUpdater = DesktopUpdater & {
  readonly [K in AutoMethods]-?: NonNullable<DesktopUpdater[K]>;
};

type DesktopAutoUpdateSnapshot =
  | { readonly support: "detecting" }
  | { readonly support: "unsupported" }
  | {
      readonly support: "supported";
      readonly state: DesktopUpdateState | null;
    };

const DETECTING: DesktopAutoUpdateSnapshot = { support: "detecting" };
const UNSUPPORTED: DesktopAutoUpdateSnapshot = { support: "unsupported" };

let snapshot: DesktopAutoUpdateSnapshot = DETECTING;
/** Counts monitor sessions, so a late answer from an old one is ignored. */
let session = 0;
/** The release whose download the person started from the notice. */
let startedHere: { readonly version: string; readonly mark: symbol } | null =
  null;
const listeners = new Set<() => void>();
let stop: (() => void) | null = null;

const setSnapshot = (next: DesktopAutoUpdateSnapshot) => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};

function asAutoUpdater(updater: DesktopUpdater | null): AutoUpdater | null {
  return updater &&
    typeof updater.getState === "function" &&
    typeof updater.onUpdateState === "function" &&
    typeof updater.offUpdateState === "function" &&
    typeof updater.setSettings === "function"
    ? (updater as AutoUpdater)
    : null;
}

/** Counts applied states, so a read that a newer state overtook is dropped. */
let applied = 0;

/** Applies a state from the app; one that does not parse changes nothing. */
function applyState(value: unknown): void {
  const state = parseDesktopUpdateState(value);
  if (!state) return;
  applied += 1;
  setSnapshot({ support: "supported", state });
}

function start(): () => void {
  session += 1;
  let active = true;
  // Read through a function: a value narrowed before an await may change.
  const isActive = () => active;
  const updater = asAutoUpdater(getDesktopUpdater());
  const api = getDesktopShellApi();
  if (!updater || !api) {
    setSnapshot(UNSUPPORTED);
    return () => {
      session += 1;
    };
  }
  const onState = (_event: unknown, value?: unknown) => {
    if (active && snapshot.support === "supported") applyState(value);
  };
  updater.onUpdateState(onState);
  api
    .getInfo()
    .then(async (info) => {
      if (!active) return;
      if (info.supportsInAppUpdates !== true) {
        setSnapshot(UNSUPPORTED);
        return;
      }
      setSnapshot({ support: "supported", state: null });
      const before = applied;
      const value = await updater.getState();
      // Not over a state event that arrived while this read was pending.
      if (isActive() && applied === before) applyState(value);
    })
    .catch(() => {
      if (active && snapshot.support === "detecting") setSnapshot(UNSUPPORTED);
    });
  return () => {
    active = false;
    session += 1;
    updater.offUpdateState(onState);
  };
}

export function subscribeDesktopAutoUpdate(listener: () => void): () => void {
  listeners.add(listener);
  stop ??= start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop?.();
      stop = null;
      snapshot = DETECTING;
    }
  };
}

export const getDesktopAutoUpdate = (): DesktopAutoUpdateSnapshot => snapshot;
export const getServerDesktopAutoUpdate = (): DesktopAutoUpdateSnapshot =>
  DETECTING;

/** "Check now". */
export function checkDesktopUpdateNow(): void {
  getDesktopUpdater()?.checkUpdates();
}

const MAX_REASON = 300;

/** The app's words when it refuses an action, or "" when it gave none. */
function refusalText(error: unknown): string {
  const message = error instanceof Error ? error.message : error;
  return readDesktopUpdateText(message, MAX_REASON) ?? "";
}

/**
 * "Update now" and "Try again": the app downloads the offered release.
 * Resolves null once the app took it; otherwise the app's reason for not
 * starting now (for example "Please wait a moment and try again."), which is
 * a refusal, not a failed update, and is never retried by itself.
 */
export async function startDesktopUpdate(): Promise<string | null> {
  const updater = getDesktopUpdater();
  if (!updater) return "";
  try {
    await updater.downloadUpdate();
    return null;
  } catch (error) {
    return refusalText(error);
  }
}

/**
 * "Restart to update". Resolves null when the app restarts into the new
 * version; otherwise the app's reason (for example an open signature
 * request), or an empty string when it gave none.
 */
export async function restartDesktopToUpdate(): Promise<string | null> {
  const updater = getDesktopUpdater();
  if (!updater) return "";
  try {
    await updater.installUpdate();
    return null;
  } catch (error) {
    return refusalText(error);
  }
}

/**
 * Changes "Check for new releases" or "Install updates automatically".
 * Resolves null when the app took it (even if its answer could not be read:
 * the state is then read again); otherwise the app's reason (for example
 * "Please wait a moment and try again."), or "" when it gave none. An
 * answer that arrives after the monitor stopped is not applied.
 */
export async function setDesktopUpdateSettings(settings: {
  readonly check?: boolean;
  readonly auto?: boolean;
}): Promise<string | null> {
  const updater = asAutoUpdater(getDesktopUpdater());
  if (!updater) return "";
  const asked = session;
  const current = () => asked === session && snapshot.support === "supported";
  let value: unknown;
  try {
    value = await updater.setSettings(settings);
  } catch (error) {
    return refusalText(error);
  }
  // Taken: whatever happens below, the setting changed.
  if (!current()) return null;
  if (parseDesktopUpdateState(value)) {
    applyState(value);
    return null;
  }
  const before = applied;
  try {
    const fresh = await updater.getState();
    // Not over a newer state that arrived meanwhile.
    if (current() && applied === before) applyState(fresh);
  } catch {
    // The next state event brings the change.
  }
  return null;
}

/** Remembers that the person started this release's download here. */
export function noteDesktopUpdateStartedHere(version: string): symbol {
  const mark = Symbol(version);
  startedHere = { version, mark };
  return mark;
}

/** Forgets the record, only if it is still the one `mark` made. */
export function forgetDesktopUpdateStartedHere(mark: symbol): void {
  if (startedHere?.mark === mark) startedHere = null;
}

export const getDesktopUpdateStartedHere = (): string | null =>
  startedHere?.version ?? null;

/** @api Resets the module state between tests. */
export function __resetDesktopAutoUpdateForTests(): void {
  stop?.();
  stop = null;
  snapshot = DETECTING;
  startedHere = null;
  listeners.clear();
}
