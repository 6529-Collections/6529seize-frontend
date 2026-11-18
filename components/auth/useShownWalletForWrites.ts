import { useLayoutEffect } from "react";
import { showSignedInWallet } from "@/services/auth/displayed-wallet-guard";

/**
 * Tells the write check which signed-in wallet this tab shows. A layout
 * effect records it before any effect of the same render can send a write;
 * unmounting turns the check off.
 */
export function useShownWalletForWrites(
  address: string | null | undefined,
  isSignedIn: boolean
): void {
  const shown = isSignedIn && address ? address : null;
  useLayoutEffect(() => showSignedInWallet(shown), [shown]);
}
