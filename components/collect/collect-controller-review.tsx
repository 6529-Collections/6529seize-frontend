import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import {
  assertCollectOfferAmount,
  assertCollectOfferQuantity,
} from "./collect-offer-policy";
import { marketExecutionError } from "./market-execution-errors";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CollectTradeReview } from "./collect.types";
import CollectAssetMedia from "./CollectAssetMedia";
import { marketAmount, marketOperationReview } from "./market.adapters";
import { readMarketIntent } from "./market-operation-storage";
import { MARKET_ZERO } from "./market-validation";

export function collectOfferLimitReason(
  expected: ApiMarketPrepareRequest | null,
  maximumOfferAmountWei: string | undefined,
  locale: SupportedLocale,
  fixedOfferQuantity?: string
): string | undefined {
  if (!expected) return undefined;
  try {
    assertCollectOfferAmount(expected, maximumOfferAmountWei);
    assertCollectOfferQuantity(expected, fixedOfferQuantity);
    return undefined;
  } catch (failure) {
    return marketExecutionError(failure, locale);
  }
}

interface CollectControllerReviewOptions {
  readonly operation: ApiMarketOperation | null;
  readonly locale: SupportedLocale;
  readonly disabledReason: string | undefined;
  readonly profileId: string | undefined;
  readonly asset: ApiCollectAsset | undefined;
  readonly inlineBuy: boolean;
}

function recoveredTransactionFacts(
  operation: ApiMarketOperation | null,
  locale: SupportedLocale
) {
  if (!operation) return [];
  const hash = readMarketIntent(
    operation.profile_id,
    operation.id
  )?.transactionHash;
  return hash
    ? [{ label: t(locale, "collect.trade.transactionHash"), value: hash }]
    : [];
}

export function collectControllerReview({
  operation,
  locale,
  disabledReason,
  profileId,
  asset,
  inlineBuy,
}: CollectControllerReviewOptions): CollectTradeReview | null {
  const review = operation
    ? {
        ...marketOperationReview(operation, locale, disabledReason, profileId),
        ...(asset
          ? {
              title: asset.name,
              media: (
                <CollectAssetMedia src={asset.image_url} name={asset.name} />
              ),
            }
          : {}),
      }
    : null;
  if (review)
    review.technicalFacts = [
      ...review.technicalFacts,
      ...recoveredTransactionFacts(operation, locale),
    ];
  if (review && operation && inlineBuy) {
    review.technicalFacts = [...review.facts, ...review.technicalFacts];
    const fees = operation.fees.reduce(
      (total, fee) => total + BigInt(fee.amount_wei),
      0n
    );
    const gas = operation.transaction?.gas_reserve_wei;
    review.facts = [
      {
        label: t(locale, "collect.trade.quantity"),
        value: operation.quantity,
      },
      {
        label: t(locale, "collect.trade.destination"),
        value: operation.nft_recipient ?? operation.recipient,
      },
      {
        label: t(locale, "collect.buy.includedFees"),
        value: marketAmount(fees.toString(), operation.currency),
      },
      ...(gas
        ? [
            {
              label: t(locale, "collect.trade.gasCap"),
              value: marketAmount(gas, MARKET_ZERO),
            },
          ]
        : []),
    ];
  }
  return review;
}
