export const walletListsMatch = (
  lhs: readonly string[] | null,
  rhs: readonly string[] | null
): boolean => {
  if (lhs === rhs) return true;
  if (!lhs || !rhs) return lhs === rhs;
  if (lhs.length !== rhs.length) return false;
  const a = lhs.map((wallet) => wallet.trim().toLowerCase());
  const b = rhs.map((wallet) => wallet.trim().toLowerCase());
  const seen = new Map<string, number>();
  for (const wallet of a) {
    seen.set(wallet, (seen.get(wallet) ?? 0) + 1);
  }
  for (const wallet of b) {
    const nextCount = (seen.get(wallet) ?? 0) - 1;
    if (nextCount < 0) {
      return false;
    }
    if (nextCount === 0) {
      seen.delete(wallet);
    } else {
      seen.set(wallet, nextCount);
    }
  }
  return seen.size === 0;
};

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
