import { IProfileAndConsolidations } from "../../../entities/IProfile";

/**
 * Extracts all relevant identifiers (handle, ENS names, addresses) from a profile
 * Used for cache invalidation and updating
 * 
 * @param profile The user profile with consolidation information
 * @returns Array of lowercase handles, ENS names and wallet addresses
 */
export const getHandlesFromProfile = (
  profile: IProfileAndConsolidations
): string[] => {
  const handles: string[] = [];
  if (profile.profile?.handle) {
    handles.push(profile.profile?.handle.toLowerCase());
  }

  profile.consolidation.wallets.forEach((wallet) => {
    if (wallet.wallet.ens) {
      handles.push(wallet.wallet.ens.toLowerCase());
    }
    handles.push(wallet.wallet.address.toLowerCase());
  });

  return handles;
};