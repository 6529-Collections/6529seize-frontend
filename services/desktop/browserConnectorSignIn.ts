import {
  BROWSER_CONNECTOR_TIMEOUT_MS,
  buildBrowserConnectorUrl,
  createBrowserConnectorRequestId,
  normalizeDesktopScheme,
} from "@/lib/desktop/browserConnector";
import { getDesktopShellApi } from "@/helpers/desktop-shell";
import type { DesktopWalletSetup } from "./desktopConnectDialog";

/**
 * The desktop side of the browser connector: one sign-in request at a time,
 * made here, opened in the system browser, and matched when the app's link
 * comes back. A returned link is accepted only for the request that is still
 * open, once, before it expires.
 */

type BrowserConnectorStatus =
  | "idle"
  | "waiting"
  | "signing-in"
  | "signed-in"
  | "failed"
  | "expired";

interface PendingRequest {
  readonly requestId: string;
  readonly expiresAt: number;
  readonly timer: ReturnType<typeof setTimeout>;
  readonly setup: DesktopWalletSetup | undefined;
  readonly isCurrent: () => boolean;
}

let pending: PendingRequest | null = null;
// The latest start; a cancel or a newer start invalidates an earlier one
// that is still waiting for the shell's info.
let operation = 0;
let status: BrowserConnectorStatus = "idle";
const listeners = new Set<() => void>();

export function setBrowserConnectorStatus(next: BrowserConnectorStatus): void {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

export const getBrowserConnectorStatus = (): BrowserConnectorStatus => status;
export const getServerBrowserConnectorStatus = (): BrowserConnectorStatus =>
  "idle";

export function subscribeBrowserConnectorStatus(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const clearPending = () => {
  if (pending) clearTimeout(pending.timer);
  pending = null;
};

/** Back to idle after a sign-in finished, failed or expired. */
export function resetFinishedBrowserConnectorStatus(): void {
  if (status !== "waiting" && status !== "signing-in") {
    setBrowserConnectorStatus("idle");
  }
}

/** Stop waiting for the browser (the user cancelled). */
export function cancelBrowserConnectorSignIn(): void {
  operation += 1;
  clearPending();
  setBrowserConnectorStatus("idle");
}

/**
 * Open the browser connector in the system browser. The return link uses
 * the scheme this desktop build reports (`window.api.getInfo().scheme`);
 * there is no default, so a build that reports none cannot start.
 */
export async function startBrowserConnectorSignIn(
  setup?: DesktopWalletSetup
): Promise<void> {
  const api = getDesktopShellApi();
  if (!api) {
    throw new Error("The browser connector is available only in 6529 Desktop");
  }
  operation += 1;
  const current = operation;
  const isCurrent = () => current === operation && !setup?.signal.aborted;
  if (!isCurrent()) return;
  setup?.onStatus("opening-browser");
  const info = await api.getInfo();
  // Cancelled, or replaced by a newer start, while the shell answered.
  // Everything below runs without another await, so this one check covers
  // creating the request and opening the browser.
  if (!isCurrent()) return;
  const scheme = normalizeDesktopScheme(info.scheme);
  if (!scheme) {
    throw new Error("6529 Desktop did not report its link scheme");
  }
  clearPending();
  const requestId = createBrowserConnectorRequestId();
  const expiresAt = Date.now() + BROWSER_CONNECTOR_TIMEOUT_MS;
  pending = {
    requestId,
    expiresAt,
    setup,
    isCurrent,
    timer: setTimeout(() => {
      if (pending?.requestId !== requestId) return;
      pending = null;
      setBrowserConnectorStatus("expired");
      setup?.onStatus("failed");
    }, BROWSER_CONNECTOR_TIMEOUT_MS),
  };
  setBrowserConnectorStatus("waiting");
  setup?.onStatus("browser");
  if (!isCurrent()) return;
  try {
    api.openExternal(
      buildBrowserConnectorUrl({
        origin: window.location.origin,
        scheme,
        requestId,
        expiresAt,
      })
    );
  } catch (error) {
    // No browser opened: do not leave a request waiting for nothing.
    clearPending();
    setBrowserConnectorStatus("failed");
    throw error;
  }
}

/**
 * Consume the open request if `requestId` is it and it has not expired.
 * Each request is accepted at most once.
 */
export function takeBrowserConnectorRequest(
  requestId: string
): PendingRequest | null {
  if (pending?.requestId !== requestId || !pending.isCurrent()) return null;
  const request = pending;
  clearPending();
  if (request.expiresAt > Date.now()) return request;
  setBrowserConnectorStatus("expired");
  request.setup?.onStatus("failed");
  return null;
}

/** @api Resets the module state between tests. */
export function __resetBrowserConnectorForTests(): void {
  operation += 1;
  clearPending();
  status = "idle";
  listeners.clear();
}
