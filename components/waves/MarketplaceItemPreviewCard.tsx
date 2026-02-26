"use client";

import { useLinkPreviewVariant } from "./LinkPreviewContext";
import MarketplaceCompactCta from "./marketplace/MarketplaceCompactCta";
import MarketplaceFullFooter from "./marketplace/MarketplaceFullFooter";
import { DEFAULT_MARKETPLACE_TITLE } from "./marketplace/MarketplaceItemPreviewCard.constants";
import {
  buildMarketplaceCtaLabel,
  getMarketplaceBrand,
  resolvePreviewHref,
} from "./marketplace/MarketplaceItemPreviewCard.utils";
import MarketplaceItemPreviewMediaLink from "./marketplace/MarketplaceItemPreviewMediaLink";
import MarketplaceOverlayActionButtons from "./marketplace/MarketplaceOverlayActionButtons";
import { getMarketplaceContainerClass } from "./marketplace/previewLayout";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";

import type { MarketplaceItemPreviewCardProps } from "./marketplace/MarketplaceItemPreviewCard.types";

export default function MarketplaceItemPreviewCard({
  href,
  mediaUrl,
  mediaMimeType,
  price,
  title,
  compact = false,
  hideActions = false,
}: MarketplaceItemPreviewCardProps) {
  const variant = useLinkPreviewVariant();
  const resolvedPreviewHref = resolvePreviewHref(href);
  const normalizedPrice = typeof price === "string" ? price.trim() : "";
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const hasPrice = normalizedPrice.length > 0;
  const hasTitle = normalizedTitle.length > 0;
  const displayTitle = hasTitle ? normalizedTitle : DEFAULT_MARKETPLACE_TITLE;
  const marketplaceBrand = getMarketplaceBrand(href);
  const ctaAriaLabel = buildMarketplaceCtaLabel({
    normalizedPrice,
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
            normalizedPrice={normalizedPrice}
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
          normalizedPrice={normalizedPrice}
          marketplaceBrand={marketplaceBrand}
        />
      </div>
    </LinkPreviewCardLayout>
  );
}
