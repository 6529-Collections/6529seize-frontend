import Image from "next/image";
import Link from "next/link";

import type {
  MarketplaceBrand,
  ResolvedPreviewHref,
} from "./MarketplaceItemPreviewCard.types";
import MarketplaceCopyListingButton from "./MarketplaceCopyListingButton";
import MarketplaceExternalOpenIcon from "./MarketplaceExternalOpenIcon";

interface MarketplaceFullFooterProps {
  readonly href: string;
  readonly resolvedPreviewHref: ResolvedPreviewHref;
  readonly displayTitle: string;
  readonly ctaAriaLabel: string;
  readonly hideActions: boolean;
  readonly hasPrice: boolean;
  readonly priceValueText: string;
  readonly priceCurrencyText?: string | undefined;
  readonly marketplaceBrand: MarketplaceBrand | null;
}

export default function MarketplaceFullFooter({
  href,
  resolvedPreviewHref,
  displayTitle,
  ctaAriaLabel,
  hideActions,
  hasPrice,
  priceValueText,
  priceCurrencyText,
  marketplaceBrand,
}: MarketplaceFullFooterProps) {
  const { href: resolvedHref, target, rel } = resolvedPreviewHref;
  const hasMarketplaceBrand = marketplaceBrand !== null;

  return (
    <div
      className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-bg-black/60 tw-px-3 tw-py-2.5"
      data-testid="marketplace-item-footer"
    >
      <p
        className="tw-m-0 tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-white"
        data-testid="marketplace-item-title"
      >
        {displayTitle}
      </p>
      <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
        {hasPrice || hasMarketplaceBrand ? (
          <Link
            href={resolvedHref}
            target={target}
            rel={rel}
            prefetch={false}
            className="tw-inline-flex tw-max-w-[13rem] tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-white tw-bg-[#E5E5E5] tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-leading-4 tw-text-[#0A0A0A] tw-no-underline tw-transition-colors tw-duration-150 hover:tw-border-[#EFEFEF] hover:tw-bg-[#EFEFEF] hover:tw-text-[#0A0A0A]"
            data-testid="marketplace-item-cta-link"
            aria-label={ctaAriaLabel}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            {hasMarketplaceBrand && (
              <Image
                src={marketplaceBrand.logoSrc}
                alt={`${marketplaceBrand.displayName} logo`}
                width={14}
                height={14}
                className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-rounded-sm tw-object-cover"
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
        ) : (
          <Link
            href={resolvedHref}
            target={target}
            rel={rel}
            prefetch={false}
            className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/50 tw-text-white tw-no-underline tw-transition-colors tw-duration-150"
            data-testid="marketplace-item-cta-link"
            aria-label={ctaAriaLabel}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <MarketplaceExternalOpenIcon className="tw-size-3.5 tw-flex-shrink-0" />
          </Link>
        )}
        {!hideActions && (
          <MarketplaceCopyListingButton
            href={href}
            testId="marketplace-item-copy-button"
            className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/50 tw-text-white tw-transition-colors tw-duration-150"
          />
        )}
      </div>
    </div>
  );
}
