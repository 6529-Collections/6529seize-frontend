import {
  parseWalletRequest,
  type WalletRequestInput,
} from "@/lib/desktop/wallet-forwarding";
import { describeWalletRequest } from "@/lib/desktop/walletRequestDescribe";
import { showDesktopWalletRefusal } from "@/services/desktop/desktopBrowserWallet";

/**
 * The browser page's own rules, applied before the shell is asked: a
 * request it would refuse (not on the allow-list, too large, another
 * account, another chain) shows "Continue in your browser" instead of
 * opening the page.
 */
export function makeWalletForwardingPrecheck(chainIds: readonly number[]) {
  return (request: WalletRequestInput): boolean => {
    const parsed = parseWalletRequest(request, chainIds);
    const ok =
      parsed.ok &&
      describeWalletRequest(parsed.value, globalThis.location.origin).ok;
    if (!ok) showDesktopWalletRefusal();
    return ok;
  };
}
