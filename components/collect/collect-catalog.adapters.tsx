import type { ApiCollectCapabilities } from "@/generated/models/ApiCollectCapabilities";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CollectAssetMedia from "./CollectAssetMedia";
import { collectAssetHref } from "./collect.adapters";
import type { CollectArtworkView } from "./collect.types";
import { marketAmount } from "./market.adapters";
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
    priceLabel: order ? marketAmount(order.total_wei, order.currency) : null,
    priceDescription: order
      ? t(locale, "collect.trade.orderQuantity", { quantity: order.quantity })
      : undefined,
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
