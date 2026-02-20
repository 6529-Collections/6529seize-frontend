"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { removeBaseEndpoint } from "@/helpers/Helpers";
import { useLinkPreviewVariant } from "./LinkPreviewContext";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";
import {
  getMarketplaceContainerClass,
  MARKETPLACE_MEDIA_FRAME_CLASS,
} from "./marketplace/previewLayout";
import { getMarketplaceUrlKind } from "./marketplace/urlKind";

interface MarketplaceItemPreviewCardProps {
  readonly href: string;
  readonly mediaUrl: string;
  readonly mediaMimeType: string;
  readonly price?: string | undefined;
  readonly title?: string | undefined;
  readonly compact?: boolean | undefined;
  readonly hideActions?: boolean | undefined;
}

type MarketplaceBrand = {
  readonly displayName: string;
  readonly logoSrc: string;
};

type ResolvedPreviewHref = {
  readonly href: string;
  readonly target?: string | undefined;
  readonly rel?: string | undefined;
};

const DEFAULT_MARKETPLACE_TITLE = "Untitled item";

const resolvePreviewHref = (href: string): ResolvedPreviewHref => {
  const relative = removeBaseEndpoint(href);
  if (typeof relative === "string" && relative.startsWith("/")) {
    return { href: relative };
  }

  return {
    href,
    target: "_blank",
    rel: "noopener noreferrer",
  };
};

const stopPropagation = (event: MouseEvent<HTMLElement>) => {
  event.stopPropagation();
  event.preventDefault();
};

const getMarketplaceBrand = (href: string): MarketplaceBrand | null => {
  const kind = getMarketplaceUrlKind(href);

  switch (kind) {
    case "manifold.listing":
      return { displayName: "Manifold", logoSrc: "/manifold.png" };
    case "superrare.artwork":
      return { displayName: "SuperRare", logoSrc: "/superrare-icon.png" };
    case "foundation.mint":
      return { displayName: "Foundation", logoSrc: "/foundation-icon.jpg" };
    case "opensea.item":
    case "opensea.asset":
      return { displayName: "OpenSea", logoSrc: "/opensea.png" };
    case "transient.nft":
    case "transient.mint":
      return { displayName: "Transient", logoSrc: "/transient.png" };
    case null:
      return null;
  }
};

function ExternalOpenIcon({
  className,
  testId,
}: {
  readonly className: string;
  readonly testId?: string | undefined;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      fill="none"
      aria-hidden="true"
      data-testid={testId}
    >
      <path
        d="M13.5 6H18M18 6V10.5M18 6L10.5 13.5M7.5 8.25H6C4.75736 8.25 3.75 9.25736 3.75 10.5V18C3.75 19.2426 4.75736 20.25 6 20.25H13.5C14.7426 20.25 15.75 19.2426 15.75 18V16.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyListingButton({
  href,
  className,
  testId,
}: {
  readonly href: string;
  readonly className: string;
  readonly testId?: string | undefined;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (event: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(event);
    void navigator.clipboard
      .writeText(href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 500);
      })
      .catch(() => {
        // Ignore clipboard write failures (e.g. missing permissions).
      });
  };

  return (
    <button
      type="button"
      data-testid={testId}
      className={className}
      aria-label={copied ? "Listing link copied" : "Copy listing link"}
      onClick={copyToClipboard}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <svg
        className="tw-size-3.5 tw-flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke={copied ? "#34d399" : "currentColor"}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
        />
      </svg>
    </button>
  );
}

function OverlayActionButtons({ href }: { readonly href: string }) {
  const { href: resolvedHref, target, rel } = resolvePreviewHref(href);

  return (
    <div className="tw-absolute tw-right-3 tw-top-3 tw-z-10 tw-flex tw-flex-col tw-gap-2">
      <CopyListingButton
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
        <ExternalOpenIcon className="tw-size-3.5 tw-flex-shrink-0" />
      </Link>
    </div>
  );
}

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
  const { href: resolvedHref, target, rel } = resolvePreviewHref(href);
  const normalizedPrice = typeof price === "string" ? price.trim() : "";
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const hasPrice = normalizedPrice.length > 0;
  const hasTitle = normalizedTitle.length > 0;
  const displayTitle = hasTitle ? normalizedTitle : DEFAULT_MARKETPLACE_TITLE;
  const marketplaceBrand = getMarketplaceBrand(href);
  const hasMarketplaceBrand = marketplaceBrand !== null;
  let ctaAriaLabel = "Open listing";

  if (hasPrice) {
    if (marketplaceBrand) {
      ctaAriaLabel = `Open on ${marketplaceBrand.displayName} - ${normalizedPrice}`;
    } else {
      ctaAriaLabel = `Open listing - ${normalizedPrice}`;
    }
  } else if (marketplaceBrand) {
    ctaAriaLabel = `Open on ${marketplaceBrand.displayName}`;
  }

  const topRightCtaTopClass = hideActions ? "tw-top-3" : "tw-top-[5.5rem]";
  const topRightCtaSizeClass = hasPrice
    ? "tw-max-w-[12rem] tw-gap-x-1.5 tw-rounded-full tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold"
    : "tw-size-8 tw-rounded-lg";

  if (compact) {
    return (
      <LinkPreviewCardLayout href={href} variant={variant} hideActions>
        <div
          className={`${getMarketplaceContainerClass(variant, compact)} tw-relative`}
          data-testid="manifold-item-card"
        >
          <Link
            href={resolvedHref}
            target={target}
            rel={rel}
            prefetch={false}
            className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-no-underline"
            data-testid="marketplace-item-media-link"
          >
            <div
              className={`${MARKETPLACE_MEDIA_FRAME_CLASS} tw-relative`}
              data-testid="manifold-item-media"
            >
              <MediaDisplay
                media_mime_type={mediaMimeType}
                media_url={mediaUrl}
                disableMediaInteraction={true}
              />
            </div>
          </Link>
          <Link
            href={resolvedHref}
            target={target}
            rel={rel}
            prefetch={false}
            className={`tw-absolute tw-right-3 tw-z-10 tw-inline-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-no-underline tw-backdrop-blur-md tw-transition-colors tw-duration-150 ${topRightCtaTopClass} ${topRightCtaSizeClass}`}
            data-testid="marketplace-item-cta-link"
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
              <ExternalOpenIcon
                className="tw-size-3.5 tw-flex-shrink-0"
                testId="marketplace-item-cta-fallback-icon"
              />
            )}
            {hasPrice && (
              <span
                className="tw-max-w-[8rem] tw-truncate"
                data-testid="manifold-item-price"
              >
                {normalizedPrice}
              </span>
            )}
          </Link>
          {!hideActions && <OverlayActionButtons href={href} />}
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
        <Link
          href={resolvedHref}
          target={target}
          rel={rel}
          prefetch={false}
          className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-no-underline"
          data-testid="marketplace-item-media-link"
        >
          <div
            className={`${MARKETPLACE_MEDIA_FRAME_CLASS} tw-relative`}
            data-testid="manifold-item-media"
          >
            <MediaDisplay
              media_mime_type={mediaMimeType}
              media_url={mediaUrl}
              disableMediaInteraction={true}
            />
          </div>
        </Link>
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
                    data-testid="manifold-item-price"
                  >
                    {normalizedPrice}
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
                <ExternalOpenIcon className="tw-size-3.5 tw-flex-shrink-0" />
              </Link>
            )}
            {!hideActions && (
              <CopyListingButton
                href={href}
                testId="marketplace-item-copy-button"
                className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/50 tw-text-white tw-transition-colors tw-duration-150"
              />
            )}
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}
