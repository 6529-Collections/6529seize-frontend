import type { DesktopProfileState } from "@/types/desktop-shell";
import {
  getConnectedWalletAccounts,
  getWalletAddress,
  persistAccountsWithActive,
} from "./auth.utils";
import {
  getDesktopProfileMigrationState,
  parseRestoredDesktopProfileState,
} from "./desktop-profile-state";

/** The page's saved profiles, as the snapshot the desktop shell accepts. */
export function getPageDesktopProfileState(): DesktopProfileState {
  const accounts = getConnectedWalletAccounts();
  const activeAddress = getWalletAddress();
  return getDesktopProfileMigrationState({
    accounts: accounts.map((account) => ({ ...account, refreshToken: null })),
    activeAddress: accounts.some(
      (account) =>
        account.address.toLowerCase() === activeAddress?.toLowerCase()
    )
      ? activeAddress
      : null,
  });
}

/**
 * Write the shell's profiles into page storage and return what was written.
 * The shell's answer is untrusted: it is validated first and rejected whole
 * if anything is wrong (see `parseRestoredDesktopProfileState`); addresses
 * are lower-cased whichever case they were saved in. Desktop session refresh
 * tokens stay in the shell; only an older (pre-v2) session's refresh token
 * that this page already holds is kept.
 */
export function restoreDesktopProfileState(
  saved: unknown
): DesktopProfileState {
  const state = parseRestoredDesktopProfileState(saved);
  const localAccounts = getConnectedWalletAccounts();
  persistAccountsWithActive(
    state.accounts.map((account) => {
      const local = localAccounts.find(
        (stored) => stored.address.toLowerCase() === account.address
      );
      const keepsLegacyToken =
        account.authSessionVersion === null &&
        local?.authSessionVersion !== "v2";
      return {
        ...account,
        refreshToken: keepsLegacyToken ? (local?.refreshToken ?? null) : null,
      };
    }),
    state.activeAddress
  );
  return state;
}

/** Whether two snapshots hold the same profiles and active profile. */
export function isSameDesktopProfileState(
  left: DesktopProfileState,
  right: DesktopProfileState
): boolean {
  return (
    JSON.stringify(getDesktopProfileMigrationState(left)) ===
    JSON.stringify(getDesktopProfileMigrationState(right))
  );
}
