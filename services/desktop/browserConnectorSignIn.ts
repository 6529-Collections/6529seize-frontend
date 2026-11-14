import {
  BROWSER_CONNECTOR_TIMEOUT_MS,
  buildBrowserConnectorUrl,
  createBrowserConnectorRequestId,
  normalizeDesktopScheme,
} from "@/lib/desktop/browserConnector";
import { getDesktopShellApi } from "@/helpers/desktop-shell";

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
}

let pending: PendingRequest | null = null;
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

/** Stop waiting for the browser (the user cancelled). */
export function cancelBrowserConnectorSignIn(): void {
  clearPending();
  setBrowserConnectorStatus("idle");
}

/**
 * Open the browser connector in the system browser. The return link uses
 * the scheme this desktop build reports (`window.api.getInfo().scheme`);
 * there is no default, so a build that reports none cannot start.
 */
export async function startBrowserConnectorSignIn(): Promise<void> {
  const api = getDesktopShellApi();
  if (!api) {
    throw new Error("The browser connector is available only in 6529 Desktop");
  }
  const info = await api.getInfo();
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
    timer: setTimeout(() => {
      if (pending?.requestId !== requestId) return;
      pending = null;
      setBrowserConnectorStatus("expired");
    }, BROWSER_CONNECTOR_TIMEOUT_MS),
  };
  setBrowserConnectorStatus("waiting");
  api.openExternal(
    buildBrowserConnectorUrl({
      origin: window.location.origin,
      scheme,
      requestId,
      expiresAt,
    })
  );
}

/**
 * Consume the open request if `requestId` is it and it has not expired.
 * Each request is accepted at most once.
 */
export function takeBrowserConnectorRequest(requestId: string): boolean {
  if (pending?.requestId !== requestId) return false;
  const isLive = pending.expiresAt > Date.now();
  clearPending();
  if (!isLive) setBrowserConnectorStatus("expired");
  return isLive;
}

export function __resetBrowserConnectorForTests(): void {
  clearPending();
  status = "idle";
  listeners.clear();
}
