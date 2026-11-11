import {
  type E2eeSignOutScope,
  signOutWithE2eeChoice,
} from "@/components/e2ee/signout/e2eeSignOut";
import { removeCreateWaveDrafts } from "@/helpers/waves/create-wave-draft.helpers";
import { clearAllWaveDrafts } from "@/helpers/waves/wave-draft.helpers";
import {
  type ConnectedWalletAccount,
  getConnectedWalletAccounts,
  getWalletAddress,
} from "@/services/auth/auth.utils";
import { assertStoredWalletIsDisplayed } from "@/services/auth/displayed-wallet-guard";

type SignedOutAccount = Pick<ConnectedWalletAccount, "address" | "profileId">;

const sameAddress = (left: string, right: string): boolean =>
  left.toLowerCase() === right.toLowerCase();

function getAccountsToSignOut(scope: E2eeSignOutScope): SignedOutAccount[] {
  const accounts = getConnectedWalletAccounts();
  const activeAddress = getWalletAddress();
  if (scope === "all" && accounts.length > 0) {
    return accounts.map(({ address, profileId }) => ({ address, profileId }));
  }
  if (!activeAddress) {
    return [];
  }
  const active = accounts.find((account) =>
    sameAddress(account.address, activeAddress)
  );
  return [{ address: activeAddress, profileId: active?.profileId ?? null }];
}

/**
 * Removes the unsent wave drafts an explicit sign-out leaves in this browser
 * for the accounts it signed out. The device key and its grant note stay, so
 * signing in again needs no new grant and the first signed write after it
 * still waits for its signature. Accounts that are still signed in (the
 * sign-out did not run) keep their drafts.
 */
function removeSignedOutLocalData(
  scope: E2eeSignOutScope,
  candidates: readonly SignedOutAccount[]
): void {
  const remaining = getConnectedWalletAccounts();
  const signedOut = candidates.filter(
    (candidate) =>
      !remaining.some((account) =>
        sameAddress(account.address, candidate.address)
      )
  );
  if (signedOut.length === 0) {
    return;
  }
  // Chat drafts are kept per tab and keyed by wave only.
  clearAllWaveDrafts();
  for (const account of signedOut) {
    const profileStillSignedIn =
      account.profileId !== null &&
      remaining.some(({ profileId }) => profileId === account.profileId);
    if (!profileStillSignedIn) {
      removeCreateWaveDrafts({ profileId: account.profileId });
    }
  }
  if (scope === "all" && remaining.length === 0) {
    removeCreateWaveDrafts();
  }
}

/**
 * Runs a sign-out the user chose (with the encrypted-messages choice when it
 * applies), then removes the signed-out profile's local drafts. A session
 * that expires or is replaced does not come through here, so its drafts stay.
 * A sign-out acts on the stored selection, so it is refused (and this tab
 * catches up) while another tab has selected a profile this tab does not
 * show yet.
 */
export async function signOutAndRemoveLocalData(
  scope: E2eeSignOutScope,
  signOut: () => void | Promise<void>
): Promise<void> {
  assertStoredWalletIsDisplayed();
  await signOutWithE2eeChoice(scope, async () => {
    assertStoredWalletIsDisplayed();
    const candidates = getAccountsToSignOut(scope);
    await signOut();
    removeSignedOutLocalData(scope, candidates);
  });
}
