import Link from "next/link";

import type { ResolvedPreviewHref } from "./MarketplaceItemPreviewCard.types";
import MarketplaceCopyListingButton from "./MarketplaceCopyListingButton";
import MarketplaceExternalOpenIcon from "./MarketplaceExternalOpenIcon";

interface MarketplaceOverlayActionButtonsProps {
  readonly href: string;
  readonly resolvedPreviewHref: ResolvedPreviewHref;
}

export default function MarketplaceOverlayActionButtons({
  href,
  resolvedPreviewHref,
}: MarketplaceOverlayActionButtonsProps) {
  const { href: resolvedHref, target, rel } = resolvedPreviewHref;

  return (
    <div className="tw-absolute tw-right-3 tw-top-3 tw-z-10 tw-flex tw-flex-col tw-gap-2">
      <MarketplaceCopyListingButton
        href={href}
        testId="marketplace-item-overlay-copy-button"
        className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-backdrop-blur-md tw-transition-colors tw-duration-150"
      />
      <Link
        href={resolvedHref}
        target={target}
        rel={rel}
        prefetch={false}
        className="tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-no-underline tw-backdrop-blur-md tw-transition-colors tw-duration-150"
        data-testid="marketplace-item-overlay-open-link"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <MarketplaceExternalOpenIcon className="tw-size-3.5 tw-flex-shrink-0" />
      </Link>
    </div>
  );
}
