import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { formatDate, formatDecimalString } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getAddress } from "viem";
import { collectAssetIdentity } from "./collect.adapters";
import type {
  CollectPurchaseReviewView,
  CollectReviewFact,
} from "./collect.types";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { buildCollectPurchaseAmounts } from "./collect-review-amounts";
import { MARKET_SEAPORT, MARKET_ZERO } from "./market-validation";

/** Presentation only: the controller validates every operation before review. */
export function collectPurchaseReview(
  operation: ApiMarketOperation,
  locale: SupportedLocale,
  profile: ApiIdentity | null,
  technicalFacts: readonly CollectReviewFact[]
): CollectPurchaseReviewView | undefined {
  const amounts = buildCollectPurchaseAmounts(operation);
  if (!amounts) return undefined;
  const identity = collectAssetIdentity(operation.asset_key);
  const collectionLabel = identity
    ? t(locale, `collect.collection.${identity.family}`)
    : t(locale, "collect.trade.asset");
  const wallets =
    profile?.id === operation.profile_id ? collectProfileWallets(profile) : [];
  const walletName = (address: string) => {
    const name = wallets.find(
      (wallet) => wallet.wallet.toLowerCase() === address.toLowerCase()
    )?.display;
    return name && name.toLowerCase() !== address.toLowerCase()
      ? name
      : undefined;
  };
  const recipient = operation.nft_recipient ?? operation.recipient;
  const [, contract, tokenId] = operation.asset_key.split(":");
  return {
    chainId: Number(operation.asset_key.split(":")[0]),
    ...(contract ? { nftContract: getAddress(contract) } : {}),
    exchangeContract: getAddress(
      operation.order?.protocol_address ?? MARKET_SEAPORT
    ),
    amounts,
    currency: operation.currency.toLowerCase() === MARKET_ZERO ? "ETH" : "WETH",
    artworkLabel: identity
      ? `${collectionLabel} #${identity.tokenId}`
      : collectionLabel,
    quantity: formatDecimalString(locale, operation.quantity),
    payerAddress: operation.wallet,
    payerName: walletName(operation.wallet),
    recipientAddress: recipient,
    recipientName: walletName(recipient),
    recipientInProfile: operation.recipient_in_profile,
    netWei: operation.net_wei,
    fees: operation.fees.map((fee) => ({
      amountWei: fee.amount_wei,
      recipient: fee.recipient,
    })),
    approvalFeeCaps: operation.approval_transactions.map((approval, index) => ({
      label: t(locale, "collect.review.approvalFee", {
        number: formatDecimalString(locale, String(index + 1)),
      }),
      amountWei: approval.gas_reserve_wei ?? null,
    })),
    contractFacts: [
      ...(tokenId
        ? [{ label: t(locale, "collect.review.tokenId"), value: tokenId }]
        : []),
      { label: t(locale, "collect.trade.network"), value: "Ethereum · 1" },
      ...(operation.order
        ? [
            {
              label: t(locale, "collect.review.listingExpiry"),
              value: formatDate(
                locale,
                Number(operation.order.components.end_time) * 1000,
                { dateStyle: "medium", timeStyle: "short" }
              ),
            },
          ]
        : []),
      ...operation.approval_transactions.map((approval, index) => ({
        label: t(locale, "collect.review.approval", {
          number: formatDecimalString(locale, String(index + 1)),
        }),
        value: `${approval.approval_scope ?? approval.purpose} · ${getAddress(approval.to)}`,
      })),
      ...technicalFacts.filter(
        (fact) =>
          ![
            t(locale, "collect.trade.asset"),
            t(locale, "collect.trade.protocol"),
            t(locale, "collect.trade.network"),
          ].includes(fact.label)
      ),
    ],
  };
}
