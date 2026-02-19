"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { useLinkPreviewVariant } from "./LinkPreviewContext";
import { LinkPreviewCardLayout } from "./OpenGraphPreview";
import { removeBaseEndpoint } from "@/helpers/Helpers";
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

const getMarketplaceBrand = (href: string): MarketplaceBrand | null => {
  const kind = getMarketplaceUrlKind(href);

  switch (kind) {
    case "manifold.listing":
      return { displayName: "Manifold", logoSrc: "/manifold.png" };
    case "superrare.artwork":
      return { displayName: "SuperRare", logoSrc: "/superrare-icon.png" };
    case "foundation.mint":
      return { displayName: "Foundation", logoSrc: "/Foundation-icon.jpg" };
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

function OverlayActionButtons({ href }: { readonly href: string }) {
  const [copied, setCopied] = useState(false);

  const relative = removeBaseEndpoint(href);
  const relativeHref =
    typeof relative === "string" && relative.startsWith("/")
      ? relative
      : undefined;

  const stop = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const copyToClipboard = (e: MouseEvent<HTMLButtonElement>) => {
    stop(e);
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
    <div className="tw-absolute tw-right-3 tw-top-3 tw-z-10 tw-flex tw-flex-col tw-gap-2">
      <button
        type="button"
        className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-backdrop-blur-md tw-transition-colors tw-duration-150"
        onClick={copyToClipboard}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg
          className="tw-size-3.5 tw-flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke={copied ? "#34d399" : "currentColor"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
      </button>
      <Link
        href={relativeHref ?? href}
        target={relativeHref ? undefined : "_blank"}
        className="tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-no-underline tw-backdrop-blur-md tw-transition-colors tw-duration-150"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg
          className="tw-size-3.5 tw-flex-shrink-0"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          strokeWidth="3"
          stroke="currentColor"
          fill="none"
        >
          <path d="M55.4,32V53.58a1.81,1.81,0,0,1-1.82,1.82H10.42A1.81,1.81,0,0,1,8.6,53.58V10.42A1.81,1.81,0,0,1,10.42,8.6H32" />
          <polyline points="40.32 8.6 55.4 8.6 55.4 24.18" />
          <line x1="19.32" y1="45.72" x2="54.61" y2="8.91" />
        </svg>
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
  const mediaFrameRef = useRef<HTMLDivElement | null>(null);
  const titleRowRef = useRef<HTMLDivElement | null>(null);
  const normalizedPrice = typeof price === "string" ? price.trim() : "";
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const hasPrice = normalizedPrice.length > 0;
  const hasTitle = !compact && normalizedTitle.length > 0;
  const isImageMedia = mediaMimeType.toLowerCase().includes("image");
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

  useEffect(() => {
    const titleRow = titleRowRef.current;
    const setTitleRowFullWidth = () => {
      if (!titleRow) {
        return;
      }

      titleRow.style.width = "100%";
      titleRow.style.maxWidth = "";
    };

    if (!hasTitle || !isImageMedia) {
      setTitleRowFullWidth();
      return;
    }

    const frame = mediaFrameRef.current;
    if (!frame || !titleRow) {
      setTitleRowFullWidth();
      return;
    }

    let frameResizeObserver: ResizeObserver | null = null;
    let frameMutationObserver: MutationObserver | null = null;
    let imageLoadListener: (() => void) | null = null;

    const applyTitleWidthFromImage = () => {
      const frameWidth = frame.clientWidth;
      const frameHeight = frame.clientHeight;

      if (frameWidth <= 0 || frameHeight <= 0) {
        setTitleRowFullWidth();
        return;
      }

      const image = frame.querySelector("img");
      if (!image) {
        setTitleRowFullWidth();
        return;
      }

      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;

      if (naturalWidth <= 0 || naturalHeight <= 0) {
        setTitleRowFullWidth();
        return;
      }

      const frameRatio = frameWidth / frameHeight;
      const imageRatio = naturalWidth / naturalHeight;
      const displayedImageWidth =
        imageRatio >= frameRatio ? frameWidth : frameHeight * imageRatio;

      const nextWidth = Math.max(
        1,
        Math.min(frameWidth, Math.round(displayedImageWidth))
      );

      titleRow.style.width = `${nextWidth}px`;
      titleRow.style.maxWidth = "100%";
    };

    const bindImageLoadListener = () => {
      const image = frame.querySelector("img");
      if (!image) {
        return;
      }

      const onImageLoad = () => {
        applyTitleWidthFromImage();
      };

      if (!image.complete) {
        image.addEventListener("load", onImageLoad);
        imageLoadListener = () =>
          image.removeEventListener("load", onImageLoad);
      }
    };

    applyTitleWidthFromImage();
    bindImageLoadListener();

    if (typeof ResizeObserver !== "undefined") {
      frameResizeObserver = new ResizeObserver(() => {
        applyTitleWidthFromImage();
      });
      frameResizeObserver.observe(frame);
    }

    if (typeof MutationObserver !== "undefined") {
      frameMutationObserver = new MutationObserver(() => {
        if (imageLoadListener) {
          imageLoadListener();
          imageLoadListener = null;
        }
        bindImageLoadListener();
        applyTitleWidthFromImage();
      });
      frameMutationObserver.observe(frame, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      frameResizeObserver?.disconnect();
      frameMutationObserver?.disconnect();
      imageLoadListener?.();
    };
  }, [hasTitle, isImageMedia, mediaUrl]);

  return (
    <LinkPreviewCardLayout href={href} variant={variant} hideActions>
      <div
        className={`${getMarketplaceContainerClass(variant, compact)} tw-relative`}
        data-testid="manifold-item-card"
      >
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
          className="tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-no-underline"
          data-testid="marketplace-item-media-link"
        >
          <div
            className={`${MARKETPLACE_MEDIA_FRAME_CLASS} tw-relative`}
            data-testid="manifold-item-media"
            ref={mediaFrameRef}
          >
            <MediaDisplay
              media_mime_type={mediaMimeType}
              media_url={mediaUrl}
              disableMediaInteraction={true}
            />
          </div>
          {hasTitle && (
            <div className="tw-flex tw-w-full tw-justify-center">
              <div
                className="tw-overflow-hidden tw-bg-iron-900/70 tw-px-3 tw-py-2"
                style={{ width: "100%" }}
                ref={titleRowRef}
                data-testid="marketplace-item-title-row"
              >
                <p
                  className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-white"
                  data-testid="marketplace-item-title"
                >
                  {normalizedTitle}
                </p>
              </div>
            </div>
          )}
        </Link>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          prefetch={false}
          className={`tw-absolute tw-right-3 tw-z-10 tw-inline-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-text-white tw-no-underline tw-backdrop-blur-md tw-transition-colors tw-duration-150 ${topRightCtaTopClass} ${topRightCtaSizeClass}`}
          data-testid="marketplace-item-cta-link"
          aria-label={ctaAriaLabel}
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
            <svg
              className="tw-size-3.5 tw-flex-shrink-0"
              viewBox="0 0 64 64"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              aria-hidden="true"
              data-testid="marketplace-item-cta-fallback-icon"
            >
              <path d="M55.4,32V53.58a1.81,1.81,0,0,1-1.82,1.82H10.42A1.81,1.81,0,0,1,8.6,53.58V10.42A1.81,1.81,0,0,1,10.42,8.6H32" />
              <polyline points="40.32 8.6 55.4 8.6 55.4 24.18" />
              <line x1="19.32" y1="45.72" x2="54.61" y2="8.91" />
            </svg>
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
