import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import { marketAmount } from "./market.adapters";
import type { CollectTradeStage, CollectOrderView } from "./collect.types";

export function marketBatchStage(
  operation: ApiMarketBatchOperation
): CollectTradeStage {
  switch (operation.state.toString()) {
    case "PREPARING":
      return "preparing";
    case "REVIEW":
      return "review";
    case "SUBMITTED":
    case "MINED":
      return "submitted";
    case "CONFIRMED":
      return "confirmed";
    case "FAILED":
      return "failed";
    case "EXPIRED":
      return "expired";
    default:
      return "reconciling";
  }
}
export function marketBatchOperationView(
  operation: ApiMarketBatchOperation,
  locale: SupportedLocale
): CollectOrderView {
  return {
    id: operation.id,
    title: t(locale, "collect.selection.title"),
    tokenLabel: t(locale, "collect.selection.count", {
      count: new Set(operation.items.map((item) => item.asset_key)).size,
    }),
    action: "buy",
    statusLabel: t(
      locale,
      `collect.trade.stage.${marketBatchStage(operation)}`
    ),
    detail: t(locale, "collect.batchReview.atomic"),
    amountLabel: marketAmount(operation.total_wei, operation.currency),
    makerLabel: operation.wallet,
    updatedLabel: formatDate(locale, operation.updated_at, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    cancellable: false,
  };
}
