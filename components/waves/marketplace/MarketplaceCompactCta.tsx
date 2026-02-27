import Image from "next/image";
import Link from "next/link";

import type {
  MarketplaceBrand,
  ResolvedPreviewHref,
} from "./MarketplaceItemPreviewCard.types";
import MarketplaceExternalOpenIcon from "./MarketplaceExternalOpenIcon";

interface MarketplaceCompactCtaProps {
  readonly resolvedPreviewHref: ResolvedPreviewHref;
  readonly ctaAriaLabel: string;
  readonly hideActions: boolean;
  readonly hasPrice: boolean;
  readonly priceValueText: string;
  readonly priceCurrencyText?: string | undefined;
  readonly marketplaceBrand: MarketplaceBrand | null;
}

export default function MarketplaceCompactCta({
  resolvedPreviewHref,
  ctaAriaLabel,
  hideActions,
  hasPrice,
  priceValueText,
  priceCurrencyText,
  marketplaceBrand,
}: MarketplaceCompactCtaProps) {
  const { href, target, rel } = resolvedPreviewHref;
  const hasMarketplaceBrand = marketplaceBrand !== null;
  const topRightCtaTopClass = hideActions ? "tw-top-3" : "tw-top-[5.5rem]";
  const topRightCtaSizeClass = hasPrice
    ? "tw-max-w-[12rem] tw-gap-x-1.5 tw-rounded-full tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold"
    : "tw-size-8 tw-rounded-lg";

  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      prefetch={false}
      className={`tw-absolute tw-right-3 tw-z-10 tw-inline-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-no-underline tw-backdrop-blur-md tw-transition-colors tw-duration-150 ${topRightCtaTopClass} ${topRightCtaSizeClass}`}
      data-testid="marketplace-item-price"
      aria-label={ctaAriaLabel}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {hasMarketplaceBrand ? (
        <Image
          src={marketplaceBrand.logoSrc}
          alt={`${marketplaceBrand.displayName} logo`}
          width={16}
          height={16}
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-rounded-sm tw-object-cover"
        />
      ) : (
        <MarketplaceExternalOpenIcon
          className="tw-size-3.5 tw-flex-shrink-0"
          testId="marketplace-item-cta-fallback-icon"
        />
      )}
      {hasPrice && (
        <span
          className="tw-max-w-[8rem] tw-truncate"
          data-testid="marketplace-item-price"
        >
          {priceValueText}
        </span>
      )}
      {hasPrice && priceCurrencyText && (
        <span
          className="tw-max-w-[6rem] tw-truncate"
          data-testid="marketplace-item-price-currency"
        >
          {priceCurrencyText}
        </span>
      )}
    </Link>
  );
}
