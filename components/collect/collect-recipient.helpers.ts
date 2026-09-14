import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { getAddress, isAddress, zeroAddress } from "viem";

export function collectProfileWallets(profile: ApiIdentity | null) {
  if (!profile) return [];
  const wallets =
    profile.wallets && profile.wallets.length > 0
      ? profile.wallets
      : [{ wallet: profile.primary_wallet, display: profile.display, tdh: 0 }];
  return wallets
    .filter(
      (wallet, index) =>
        isAddress(wallet.wallet) &&
        !areEqualAddresses(wallet.wallet, zeroAddress) &&
        wallets.findIndex((item) =>
          areEqualAddresses(item.wallet, wallet.wallet)
        ) === index
    )
    .map((wallet) => ({ ...wallet, wallet: getAddress(wallet.wallet) }));
}

export function isCollectProfileWallet(
  profile: ApiIdentity | null,
  address: string
) {
  return collectProfileWallets(profile).some((wallet) =>
    areEqualAddresses(wallet.wallet, address)
  );
}

export function defaultCollectRecipient(
  profile: ApiIdentity | null,
  payingWallet?: string
) {
  const wallets = collectProfileWallets(profile);
  return (
    wallets.find((wallet) => areEqualAddresses(wallet.wallet, payingWallet))
      ?.wallet ??
    wallets.find((wallet) =>
      areEqualAddresses(wallet.wallet, profile?.primary_wallet)
    )?.wallet ??
    wallets[0]?.wallet ??
    ""
  );
}
