import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
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
import { marketOperationReview } from "./market.adapters";
import { readMarketIntent } from "./market-operation-storage";
import { collectPurchaseReview } from "./collect-purchase-review";
import { collectProfileWallets } from "./collect-recipient.helpers";

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
  readonly profile?: ApiIdentity | null;
  readonly asset: ApiCollectAsset | undefined;
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
  profile,
  asset,
}: CollectControllerReviewOptions): CollectTradeReview | null {
  const review: CollectTradeReview | null = operation
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
  if (review && operation) {
    const technicalFacts = [
      ...review.technicalFacts,
      ...recoveredTransactionFacts(operation, locale),
    ];
    return {
      ...review,
      ...(operation.kind !== ApiMarketKind.Buy
        ? {
            orderReview: {
              operation,
              walletName:
                profile?.id === operation.profile_id
                  ? collectProfileWallets(profile).find(
                      (wallet) =>
                        wallet.wallet.toLowerCase() ===
                        operation.wallet.toLowerCase()
                    )?.display
                  : undefined,
            },
          }
        : {}),
      technicalFacts,
      purchase: collectPurchaseReview(
        operation,
        locale,
        profile ?? null,
        technicalFacts
      ),
    };
  }
  return review;
}
