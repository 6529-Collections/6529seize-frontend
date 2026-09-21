import type { ConnectedWalletAccount } from "@/services/auth/auth.utils";
import { normalizeAddress } from "./seizeConnectWalletState";

export function mergeConnectedAccountUnreadCounts(
  jwtCounts: Readonly<Record<string, number>>,
  activeAccount: ConnectedWalletAccount | null,
  activeUnreadCount: number | undefined
): Record<string, number> {
  const counts = { ...jwtCounts };

  if (activeAccount?.profileHandle) {
    if (typeof activeUnreadCount === "number") {
      counts[normalizeAddress(activeAccount.address)] = activeUnreadCount;
    }
  } else if (activeAccount) {
    counts[normalizeAddress(activeAccount.address)] ??= 0;
  }

  return counts;
}
