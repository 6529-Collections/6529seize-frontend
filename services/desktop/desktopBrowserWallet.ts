import {
  getDesktopShellApi,
  getDesktopStore,
  getDesktopWallet,
} from "@/helpers/desktop-shell";
import {
  parseWalletBridgeCapabilities,
  parseWalletBridgeResponse,
  parseWalletBridgeStatus,
  walletBridgeAcceptsContext,
  type WalletBridgeResponse,
  type WalletForwardingMethod,
  type WalletRequestInput,
} from "@/lib/desktop/wallet-forwarding";

/**
 * 6529 Desktop wallet forwarding, in-app side: which profiles may use it,
 * whether the shell offers it, and the one request that is open. The shell
 * holds the request id and opens the browser; this module sees only the
 * short request code and the answer.
 */

/** Profiles (lower-case addresses) that signed in with a browser wallet. */
const PROFILES_KEY = "desktop-browser-wallet-profiles";
const ADDRESS = /^0x[0-9a-f]{40}$/;

let profiles: ReadonlySet<string> = new Set();
/** True once the list was read from the store (not merely defaulted). */
let profilesRead = false;
let profilesLoading: Promise<boolean> | null = null;

/** What the waiting dialog shows. */
type DesktopWalletRequestStatus =
  | { readonly kind: "idle" }
  | {
      readonly kind: "waiting";
      readonly requestCode: string;
      readonly expiresAt: number;
      /** Short payload hash of a drop or decision signature, else null. */
      readonly fingerprint: string | null;
    }
  | { readonly kind: "cancelled" }
  | { readonly kind: "expired" }
  | { readonly kind: "busy" }
  /** The browser page or the app would not sign it: use the website. */
  | { readonly kind: "refused" }
  /** A signature that is not the account's own (a smart-contract wallet). */
  | { readonly kind: "unverified" }
  | { readonly kind: "failed" };

const IDLE: DesktopWalletRequestStatus = { kind: "idle" };
let status: DesktopWalletRequestStatus = IDLE;
const listeners = new Set<() => void>();
let stopWatching: (() => void) | null = null;
/** True once the shell sent a status event (newer than any snapshot). */
let statusEventSeen = false;
/** The request whose outcome the dialog shows; later ones are refused busy. */
let ownerRequest: number | null = null;
let lastRequest = 0;
/** The open request's content fingerprint, shown next to its code. */
let ownerFingerprint: string | null = null;
/** Whether the shell accepts a request's `context` (from capabilities). */
let acceptsContext = false;

const setStatus = (next: DesktopWalletRequestStatus) => {
  status = next;
  listeners.forEach((listener) => listener());
};

export const getDesktopWalletRequestStatus = (): DesktopWalletRequestStatus =>
  status;
export const getServerDesktopWalletRequestStatus =
  (): DesktopWalletRequestStatus => IDLE;

export function subscribeDesktopWalletRequestStatus(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Clears a finished request's message. */
export function dismissDesktopWalletRequestStatus(): void {
  if (status.kind !== "waiting") setStatus(IDLE);
}

/** Shows a refusal decided in the app, before the shell is asked. */
export function showDesktopWalletRefusal(): void {
  // Never hide a request that is open in the browser.
  if (status.kind !== "waiting") setStatus({ kind: "refused" });
}

const readProfiles = (value: unknown): ReadonlySet<string> =>
  new Set(
    Array.isArray(value)
      ? value.filter(
          (item): item is string =>
            typeof item === "string" && ADDRESS.test(item)
        )
      : []
  );

/**
 * Reads the browser-wallet profile list from the shell store. Resolves
 * true once it has been read; false when the store is missing or the read
 * failed (a later call tries again). A failed read is never treated as an
 * empty list for writing.
 */
function readStoredProfiles(): Promise<boolean> {
  if (profilesRead) return Promise.resolve(true);
  profilesLoading ??= (async () => {
    try {
      const store = getDesktopStore();
      if (!store) return false;
      profiles = readProfiles(await store.get(PROFILES_KEY));
      profilesRead = true;
      return true;
    } catch {
      return false;
    } finally {
      profilesLoading = null;
    }
  })();
  return profilesLoading;
}

/** Loads the browser-wallet profile list (an unreadable list offers none). */
export async function loadBrowserWalletProfiles(): Promise<void> {
  await readStoredProfiles();
}

export const isBrowserWalletProfile = (address: string | null | undefined) =>
  typeof address === "string" && profiles.has(address.toLowerCase());

/**
 * Changes the stored list from a baseline that was really read, retrying
 * the read once; never writes when the list could not be read, so other
 * profiles' entries are never lost.
 */
async function updateProfiles(
  change: (current: ReadonlySet<string>) => ReadonlySet<string> | null
): Promise<void> {
  let read = await readStoredProfiles();
  // One retry: a store that was briefly busy should not lose the change.
  if (!read) read = await readStoredProfiles();
  if (!read) return;
  const next = change(profiles);
  if (next === null) return;
  profiles = next;
  await getDesktopStore()?.set(PROFILES_KEY, [...next]);
}

/**
 * Remembers that `address` signed in with a browser wallet, so wallet
 * forwarding is offered to it. Never throws: sign-in must not depend on it.
 */
export async function markBrowserWalletProfile(address: string): Promise<void> {
  const normalized = address.toLowerCase();
  if (!ADDRESS.test(normalized)) return;
  try {
    await updateProfiles((current) =>
      current.has(normalized) ? null : new Set([...current, normalized])
    );
  } catch {
    // Forwarding is then simply not offered for this profile.
  }
}

/**
 * Forgets `address` when it connects another way (WalletConnect) or signs
 * out, so forwarding is never offered to that profile until it signs in
 * with a browser wallet again. Never throws.
 */
export async function forgetBrowserWalletProfile(
  address: string
): Promise<void> {
  const normalized = address.toLowerCase();
  try {
    await updateProfiles((current) =>
      current.has(normalized)
        ? new Set([...current].filter((item) => item !== normalized))
        : null
    );
  } catch {
    // The flag stays; the connector still signs only for the active profile.
  }
}

/**
 * Forgets every browser-wallet profile (sign out of all profiles). Clears
 * the stored list even when it could not be read first: nothing in it is
 * kept. Never throws.
 */
export async function forgetAllBrowserWalletProfiles(): Promise<void> {
  profiles = new Set();
  try {
    const store = getDesktopStore();
    if (!store) return;
    await store.set(PROFILES_KEY, []);
    profilesRead = true;
  } catch {
    // The connector still signs only for a profile with a desktop session.
  }
}

/**
 * The methods the shell forwards: none unless it advertises forwarding
 * (`getInfo().supportsWalletForwarding === true`) and defines the bridge.
 * Also notes whether it accepts a request's `context`.
 */
export async function getDesktopWalletMethods(): Promise<
  readonly WalletForwardingMethod[]
> {
  acceptsContext = false;
  const api = getDesktopShellApi();
  const bridge = getDesktopWallet();
  if (!api || !bridge) return [];
  try {
    const info = await api.getInfo();
    if (info.supportsWalletForwarding !== true) return [];
    const capabilities = await bridge.capabilities();
    acceptsContext = walletBridgeAcceptsContext(capabilities);
    return parseWalletBridgeCapabilities(capabilities);
  } catch {
    acceptsContext = false;
    return [];
  }
}

/** Whether requests may carry `context` (the shell said it accepts it). */
export const desktopWalletAcceptsContext = (): boolean => acceptsContext;

const applyShellStatus = (value: unknown) => {
  const shellStatus = parseWalletBridgeStatus(value);
  if (shellStatus.pending) {
    setStatus({
      kind: "waiting",
      requestCode: shellStatus.requestCode,
      expiresAt: shellStatus.expiresAt,
      fingerprint: ownerRequest === null ? null : ownerFingerprint,
    });
  } else if (status.kind === "waiting") {
    // The answer itself sets the final message; until then, nothing waits.
    setStatus(IDLE);
  }
};

/** Follows the shell's request status (the code to show while waiting). */
export function watchDesktopWalletStatus(): void {
  const bridge = getDesktopWallet();
  if (!bridge || stopWatching) return;
  stopWatching = bridge.onStatusChange((value) => {
    statusEventSeen = true;
    applyShellStatus(value);
  });
  bridge
    .status()
    .then((value) => {
      // A snapshot taken before an event arrived is older than it.
      if (!statusEventSeen) applyShellStatus(value);
    })
    .catch(() => undefined);
}

type FinishedKind = Exclude<
  DesktopWalletRequestStatus["kind"],
  "idle" | "waiting"
>;

const FAILURE_STATUS: Partial<Record<string, FinishedKind>> = {
  cancelled: "cancelled",
  expired: "expired",
  busy: "busy",
  refused: "refused",
  unsupported: "refused",
  invalid: "refused",
};

function finish(response: WalletBridgeResponse): WalletBridgeResponse {
  if (response.ok || response.code === "rejected") {
    // A signature, or the user's own decline in the browser: no message.
    setStatus(IDLE);
  } else if (response.reason === "unverified-signature") {
    setStatus({ kind: "unverified" });
  } else {
    setStatus({ kind: FAILURE_STATUS[response.code] ?? "failed" });
  }
  return response;
}

/**
 * Asks the shell to open one wallet request in the browser and waits for
 * its answer. The shell allows one request at a time (`busy`).
 * `fingerprint` is the short payload hash the browser page also shows.
 */
export async function runDesktopWalletRequest(
  request: WalletRequestInput,
  fingerprint: string | null = null
): Promise<WalletBridgeResponse> {
  const bridge = getDesktopWallet();
  if (!bridge) return { ok: false, code: "unsupported" };
  lastRequest += 1;
  const id = lastRequest;
  // Only the request that was open first owns the dialog: a second one
  // (refused busy by the shell) must not replace its code and controls.
  if (ownerRequest === null) {
    ownerRequest = id;
    ownerFingerprint = fingerprint;
  }
  try {
    const response = parseWalletBridgeResponse(
      await bridge.request(request).catch(() => null)
    );
    return ownerRequest === id ? finish(response) : response;
  } finally {
    if (ownerRequest === id) {
      ownerRequest = null;
      ownerFingerprint = null;
    }
  }
}

/** Stops waiting for the browser; the shell answers `cancelled`. */
export function cancelDesktopWalletRequest(): void {
  getDesktopWallet()
    ?.cancel()
    .catch(() => undefined);
}

/** Opens the open request's browser page again (the tab was closed). */
export function reopenDesktopWalletRequest(): void {
  getDesktopWallet()
    ?.reopen()
    .catch(() => undefined);
}

/** @api Resets the module state between tests. */
export function __resetDesktopBrowserWalletForTests(): void {
  profiles = new Set();
  profilesRead = false;
  profilesLoading = null;
  statusEventSeen = false;
  ownerRequest = null;
  ownerFingerprint = null;
  acceptsContext = false;
  lastRequest = 0;
  status = IDLE;
  stopWatching?.();
  stopWatching = null;
  listeners.clear();
}
