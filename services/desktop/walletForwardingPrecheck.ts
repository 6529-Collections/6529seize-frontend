import type { WalletRequest } from "@/lib/desktop/wallet-forwarding";
import { describeWalletRequest } from "@/lib/desktop/walletRequestDescribe";
import { showDesktopWalletRefusal } from "@/services/desktop/desktopBrowserWallet";

/**
 * The browser page's allow-list, applied before the shell is asked: a
 * request the page would refuse (a message or typed data it cannot
 * describe) shows "Continue in your browser" instead of opening the page.
 * The connector has already validated the request itself.
 */
export function walletForwardingPrecheck(request: WalletRequest): boolean {
  const ok = describeWalletRequest(request, globalThis.location.origin).ok;
  if (!ok) showDesktopWalletRefusal();
  return ok;
}
