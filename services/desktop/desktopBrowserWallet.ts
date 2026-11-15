import {
  getDesktopShellApi,
  getDesktopStore,
  getDesktopWallet,
} from "@/helpers/desktop-shell";
import {
  parseWalletBridgeCapabilities,
  parseWalletBridgeResponse,
  parseWalletBridgeStatus,
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
let profilesLoaded: Promise<void> | null = null;

/** What the waiting dialog shows. */
type DesktopWalletRequestStatus =
  | { readonly kind: "idle" }
  | {
      readonly kind: "waiting";
      readonly requestCode: string;
      readonly expiresAt: number;
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
  setStatus({ kind: "refused" });
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

/** Loads the browser-wallet profile list from the shell store once. */
export function loadBrowserWalletProfiles(): Promise<void> {
  profilesLoaded ??= (async () => {
    const store = getDesktopStore();
    if (!store) return;
    try {
      profiles = readProfiles(await store.get(PROFILES_KEY));
    } catch {
      profiles = new Set();
    }
  })();
  return profilesLoaded;
}

export const isBrowserWalletProfile = (address: string | null | undefined) =>
  typeof address === "string" && profiles.has(address.toLowerCase());

async function saveProfiles(next: ReadonlySet<string>): Promise<void> {
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
    await loadBrowserWalletProfiles();
    if (!profiles.has(normalized)) {
      await saveProfiles(new Set([...profiles, normalized]));
    }
  } catch {
    // Forwarding is then simply not offered for this profile.
  }
}

/**
 * Forgets `address` when it connects another way (WalletConnect), so
 * forwarding is never offered to that profile. Never throws.
 */
export async function forgetBrowserWalletProfile(
  address: string
): Promise<void> {
  const normalized = address.toLowerCase();
  try {
    await loadBrowserWalletProfiles();
    if (profiles.has(normalized)) {
      await saveProfiles(
        new Set([...profiles].filter((item) => item !== normalized))
      );
    }
  } catch {
    // The flag stays; the connector still signs only for the active profile.
  }
}

/**
 * The methods the shell forwards: none unless it advertises forwarding
 * (`getInfo().supportsWalletForwarding === true`) and defines the bridge.
 */
export async function getDesktopWalletMethods(): Promise<
  readonly WalletForwardingMethod[]
> {
  const api = getDesktopShellApi();
  const bridge = getDesktopWallet();
  if (!api || !bridge) return [];
  try {
    const info = await api.getInfo();
    if (info.supportsWalletForwarding !== true) return [];
    return parseWalletBridgeCapabilities(await bridge.capabilities());
  } catch {
    return [];
  }
}

const applyShellStatus = (value: unknown) => {
  const shellStatus = parseWalletBridgeStatus(value);
  if (shellStatus.pending) {
    setStatus({
      kind: "waiting",
      requestCode: shellStatus.requestCode,
      expiresAt: shellStatus.expiresAt,
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
  stopWatching = bridge.onStatusChange(applyShellStatus);
  bridge
    .status()
    .then(applyShellStatus)
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
 */
export async function runDesktopWalletRequest(
  request: WalletRequestInput
): Promise<WalletBridgeResponse> {
  const bridge = getDesktopWallet();
  if (!bridge) return { ok: false, code: "unsupported" };
  const answer = await bridge.request(request).catch(() => null);
  return finish(parseWalletBridgeResponse(answer));
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
  profilesLoaded = null;
  status = IDLE;
  stopWatching?.();
  stopWatching = null;
  listeners.clear();
}
