import {
  AUTH_STORAGE_KEYS,
  AUTH_TOKEN_CHANGED_EVENT,
  getWalletAddress,
  getWalletRole,
  PROFILE_SWITCHED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { clearDocumentationDraftRecovery } from "./draft-recovery";

const AUTH_KEYS = new Set<string>(Object.values(AUTH_STORAGE_KEYS));

let watching = false;
let wallet: string | null = null;
let role: string | null = null;

function revokeRecovery() {
  clearDocumentationDraftRecovery();
  wallet = getWalletAddress()?.toLowerCase() ?? null;
  role = getWalletRole();
}
function checkAuth() {
  // Session renewal retains the authenticated account; logout removes or switches it.
  const currentWallet = getWalletAddress()?.toLowerCase() ?? null;
  if (
    currentWallet === null ||
    wallet !== currentWallet ||
    role !== getWalletRole()
  )
    revokeRecovery();
}
function storageChanged(event: StorageEvent) {
  if (event.key === null || AUTH_KEYS.has(event.key)) checkAuth();
}

/** Keep logout/switch cleanup active even while the editor route is unmounted. */
export function watchDocumentationRecoveryAuth(): void {
  if (watching) return;
  watching = true;
  wallet = getWalletAddress()?.toLowerCase() ?? null;
  role = getWalletRole();
  globalThis.addEventListener(PROFILE_SWITCHED_EVENT, revokeRecovery);
  globalThis.addEventListener(AUTH_TOKEN_CHANGED_EVENT, checkAuth);
  globalThis.addEventListener(WALLET_ACCOUNTS_UPDATED_EVENT, checkAuth);
  globalThis.addEventListener("storage", storageChanged);
}
