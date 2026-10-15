import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import {
  getWalletAddress,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";

// The Wagmi adapter persists live connections with its default "wagmi"
// storage prefix and its "store" persistence name.
const WAGMI_PERSISTED_STATE_KEY = "wagmi.store";

type PersistedWagmiState = {
  readonly state?: {
    readonly connections?: { readonly value?: unknown } | null;
  } | null;
};

function hasPersistedWagmiConnection(): boolean {
  const serializedState = safeLocalStorage.getItem(WAGMI_PERSISTED_STATE_KEY);
  if (!serializedState) {
    return false;
  }

  const persistedState = JSON.parse(
    serializedState
  ) as PersistedWagmiState | null;
  const connections = persistedState?.state?.connections?.value;
  return Array.isArray(connections) && connections.length > 0;
}

/**
 * Whether this browser holds a 6529 wallet session or a wallet connection
 * that Wagmi would restore. Only then does the wallet stack load on mount;
 * other visitors load it when they ask to connect.
 */
export function hasPersistedWalletSession(): boolean {
  try {
    return getWalletAddress() !== null || hasPersistedWagmiConnection();
  } catch {
    // Unreadable storage cannot hold a session to restore.
    return false;
  }
}

/** Notifies when a session may have been stored in this or another tab. */
export function subscribeToWalletSessionChanges(
  onChange: () => void
): () => void {
  globalThis.addEventListener(WALLET_ACCOUNTS_UPDATED_EVENT, onChange);
  globalThis.addEventListener("storage", onChange);
  return () => {
    globalThis.removeEventListener(WALLET_ACCOUNTS_UPDATED_EVENT, onChange);
    globalThis.removeEventListener("storage", onChange);
  };
}
