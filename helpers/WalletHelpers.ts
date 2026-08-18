export const dedupeWallets = (wallets: readonly string[]): string[] => {
  const seen = new Set<string>();
  return wallets.filter((wallet) => {
    const normalised = wallet.trim().toLowerCase();
    if (seen.has(normalised)) {
      return false;
    }
    seen.add(normalised);
    return true;
  });
};
