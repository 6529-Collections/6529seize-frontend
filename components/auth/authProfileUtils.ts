import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";

const normalizeWalletAddress = (walletAddress: string): string =>
  walletAddress.trim().toLowerCase();

export const isProfileForAddress = ({
  profile,
  address,
}: {
  readonly profile: ApiIdentity | null;
  readonly address: string | null | undefined;
}): boolean => {
  if (!profile || !address) {
    return false;
  }

  const normalizedAddress = normalizeWalletAddress(address);
  const walletAddresses = [
    profile.primary_wallet,
    ...(profile.wallets?.map((wallet) => wallet.wallet) ?? []),
  ].filter(
    (walletAddress): walletAddress is string =>
      typeof walletAddress === "string" && walletAddress.trim().length > 0
  );

  if (walletAddresses.length === 0) {
    return false;
  }

  return walletAddresses.some(
    (walletAddress) =>
      normalizeWalletAddress(walletAddress) === normalizedAddress
  );
};

export const isPublicWave = (wave: ApiWave): boolean =>
  !wave.visibility?.scope?.group;
