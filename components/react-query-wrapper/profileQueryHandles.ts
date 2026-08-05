import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export const getHandlesFromProfile = (profile: ApiIdentity): string[] => {
  const handles: string[] = [];
  if (profile.handle) handles.push(profile.handle.toLowerCase());
  profile.wallets?.forEach((wallet) => {
    if (wallet.display) handles.push(wallet.display.toLowerCase());
    handles.push(wallet.wallet.toLowerCase());
  });
  return handles;
};
