import { isDirectProfileAuthSession } from "@/components/auth/auth-session-scope";
import { getConnectedWalletAccounts } from "@/services/auth/auth.utils";

/**
 * Whether the active session acts as the wallet's own profile. The server
 * returns the caller's own profile id as the session role, so a role alone
 * does not mean a proxy; a proxy session's role is another profile's id.
 * Unknown profile ids fail safe: nothing is signed as the wallet.
 */
export function isOwnProfileSession(
  address: string,
  ownProfileId: string | null | undefined
): boolean {
  const account = getConnectedWalletAccounts().find(
    (candidate) => candidate.address.toLowerCase() === address.toLowerCase()
  );
  if (account === undefined) {
    return false;
  }
  return isDirectProfileAuthSession({
    authRole: account.role,
    profileId: account.profileId ?? ownProfileId,
    hasActiveProxy: false,
  });
}
