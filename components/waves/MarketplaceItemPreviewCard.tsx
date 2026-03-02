"use client";

import { useLinkPreviewVariant } from "./LinkPreviewContext";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";
import MarketplaceCompactCta from "./marketplace/MarketplaceCompactCta";
import MarketplaceFullFooter from "./marketplace/MarketplaceFullFooter";
import MarketplaceItemPreviewMediaLink from "./marketplace/MarketplaceItemPreviewMediaLink";
import { DEFAULT_MARKETPLACE_TITLE } from "./marketplace/MarketplaceItemPreviewCard.constants";
import type { MarketplaceItemPreviewCardProps } from "./marketplace/MarketplaceItemPreviewCard.types";
import {
  buildMarketplaceCtaLabel,
  getMarketplaceBrand,
  resolvePreviewHref,
} from "./marketplace/MarketplaceItemPreviewCard.utils";
import MarketplaceOverlayActionButtons from "./marketplace/MarketplaceOverlayActionButtons";
import { getMarketplaceContainerClass } from "./marketplace/previewLayout";

const normalizeSpaceSeparatedText = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const buildDisplayPriceParts = ({
  price,
  priceCurrency,
}: {
  readonly price: string;
  readonly priceCurrency: string;
}) => {
  if (price.length === 0) {
    return {
      priceValueText: "",
      priceCurrencyText: "",
      ariaPriceText: "",
    };
  }

  let priceValueText = price;
  if (priceCurrency.length > 0) {
    const tokens = price.split(" ");
    const lastToken = tokens[tokens.length - 1];

    if (
      typeof lastToken === "string" &&
      tokens.length > 1 &&
      lastToken.toUpperCase() === priceCurrency.toUpperCase()
    ) {
      const strippedPrice = tokens.slice(0, -1).join(" ").trim();
      if (strippedPrice.length > 0) {
        priceValueText = strippedPrice;
      }
    }
  }

  const ariaPriceText =
    priceCurrency.length > 0
      ? `${priceValueText} ${priceCurrency}`
      : priceValueText;

  return {
    priceValueText,
    priceCurrencyText: priceCurrency,
    ariaPriceText,
  };
};

export default function MarketplaceItemPreviewCard({
  href,
  mediaUrl,
  mediaMimeType,
  price,
  priceCurrency,
  title,
  compact = false,
  hideActions = false,
}: MarketplaceItemPreviewCardProps) {
  const variant = useLinkPreviewVariant();
  const resolvedPreviewHref = resolvePreviewHref(href);
  const normalizedPrice =
    typeof price === "string" ? normalizeSpaceSeparatedText(price) : "";
  const normalizedPriceCurrency =
    typeof priceCurrency === "string"
      ? normalizeSpaceSeparatedText(priceCurrency)
      : "";
  const { priceValueText, priceCurrencyText, ariaPriceText } =
    buildDisplayPriceParts({
      price: normalizedPrice,
      priceCurrency: normalizedPriceCurrency,
    });
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const hasPrice = priceValueText.length > 0;
  const hasTitle = normalizedTitle.length > 0;
  const displayTitle = hasTitle ? normalizedTitle : DEFAULT_MARKETPLACE_TITLE;
  const marketplaceBrand = getMarketplaceBrand(href);
  const ctaAriaLabel = buildMarketplaceCtaLabel({
    normalizedPrice: ariaPriceText,
    marketplaceBrand,
  });

  if (compact) {
    return (
      <LinkPreviewCardLayout href={href} variant={variant} hideActions>
        <div
          className={`${getMarketplaceContainerClass(variant, compact)} tw-relative`}
          data-testid="manifold-item-card"
        >
          <MarketplaceItemPreviewMediaLink
            mediaMimeType={mediaMimeType}
            mediaUrl={mediaUrl}
            resolvedPreviewHref={resolvedPreviewHref}
          />
          <MarketplaceCompactCta
            resolvedPreviewHref={resolvedPreviewHref}
            ctaAriaLabel={ctaAriaLabel}
            hideActions={hideActions}
            hasPrice={hasPrice}
            priceValueText={priceValueText}
            priceCurrencyText={priceCurrencyText || undefined}
            marketplaceBrand={marketplaceBrand}
          />
          {!hideActions && (
            <MarketplaceOverlayActionButtons
              href={href}
              resolvedPreviewHref={resolvedPreviewHref}
            />
          )}
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout href={href} variant={variant} hideActions>
      <div
        className={`${getMarketplaceContainerClass(variant, compact)} tw-relative`}
        data-testid="manifold-item-card"
      >
        <MarketplaceItemPreviewMediaLink
          mediaMimeType={mediaMimeType}
          mediaUrl={mediaUrl}
          resolvedPreviewHref={resolvedPreviewHref}
        />
        <MarketplaceFullFooter
          href={href}
          resolvedPreviewHref={resolvedPreviewHref}
          displayTitle={displayTitle}
          ctaAriaLabel={ctaAriaLabel}
          hideActions={hideActions}
          hasPrice={hasPrice}
          priceValueText={priceValueText}
          priceCurrencyText={priceCurrencyText || undefined}
          marketplaceBrand={marketplaceBrand}
        />
      </div>
    </LinkPreviewCardLayout>
  );
}
