import {
  parseWalletRequest,
  type WalletRequest,
} from "@/lib/desktop/wallet-forwarding";
import { shortWalletPayloadHash } from "@/lib/desktop/walletRequestContext";
import { describeWalletRequest } from "@/lib/desktop/walletRequestDescribe";
import {
  desktopWalletAcceptsContext,
  desktopWalletSignsSafeTx,
  showDesktopWalletRefusal,
  showDesktopWalletSafeTxRefusal,
  showDesktopWalletTransactionRefusal,
} from "@/services/desktop/desktopBrowserWallet";
import { takeWalletRequestContext } from "@/services/desktop/walletRequestContexts";
import type { PreparedWalletRequest } from "@/wagmiConfig/desktopBrowserWalletConnector";

/**
 * The content remembered for this message, only when the shell accepts it
 * and the browser page would accept it, show it (its hash matches) and fit
 * it in the request; otherwise none, and the page shows the fingerprint.
 */
function contextFor(
  request: Extract<WalletRequest, { method: "personal_sign" }>,
  text: string,
  origin: string
): string | undefined {
  const context = takeWalletRequestContext(text);
  if (context === undefined || !desktopWalletAcceptsContext()) return undefined;
  // Validated again on purpose, with the context: the same rules the shell
  // and the browser page apply (size, then hash match) decide whether it goes.
  const { method, message, address, chainId } = request;
  const withContext = parseWalletRequest(
    { method, params: [message, address], address, chainId, context },
    [chainId]
  );
  if (!withContext.ok) return undefined;
  const described = describeWalletRequest(withContext.value, origin);
  return described.ok &&
    described.value.kind === "message" &&
    described.value.content !== null
    ? context
    : undefined;
}

/**
 * The browser page's allow-list, applied before the shell is asked: a
 * request the page would refuse (a message or typed data it cannot
 * describe, a transaction outside the transaction rules) shows "Continue
 * in your browser" instead of opening the page.
 * For a drop or decision signature it adds the content behind the payload
 * hash when it can, and the short fingerprint the waiting dialog shows.
 * The connector has already validated the request itself.
 */
export function walletForwardingPrecheck(
  request: WalletRequest
): PreparedWalletRequest | null {
  const origin = globalThis.location.origin;
  const described = describeWalletRequest(request, origin);
  if (!described.ok) {
    if (request.method === "eth_sendTransaction") {
      showDesktopWalletTransactionRefusal();
    } else {
      showDesktopWalletRefusal();
    }
    return null;
  }
  // A Safe transaction goes only to a 6529 Desktop with the same SafeTx table.
  if (described.value.kind === "safeTx" && !desktopWalletSignsSafeTx()) {
    showDesktopWalletSafeTxRefusal();
    return null;
  }
  if (
    described.value.kind !== "message" ||
    request.method !== "personal_sign"
  ) {
    return { fingerprint: null };
  }
  const context = contextFor(request, described.value.text, origin);
  return {
    fingerprint: shortWalletPayloadHash(described.value.payloadHash),
    ...(context === undefined ? {} : { context }),
  };
}
