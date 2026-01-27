interface WalletInfoLike {
  name?: string | null | undefined;
  type?: string | null | undefined;
}

const SAFE_WALLET_NAMES = new Set([
  "safe",
  "gnosis safe",
  "safe wallet",
  "safe{wallet}",
]);

const SAFE_WALLET_TYPES = new Set(["safe", "gnosis-safe", "gnosis_safe"]);

const normalize = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? "";

export const isSafeWalletInfo = (walletInfo?: WalletInfoLike): boolean => {
  if (!walletInfo) return false;

  const name = normalize(walletInfo.name);
  if (name && SAFE_WALLET_NAMES.has(name)) {
    return true;
  }

  const type = normalize(walletInfo.type);
  if (type && SAFE_WALLET_TYPES.has(type)) {
    return true;
  }

  return false;
};
