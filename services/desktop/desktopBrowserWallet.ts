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
  walletBridgeSendsTransactions,
  walletBridgeSignsSafeTx,
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
const profileListeners = new Set<() => void>();

const setProfiles = (next: ReadonlySet<string>) => {
  profiles = next;
  for (const listener of profileListeners) {
    try {
      listener();
    } catch {
      // A renderer must not interrupt profile cleanup or other subscribers.
    }
  }
};

export function subscribeBrowserWalletProfiles(
  listener: () => void
): () => void {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}

/** True once the list was read from the store (not merely defaulted). */
let profilesRead = false;
let profilesLoading: Promise<boolean> | null = null;
let profilesGeneration = 0;

/** A transaction hash on a chain, for an explorer link. */
interface SentTransaction {
  readonly hash: string;
  readonly chainId: number;
}

/** What the waiting dialog shows. */
type DesktopWalletRequestStatus =
  | { readonly kind: "idle" }
  | {
      readonly kind: "waiting";
      readonly requestCode: string;
      readonly expiresAt: number;
      /** Short payload hash of a drop or decision signature, else null. */
      readonly fingerprint: string | null;
      /** Whether the open request is a transaction. */
      readonly transaction?: boolean;
    }
  | { readonly kind: "cancelled" }
  | { readonly kind: "expired" }
  | { readonly kind: "busy" }
  /** The browser page or the app would not sign it: use the website. */
  | { readonly kind: "refused" }
  /** A transaction forwarding does not send: use the website. */
  | { readonly kind: "transaction" }
  /** This 6529 Desktop does not send transactions: update or use the website. */
  | { readonly kind: "transactionUpdate" }
  /** This 6529 Desktop does not sign Safe transactions: update or use the website. */
  | { readonly kind: "safeTxUpdate" }
  /** The wallet reported a hash 6529 Desktop could not confirm yet. */
  | ({ readonly kind: "transactionUnverified" } & SentTransaction)
  /** The transaction on chain differs from the one requested. */
  | ({ readonly kind: "transactionMismatch" } & SentTransaction)
  /** A transaction approved after its request ended was sent. */
  | ({ readonly kind: "lateTransaction" } & SentTransaction)
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
/** Whether the shell sends transactions with this website's rules. */
let sendsTransactions = false;
/** Whether the shell signs Safe transactions with this website's table. */
let signsSafeTx = false;
let stopLateTransactions: (() => void) | null = null;
/** The chain of the open transaction request, for its explorer link. */
let ownerChainId = 1;

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

/**
 * Shows that a transaction is not sent through forwarding (decided in the
 * app): this 6529 Desktop sends none (`transactionUpdate`), or this one is
 * not on the allow-list (`transaction`).
 */
export function showDesktopWalletTransactionRefusal(): void {
  if (status.kind === "waiting") return;
  setStatus({
    kind: sendsTransactions ? "transaction" : "transactionUpdate",
  });
}

/**
 * Shows that this 6529 Desktop cannot ask the browser wallet to sign this
 * Safe transaction (its SafeTx table differs): update or use the website.
 */
export function showDesktopWalletSafeTxRefusal(): void {
  if (status.kind === "waiting") return;
  setStatus({ kind: "safeTxUpdate" });
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
  const store = getDesktopStore();
  if (!store) return Promise.resolve(false);
  if (profilesLoading) return profilesLoading;
  const generation = profilesGeneration;
  const read: Promise<boolean> = Promise.resolve().then(async () => {
    let loaded = false;
    try {
      const storedProfiles = await store.get(PROFILES_KEY);
      if (generation === profilesGeneration) {
        profilesRead = true;
        setProfiles(readProfiles(storedProfiles));
        loaded = true;
      }
    } catch {
      loaded = false;
    }
    if (profilesLoading === read) profilesLoading = null;
    return loaded;
  });
  profilesLoading = read;
  return read;
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
  const generation = profilesGeneration;
  let read = await readStoredProfiles();
  // One retry: a store that was briefly busy should not lose the change.
  if (!read) read = await readStoredProfiles();
  if (!read || generation !== profilesGeneration) return;
  const next = change(profiles);
  if (next === null) return;
  setProfiles(next);
  if (generation !== profilesGeneration) return;
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
  profilesGeneration += 1;
  profilesRead = true;
  setProfiles(new Set());
  try {
    const store = getDesktopStore();
    if (!store) return;
    await store.set(PROFILES_KEY, []);
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
  sendsTransactions = false;
  signsSafeTx = false;
  const api = getDesktopShellApi();
  const bridge = getDesktopWallet();
  if (!api || !bridge) return [];
  try {
    const info = await api.getInfo();
    if (info.supportsWalletForwarding !== true) return [];
    const capabilities = await bridge.capabilities();
    acceptsContext = walletBridgeAcceptsContext(capabilities);
    sendsTransactions = walletBridgeSendsTransactions(capabilities);
    signsSafeTx = walletBridgeSignsSafeTx(capabilities);
    return parseWalletBridgeCapabilities(capabilities);
  } catch {
    acceptsContext = false;
    sendsTransactions = false;
    signsSafeTx = false;
    return [];
  }
}

/**
 * Whether this 6529 Desktop sends allow-listed transactions to the browser
 * wallet (it reported this website's transaction rules).
 */
export const desktopWalletSendsTransactions = (): boolean => sendsTransactions;

/** Whether requests may carry `context` (the shell said it accepts it). */
export const desktopWalletAcceptsContext = (): boolean => acceptsContext;

/**
 * Whether this 6529 Desktop asks the browser wallet to sign Safe
 * transactions (it reported this website's SafeTx table).
 */
export const desktopWalletSignsSafeTx = (): boolean => signsSafeTx;

const applyShellStatus = (value: unknown) => {
  const shellStatus = parseWalletBridgeStatus(value);
  if (shellStatus.pending) {
    setStatus({
      kind: "waiting",
      requestCode: shellStatus.requestCode,
      expiresAt: shellStatus.expiresAt,
      fingerprint: ownerRequest === null ? null : ownerFingerprint,
      transaction: shellStatus.method === "eth_sendTransaction",
    });
  } else if (status.kind === "waiting") {
    // The answer itself sets the final message; until then, nothing waits.
    setStatus(IDLE);
  }
};

const TRANSACTION_HASH = /^0x[0-9a-fA-F]{64}$/;
/** Chains transactions are forwarded on (Ethereum, Sepolia). */
const TRANSACTION_CHAINS = new Set([1, 11_155_111]);

/** A late transaction event: the hash it reports and its chain, or null. */
function readLateTransaction(value: unknown): SentTransaction | null {
  if (typeof value !== "object" || value === null) return null;
  const event = value as Record<string, unknown>;
  const hash = event["ok"] === true ? event["value"] : event["transactionHash"];
  const chainId = event["chainId"];
  return typeof hash === "string" &&
    TRANSACTION_HASH.test(hash) &&
    typeof chainId === "number" &&
    TRANSACTION_CHAINS.has(chainId)
    ? { hash: hash.toLowerCase(), chainId }
    : null;
}

/** Shows a transaction sent after its request ended, unless one is open. */
function watchLateTransactions(): void {
  const bridge = getDesktopWallet();
  if (!bridge?.onLateTransaction || stopLateTransactions) return;
  stopLateTransactions = bridge.onLateTransaction((value) => {
    const sent = readLateTransaction(value);
    if (sent && status.kind !== "waiting") {
      setStatus({ kind: "lateTransaction", ...sent });
    }
  });
}

/** Follows the shell's request status (the code to show while waiting). */
export function watchDesktopWalletStatus(): void {
  const bridge = getDesktopWallet();
  if (!bridge || stopWatching) return;
  watchLateTransactions();
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

type FinishedKind =
  | "cancelled"
  | "expired"
  | "busy"
  | "refused"
  | "transaction"
  | "unverified"
  | "failed";

/** The shell's refusal words for a transaction outside the rules. */
const TRANSACTION_REFUSALS = new Set([
  "unknown-transaction",
  "transaction-rule",
]);

const FAILURE_STATUS: Partial<Record<string, FinishedKind>> = {
  cancelled: "cancelled",
  expired: "expired",
  busy: "busy",
  refused: "refused",
  unsupported: "refused",
  invalid: "refused",
};

/** The message for a transaction answer, or null for the usual ones. */
function transactionStatus(
  response: WalletBridgeResponse
): DesktopWalletRequestStatus | null {
  if (response.ok || response.transactionHash === undefined) return null;
  const sent = { hash: response.transactionHash, chainId: ownerChainId };
  // Any answer that names a sent transaction shows it (never a plain
  // failure), so the user checks it before trying again.
  return response.reason === "transaction-mismatch"
    ? { kind: "transactionMismatch", ...sent }
    : { kind: "transactionUnverified", ...sent };
}

function finish(response: WalletBridgeResponse): WalletBridgeResponse {
  const forTransaction = transactionStatus(response);
  if (forTransaction) {
    setStatus(forTransaction);
  } else if (response.ok || response.code === "rejected") {
    // A signature, or the user's own decline in the browser: no message.
    setStatus(IDLE);
  } else if (response.reason === "unverified-signature") {
    setStatus({ kind: "unverified" });
  } else if (
    response.reason !== undefined &&
    TRANSACTION_REFUSALS.has(response.reason)
  ) {
    setStatus({ kind: "transaction" });
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
    ownerChainId = request.chainId;
  }
  try {
    const response = parseWalletBridgeResponse(
      await bridge.request(request).catch(() => null),
      request.method === "eth_sendTransaction"
        ? "eth_sendTransaction"
        : "personal_sign"
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
  profilesGeneration += 1;
  profiles = new Set();
  profileListeners.clear();
  profilesRead = false;
  profilesLoading = null;
  statusEventSeen = false;
  ownerRequest = null;
  ownerFingerprint = null;
  acceptsContext = false;
  sendsTransactions = false;
  signsSafeTx = false;
  ownerChainId = 1;
  stopLateTransactions?.();
  stopLateTransactions = null;
  lastRequest = 0;
  status = IDLE;
  stopWatching?.();
  stopWatching = null;
  listeners.clear();
}
