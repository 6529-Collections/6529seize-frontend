/**
 * 6529 Desktop capability check.
 *
 * 6529 Desktop shows this website inside a desktop window and defines a small
 * bridge on `window` (`api`, `nativeAuth`, `notifications`, `updater`,
 * `store`) before page scripts run. Browsers and the mobile app never define
 * it, so every desktop branch is dead code on the web.
 *
 * Every desktop-only behaviour must go through this module: check
 * `isDesktopShell()` and reach the bridge through the typed accessors below.
 * Do not read `window.api` directly and do not sniff the user agent.
 */

import type {
  DesktopNativeAuth,
  DesktopNotifications,
  DesktopShellApi,
  DesktopStore,
  DesktopUpdater,
} from "@/types/desktop-shell";

interface DesktopShellWindow {
  readonly api?: unknown;
  readonly nativeAuth?: unknown;
  readonly notifications?: unknown;
  readonly updater?: unknown;
  readonly store?: unknown;
}

const getShellWindow = (): DesktopShellWindow | null =>
  typeof window === "undefined" ? null : (window as DesktopShellWindow);

const isBridgeObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

/**
 * True only inside 6529 Desktop: the shell API and the native sign-in bridge
 * are both present. Requiring both keeps an unrelated `window.api` (for
 * example from a browser extension) from switching a web visitor into
 * desktop sign-in. Always false during server rendering.
 */
export function isDesktopShell(): boolean {
  const shellWindow = getShellWindow();
  return (
    shellWindow !== null &&
    isBridgeObject(shellWindow.api) &&
    isBridgeObject(shellWindow.nativeAuth)
  );
}

interface DesktopBridges {
  readonly api: DesktopShellApi;
  readonly nativeAuth: DesktopNativeAuth;
  readonly notifications: DesktopNotifications;
  readonly updater: DesktopUpdater;
  readonly store: DesktopStore;
}

function getBridge<K extends keyof DesktopBridges>(
  name: K
): DesktopBridges[K] | null {
  if (!isDesktopShell()) {
    return null;
  }
  const bridge = getShellWindow()?.[name];
  return isBridgeObject(bridge) ? (bridge as DesktopBridges[K]) : null;
}

/** Shell navigation, external links and deep links; null off the desktop. */
export const getDesktopShellApi = (): DesktopShellApi | null =>
  getBridge("api");

/** Native sign-in bridge; null off the desktop. */
export const getDesktopNativeAuth = (): DesktopNativeAuth | null =>
  getBridge("nativeAuth");

/** System notifications and the dock/taskbar badge; null off the desktop. */
export const getDesktopNotifications = (): DesktopNotifications | null =>
  getBridge("notifications");

/** Desktop app updates; null off the desktop. */
export const getDesktopUpdater = (): DesktopUpdater | null =>
  getBridge("updater");

/** Shell-owned key-value store; null off the desktop. */
export const getDesktopStore = (): DesktopStore | null => getBridge("store");
