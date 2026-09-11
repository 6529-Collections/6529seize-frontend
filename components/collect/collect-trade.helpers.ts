import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { parseEther } from "viem";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";
import { MARKET_WETH, MARKET_ZERO } from "./market-validation";

export function marketConnectionReason(options: {
  readonly capabilityEnabled: boolean;
  readonly isProxy: boolean;
  readonly isSafe: boolean;
  readonly isNative: boolean;
  readonly isAuthenticated: boolean;
  readonly canSign: boolean;
  readonly address: string | undefined;
  readonly profile: ApiIdentity | null;
  readonly operation: ApiMarketOperation | null;
  readonly hasExpected: boolean;
  readonly cancelTarget: ApiMarketOperation | undefined;
}) {
  if (!options.capabilityEnabled) return "collect.trade.unavailable";
  if (options.isNative) return "collect.trade.nativeUnavailable";
  if (options.isProxy) return "collect.trade.proxyUnavailable";
  if (options.isSafe) return "collect.trade.safeUnavailable";
  const address = options.address?.toLowerCase();
  const inProfile = options.profile?.wallets?.some(
    (wallet) => wallet.wallet.toLowerCase() === address
  );
  if (!options.isAuthenticated || !options.canSign || !inProfile)
    return "collect.trade.connectSigner";
  const requiredWallet =
    options.operation?.wallet ?? options.cancelTarget?.wallet;
  if (requiredWallet && requiredWallet.toLowerCase() !== address)
    return "collect.trade.reconnect";
  if (options.operation && options.operation.profile_id !== options.profile?.id)
    return "collect.trade.originalProfile";
  if (options.operation && !options.hasExpected)
    return "collect.trade.checkFailed";
  return undefined;
}

function exactTradeAmount(
  draft: CollectTradeDraft,
  order: ApiMarketTradeOrder | null
): string {
  if (!order)
    return (
      parseEther(draft.unitPriceEth || "0") * BigInt(draft.quantity)
    ).toString();
  const product = BigInt(order.total_wei) * BigInt(draft.quantity);
  if (product % BigInt(order.quantity) !== 0n)
    throw new Error("FRACTIONAL_AMOUNT");
  return (product / BigInt(order.quantity)).toString();
}
export function buildMarketRequest(options: {
  readonly draft: CollectTradeDraft;
  readonly action: CollectTradeAction;
  readonly profile: ApiIdentity;
  readonly wallet: string;
  readonly assetKey: string;
  readonly selectedOrder: ApiMarketTradeOrder | null;
  readonly cancelTarget: ApiMarketOperation | undefined;
}): ApiMarketPrepareRequest {
  const { draft, action, profile, wallet, selectedOrder, cancelTarget } =
    options;
  const kind = Object.values(ApiMarketKind).find(
    (item) => item.toString() === action.toUpperCase()
  );
  if (kind === undefined || !profile.id) throw new Error("UNSUPPORTED_ACTION");
  const recipient = action === "buy" ? draft.recipient : wallet;
  const inProfile = profile.wallets?.some(
    (entry) => entry.wallet.toLowerCase() === recipient.toLowerCase()
  );
  if (!inProfile && !draft.acknowledgeExternalRecipient)
    throw new Error("RECIPIENT_NOT_ACKNOWLEDGED");
  const request: ApiMarketPrepareRequest = {
    profile_id: profile.id,
    wallet,
    recipient,
    asset_key: options.assetKey,
    kind,
    quantity: cancelTarget?.quantity ?? draft.quantity,
    currency:
      cancelTarget?.currency ??
      selectedOrder?.currency ??
      (action === "offer" ? MARKET_WETH : MARKET_ZERO),
    amount_wei:
      action === "cancel" ? "0" : exactTradeAmount(draft, selectedOrder),
    acknowledge_external_recipient:
      !inProfile && draft.acknowledgeExternalRecipient === true,
  };
  if (selectedOrder) request.order = selectedOrder.identity;
  if (action === "list" || action === "offer")
    request.expires_at =
      Math.floor(Date.now() / 1000) + Number(draft.expiryHours) * 3600;
  if (cancelTarget?.order)
    request.order = {
      protocol_address: cancelTarget.order.protocol_address,
      order_hash: cancelTarget.order.order_hash,
    };
  return request;
}
