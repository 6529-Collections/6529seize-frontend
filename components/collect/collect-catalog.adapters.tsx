import type { ApiCollectCapabilities } from "@/generated/models/ApiCollectCapabilities";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CollectAssetMedia from "./CollectAssetMedia";
import { collectAssetHref } from "./collect.adapters";
import type { CollectArtworkView } from "./collect.types";
import { marketAmount } from "./market.adapters";
import { collectTdhValueLabel } from "./collect-tdh-browse.helpers";
import {
  collectBuyAmount,
  collectOrderAvailableQuantity,
  collectOrderPurchaseQuantity,
} from "./collect-buy.helpers";
import { formatDecimalString } from "@/i18n/format";
import {
  collectCatalogEntryId,
  type CollectCatalogEntry,
} from "./useCollectCatalog";

export function collectCatalogArtwork(
  entry: CollectCatalogEntry,
  catalog: ApiCollectCatalog | undefined,
  capabilities: ApiCollectCapabilities | undefined,
  locale: SupportedLocale
): CollectArtworkView {
  const { asset, order } = entry;
  const quantity = order ? collectOrderPurchaseQuantity(order) : null;
  const price = order && quantity ? collectBuyAmount(order, quantity) : null;
  const availability =
    entry.tdh?.available_quantity ??
    (order ? collectOrderAvailableQuantity(order) : null);
  const tdhValue = entry.tdh ? collectTdhValueLabel(entry.tdh, locale) : null;
  let priceDescription: string | undefined;
  if (quantity && BigInt(quantity) > 1n) {
    priceDescription = t(locale, "collect.buy.lotPrice", {
      quantity: formatDecimalString(locale, quantity),
    });
  } else if (
    availability &&
    /^(0|[1-9][0-9]{0,77})$/.test(availability) &&
    BigInt(availability) > 1n
  ) {
    priceDescription = t(locale, "collect.trade.orderQuantity", {
      quantity: formatDecimalString(locale, availability),
    });
  }
  return {
    id: collectCatalogEntryId(entry),
    title: asset.name,
    artist: asset.artist_ids
      .map((id) => catalog?.artists.find((artist) => artist.id === id)?.name)
      .filter(Boolean)
      .join(", "),
    tokenLabel: `#${asset.token_id}`,
    href: collectAssetHref(asset),
    media: (
      <CollectAssetMedia
        key={asset.image_url}
        src={asset.image_url}
        name={asset.name}
      />
    ),
    ownedLabel: null,
    priceLabel: order && price ? marketAmount(price, order.currency) : null,
    priceDescription,
    ...(tdhValue === null
      ? {}
      : {
          valueMetric: {
            value: tdhValue,
            label: t(locale, "collect.tdhBrowse.metricUnit"),
          },
        }),
    actions: (["buy", "offer", "list", "accept"] as const).map((action) => ({
      action,
      disabledReason: capabilities?.actions.some(
        (item) =>
          item.action.toString() === action.toUpperCase() && item.enabled
      )
        ? undefined
        : t(locale, "collect.trade.unavailable"),
    })),
  };
}
