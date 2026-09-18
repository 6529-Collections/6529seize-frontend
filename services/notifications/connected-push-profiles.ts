import {
  getConnectedWalletAccounts,
  isAuthJwtUsable,
} from "@/services/auth/auth.utils";

export function isConnectedPushAuth(jwt: string, profileId: string): boolean {
  return (
    isAuthJwtUsable(jwt) &&
    getConnectedWalletAccounts().some(
      (account) => account.profileId === profileId && account.jwt === jwt
    )
  );
}

/** Do not switch the visible profile to register another saved account. */
export async function registerOtherConnectedPushProfiles(
  activeProfileId: string,
  register: (profileId: string, jwt: string) => Promise<boolean>
): Promise<boolean> {
  const registered = new Map<string, string>();
  const accounts = getConnectedWalletAccounts();
  for (const account of accounts) {
    const profileId = account.profileId;
    if (
      !profileId ||
      profileId === activeProfileId ||
      registered.has(profileId)
    )
      continue;
    const jwt = account.jwt;
    if (!jwt || !isConnectedPushAuth(jwt, profileId)) continue;
    if (await register(profileId, jwt)) registered.set(profileId, jwt);
  }
  return getConnectedWalletAccounts().every((account) => {
    if (!account.profileId || account.profileId === activeProfileId)
      return true;
    const jwt = registered.get(account.profileId);
    return !!jwt && isConnectedPushAuth(jwt, account.profileId);
  });
}
