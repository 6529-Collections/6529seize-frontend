import { disconnect, type Config } from "@wagmi/core";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { safeSessionStorage } from "@/helpers/safeSessionStorage";

// The Wagmi adapter persists live connections with its default "wagmi"
// storage prefix and its "store" persistence name.
export const WAGMI_PERSISTED_STATE_KEY = "wagmi.store";

// The bundler's runtime caches a failed chunk request for the life of the
// page: a later import() of the same chunk rejects again without a network
// request. Once a wallet chunk fails, only a fresh page load can fetch it.
let walletChunkLoadFailed = false;

const RELOAD_MARKER_KEY = "6529.walletChunkReloadAt";
// A connect intent that runs on every load must not reload in a loop while
// the chunk keeps failing.
const MIN_RELOAD_INTERVAL_MS = 60_000;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && error.name === "ChunkLoadError";
}

/** Remember a failed wallet chunk so the next connect intent reloads. */
export function noteWalletChunkFailure(error: unknown): void {
  if (isChunkLoadError(error)) {
    walletChunkLoadFailed = true;
  }
}

export function hasWalletChunkLoadFailed(): boolean {
  return walletChunkLoadFailed;
}

/**
 * Reloads the page so a failed wallet chunk is fetched again. Returns false,
 * without reloading, when this tab already reloaded for that reason less
 * than a minute ago.
 */
export function reloadToRetryWalletChunks(
  reloadPage: () => void = () => globalThis.location.reload()
): boolean {
  const now = Date.now();
  let lastReloadAt = Number.NaN;
  try {
    lastReloadAt = Number(safeSessionStorage.getItem(RELOAD_MARKER_KEY));
  } catch {
    // Storage can be unavailable; reloading at most once is still safe.
  }
  if (
    Number.isFinite(lastReloadAt) &&
    now - lastReloadAt < MIN_RELOAD_INTERVAL_MS
  ) {
    return false;
  }
  try {
    safeSessionStorage.setItem(RELOAD_MARKER_KEY, String(now));
  } catch {
    return false;
  }
  reloadPage();
  return true;
}

/** Forgets the connection Wagmi would restore on the next page load. */
function forgetPersistedWagmiConnection(): void {
  safeLocalStorage.removeItem(WAGMI_PERSISTED_STATE_KEY);
}

// The wallet stack's Wagmi config, once its adapter exists.
let walletStackWagmiConfig: Config | null = null;

export function setWalletStackWagmiConfig(config: Config | null): void {
  walletStackWagmiConfig = config;
}

/**
 * Disconnects without AppKit, for when a wallet chunk could not load: Wagmi
 * disconnects any connection the wallet stack holds, and the stored
 * connection is forgotten so the next page load does not restore it.
 */
export async function disconnectWithoutAppKit(): Promise<void> {
  try {
    if (walletStackWagmiConfig) {
      await disconnect(walletStackWagmiConfig);
    }
  } finally {
    forgetPersistedWagmiConnection();
  }
}

export function resetWalletChunkRecoveryForTests(): void {
  walletChunkLoadFailed = false;
  walletStackWagmiConfig = null;
}
