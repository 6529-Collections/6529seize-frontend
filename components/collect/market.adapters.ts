import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import { formatEther } from "viem";
import { collectAssetIdentity } from "./collect.adapters";
import type {
  CollectOrderView,
  CollectTradeReview,
  CollectTradeStage,
} from "./collect.types";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
  MARKET_CONDUIT,
  MARKET_ZERO_HASH,
} from "./market-validation";

export function marketAmount(amount: string, currency: string): string {
  return `${formatEther(BigInt(amount))} ${currency.toLowerCase() === MARKET_ZERO ? "ETH" : "WETH"}`;
}
function marketAssetLabel(assetKey: string, locale: SupportedLocale): string {
  const identity = collectAssetIdentity(assetKey);
  if (!identity) return t(locale, "collect.trade.asset");
  const familyLabel = t(locale, `collect.collection.${identity.family}`);
  return `${familyLabel} #${identity.tokenId}`;
}
export function marketOperationStage(
  operation: ApiMarketOperation
): CollectTradeStage {
  switch (operation.state.toString()) {
    case "PREPARING":
      return "preparing";
    case "REVIEW":
    case "APPROVAL":
    case "AWAITING_SIGNATURE":
      return "review";
    case "PUBLISHING":
      return "publishing";
    case "SUBMITTED":
    case "MINED":
    case "CANCEL_PENDING":
      return "submitted";
    case "LIVE":
      return operation.settlement &&
        BigInt(operation.settlement.filled_quantity) > 0n
        ? "partial"
        : "live";
    case "CONFIRMED":
    case "CANCELLED":
      return "confirmed";
    case "FAILED":
      return "failed";
    case "EXPIRED":
      return "expired";
    default:
      return "reconciling";
  }
}
export function marketOperationReview(
  operation: ApiMarketOperation,
  locale: SupportedLocale,
  disabledReason?: string,
  currentProfileId?: string
): CollectTradeReview {
  const action = operation.kind.toLowerCase() as CollectTradeReview["action"];
  return {
    id: operation.id,
    revision: operation.revision,
    action,
    title: t(locale, `collect.action.${action}`),
    facts: [
      {
        label: t(locale, "collect.trade.asset"),
        value: marketAssetLabel(operation.asset_key, locale),
      },
      { label: t(locale, "collect.trade.quantity"), value: operation.quantity },
      { label: t(locale, "collect.trade.payer"), value: operation.wallet },
      {
        label: t(locale, "collect.trade.destination"),
        value: operation.nft_recipient ?? operation.recipient,
      },
      {
        label: t(
          locale,
          action === "buy" || action === "offer"
            ? "collect.trade.sellerReceives"
            : "collect.trade.net"
        ),
        value: marketAmount(operation.net_wei, operation.currency),
      },
      ...operation.fees.map((fee, index) => ({
        label: `${t(locale, "collect.trade.fees")} ${index + 1}`,
        value: `${marketAmount(fee.amount_wei, operation.currency)} → ${fee.recipient}`,
      })),
      ...operation.approval_transactions.map((approval, index) => ({
        label: `${t(locale, "collect.trade.approvalScope")} ${index + 1}`,
        value: `${approval.approval_scope ?? approval.purpose} · ${approval.to}`,
      })),
      ...[
        ...operation.approval_transactions,
        ...(operation.transaction ? [operation.transaction] : []),
      ].flatMap((transaction, index) =>
        transaction.gas_reserve_wei
          ? [
              {
                label: `${t(locale, "collect.trade.gasCap")} ${index + 1}`,
                value: marketAmount(transaction.gas_reserve_wei, MARKET_ZERO),
              },
            ]
          : []
      ),
      ...(operation.settlement
        ? [
            {
              label: t(locale, "collect.trade.filled"),
              value: operation.settlement.filled_quantity,
            },
            {
              label: t(locale, "collect.trade.remaining"),
              value: operation.settlement.remaining_quantity,
            },
          ]
        : []),
      ...(action === "offer"
        ? [
            {
              label: t(locale, "collect.trade.liability"),
              value: marketAmount(
                operation.potential_liability_wei,
                operation.currency
              ),
            },
          ]
        : []),
      ...(operation.order
        ? [
            {
              label: t(locale, "collect.trade.orderEnds"),
              value: formatDate(
                locale,
                Number(operation.order.components.end_time) * 1000,
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                }
              ),
            },
          ]
        : []),
    ],
    technicalFacts: [
      { label: t(locale, "collect.trade.asset"), value: operation.asset_key },
      { label: t(locale, "collect.trade.protocol"), value: MARKET_SEAPORT },
      { label: t(locale, "collect.trade.network"), value: "Ethereum · 1" },
      { label: t(locale, "collect.trade.revision"), value: operation.revision },
      ...(operation.approval_transactions.length > 0
        ? [
            {
              label: t(locale, "collect.trade.approvalSpender"),
              value:
                (action === "list" || action === "offer") &&
                operation.order?.components.conduit_key.toLowerCase() ===
                  MARKET_ZERO_HASH
                  ? MARKET_SEAPORT
                  : MARKET_CONDUIT,
            },
          ]
        : []),
    ],
    totalLabel: marketAmount(operation.total_wei, operation.currency),
    totalDescription: t(locale, "collect.trade.gasSeparate"),
    warnings: [
      ...(currentProfileId && currentProfileId !== operation.profile_id
        ? [t(locale, "collect.trade.originalProfile")]
        : []),
      ...(action === "offer"
        ? [t(locale, "collect.trade.offerAllowance")]
        : []),
      ...(!operation.recipient_in_profile
        ? [t(locale, "collect.trade.external")]
        : []),
      ...(operation.approval_transactions.length
        ? [t(locale, "collect.trade.approval")]
        : []),
    ],
    expiresAt: operation.expires_at,
    disabledReason,
  };
}
export function marketOperationView(
  operation: ApiMarketOperation,
  locale: SupportedLocale
): CollectOrderView {
  const review = marketOperationReview(operation, locale);
  let statusLabel = t(
    locale,
    `collect.trade.stage.${marketOperationStage(operation)}`
  );
  if (operation.state.toString() === "LIVE")
    statusLabel =
      operation.settlement && BigInt(operation.settlement.filled_quantity) > 0n
        ? t(locale, "collect.trade.stage.partial")
        : t(locale, "collect.trade.orderLive");
  if (operation.state.toString() === "CANCELLED")
    statusLabel = t(locale, "collect.trade.cancelled");
  return {
    id: operation.id,
    title: review.title,
    tokenLabel: marketAssetLabel(operation.asset_key, locale),
    action: review.action,
    statusLabel,
    detail: operation.recipient,
    amountLabel: review.totalLabel,
    makerLabel: operation.wallet,
    updatedLabel: formatDate(locale, operation.updated_at, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    cancellable:
      ["LIST", "OFFER"].includes(operation.kind) &&
      !["CONFIRMED", "CANCELLED", "EXPIRED"].includes(operation.state) &&
      Boolean(operation.order_hash ?? operation.order?.order_hash),
  };
}
