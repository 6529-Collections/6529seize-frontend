import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Dispatch, SetStateAction } from "react";
import type { CollectArtworkSelection } from "./CollectArtworkCard";
import {
  collectListingKey,
  collectOrderPurchaseQuantity,
} from "./collect-buy.helpers";
import { isCollectEdition } from "./collect-families";
import {
  collectSelectionItem,
  toggleCollectSelection,
  type CollectSelectedListing,
} from "./collect-selection.helpers";
import type { CollectCatalogEntry } from "./useCollectCatalog";

export function collectArtworkSelection({
  entry,
  selection,
  profileWallets,
  locale,
  orderIsPending,
  orderIsPendingNow,
  setSelection,
}: {
  readonly entry: CollectCatalogEntry | undefined;
  readonly selection: readonly CollectSelectedListing[];
  readonly profileWallets: readonly string[];
  readonly locale: SupportedLocale;
  readonly orderIsPending: (order: ApiMarketTradeOrder) => boolean;
  readonly orderIsPendingNow: (order: ApiMarketTradeOrder) => boolean;
  readonly setSelection: Dispatch<SetStateAction<CollectSelectedListing[]>>;
}): CollectArtworkSelection | undefined {
  if (!entry?.order) return undefined;
  const order = entry.order,
    key = collectListingKey(order);
  const selected = selection.some(
    (item) => collectListingKey(item.order) === key
  );
  const duplicate721 =
    !isCollectEdition(entry.asset.family) &&
    selection.some((item) => item.asset.asset_key === entry.asset.asset_key);
  let disabledReason: string | undefined;
  const pending = orderIsPending(order);
  if (pending) disabledReason = t(locale, "collect.trade.submissionPending");
  else if (!selected) {
    if (duplicate721)
      disabledReason = t(locale, "collect.selection.alreadySelected");
    else if (selection.length >= 128)
      disabledReason = t(locale, "collect.selection.limit", { count: 128 });
    else if (collectOrderPurchaseQuantity(order) === null)
      disabledReason = t(locale, "collect.trade.unavailable");
  }
  return {
    selected,
    pending,
    disabledReason,
    onToggle: () => {
      if (orderIsPendingNow(order)) return;
      if (selected) {
        setSelection((items) =>
          items.filter((item) => collectListingKey(item.order) !== key)
        );
        return;
      }
      if (disabledReason) return;
      const candidate = collectSelectionItem({
        asset: entry.asset,
        order,
        profileWallets,
        nowSeconds: Math.floor(Date.now() / 1000),
      });
      if (candidate)
        setSelection((items) =>
          toggleCollectSelection(items, {
            ...candidate,
            selectedAt: Date.now(),
          })
        );
    },
  };
}
