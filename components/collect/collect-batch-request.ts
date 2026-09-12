import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  ApiMarketBatchPrepareRequestKindEnum,
  ApiMarketBatchPrepareRequestCurrencyEnum,
  ApiMarketBatchPrepareRequestExecutionPolicyEnum,
  type ApiMarketBatchPrepareRequest,
} from "@/generated/models/ApiMarketBatchPrepareRequest";
import { getAddress } from "viem";
import type { CollectBatchDraft } from "./collect-batch.types";
import { collectAssetIdentity } from "./collect.adapters";
import { collectBuyAmount, collectBuyListings } from "./collect-buy.helpers";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { validateMarketBatchRequest } from "./market-batch-validation";

export function buildCollectBatchRequest(
  draft: CollectBatchDraft,
  profile: ApiIdentity,
  wallet: string
): ApiMarketBatchPrepareRequest {
  const members = collectProfileWallets(profile).map((item) => item.wallet);
  const items = draft.items.map((item) => {
    const identity = collectAssetIdentity(item.asset.asset_key);
    if (
      !identity ||
      identity.family !== item.asset.family ||
      item.asset.chain_id !== 1 ||
      item.asset.asset_key !==
        `1:${item.asset.contract.toLowerCase()}:${item.asset.token_id}` ||
      identity.tokenId !== item.asset.token_id
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    const amount = collectBuyAmount(item.order, item.quantity);
    if (
      amount === null ||
      collectBuyListings({
        orders: [item.order],
        assetKey: item.asset.asset_key,
        quantity: item.quantity,
        profileWallets: members,
        nowSeconds: Math.floor(Date.now() / 1000),
      }).length !== 1
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    return {
      asset_key: item.asset.asset_key,
      order: item.order.identity,
      quantity: item.quantity,
      amount_wei: amount,
      allocations: item.allocations.map((allocation) => ({
        recipient: getAddress(allocation.recipient),
        quantity: allocation.quantity,
        acknowledge_external_recipient: allocation.acknowledgeExternalRecipient,
      })),
    };
  });
  if (!profile.id) throw new Error("MARKET_REVIEW_MISMATCH");
  const request: ApiMarketBatchPrepareRequest = {
    kind: ApiMarketBatchPrepareRequestKindEnum.BuyBatch,
    profile_id: profile.id,
    wallet: getAddress(wallet),
    currency:
      ApiMarketBatchPrepareRequestCurrencyEnum._0x0000000000000000000000000000000000000000,
    execution_policy:
      ApiMarketBatchPrepareRequestExecutionPolicyEnum.AllOrRevert,
    amount_wei: items
      .reduce((sum, item) => sum + BigInt(item.amount_wei), 0n)
      .toString(),
    items,
  };
  validateMarketBatchRequest(request, members);
  return request;
}
