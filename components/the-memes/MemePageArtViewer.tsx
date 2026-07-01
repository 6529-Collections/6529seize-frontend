"use client";

import NFTImage from "@/components/nft-image/NFTImage";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import { InlineMediaActions } from "@/components/drops/view/item/content/media/MediaActionToolbar";
import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";
import { useAuth } from "@/components/auth/Auth";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { getResolvedImageSrc } from "@/components/nft-image/utils/image-source";
import type { BaseNFT } from "@/entities/INFT";
import { enterArtFullScreen } from "@/helpers/Helpers";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getAnimationFileTypeFromMetadata,
  getAnimationMimeTypeFromMetadata,
  getImageFileTypeFromMetadata,
  getImageMimeTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { TouchEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import styles from "./TheMemes.module.scss";

type InlineMediaVariant = "image" | "html";

const FULLSCREEN_CHANGE_EVENTS = [
  "fullscreenchange",
  "webkitfullscreenchange",
  "mozfullscreenchange",
  "MSFullscreenChange",
] as const;

const FULLSCREEN_ERROR_EVENTS = [
  "fullscreenerror",
  "webkitfullscreenerror",
  "mozfullscreenerror",
  "MSFullscreenError",
] as const;

type FullscreenDocument = Document & {
  readonly webkitFullscreenElement?: Element | null;
  readonly mozFullScreenElement?: Element | null;
  readonly msFullscreenElement?: Element | null;
};

function getCurrentFullscreenElement(doc: Document): Element | null {
  const fullscreenDocument = doc as FullscreenDocument;

  return (
    fullscreenDocument.fullscreenElement ??
    fullscreenDocument.webkitFullscreenElement ??
    fullscreenDocument.mozFullScreenElement ??
    fullscreenDocument.msFullscreenElement ??
    null
  );
}

function getInlineMediaVariant(
  mimeType: string | null | undefined
): InlineMediaVariant {
  const normalizedMimeType = (mimeType?.split(";")[0] ?? "")
    .trim()
    .toLowerCase();

  if (normalizedMimeType === "text/html") {
    return "html";
  }

  return "image";
}

export function MemePageArtViewer({
  nft,
  showBalance = false,
  locale = DEFAULT_LOCALE,
}: {
  readonly nft: BaseNFT;
  readonly showBalance?: boolean;
  readonly locale?: SupportedLocale;
}) {
  const { connectedProfile } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullscreenOriginalTargetId, setFullscreenOriginalTargetId] = useState<
    string | null
  >(null);
  const slideTouchStartX = useRef<number | null>(null);

  const animationHref = getResolvedAnimationSrc(nft);
  const hasAnimation = Boolean(animationHref);
  const metadata = nft.metadata as Parameters<
    typeof getImageFileTypeFromMetadata
  >[0];
  const imageFormat = getImageFileTypeFromMetadata(metadata);
  const animationFormat = getAnimationFileTypeFromMetadata(metadata);
  const imageMimeType = getImageMimeTypeFromMetadata(metadata);
  const animationMimeType = getAnimationMimeTypeFromMetadata(metadata);
  const imageHref = getResolvedImageSrc(nft);
  const hasImage = Boolean(imageHref);
  const isShowingAnimation = hasAnimation && (currentSlide === 0 || !imageHref);
  const hasMultipleSlides = hasAnimation && hasImage;
  const activeMedia = isShowingAnimation
    ? {
        dialogTitle: t(locale, "theMemes.detail.art.media.saveAnimation"),
        fallbackFileName: "animation",
        format: animationFormat,
        fullscreenElementId: "the-art-fullscreen-animation",
        mimeType: animationMimeType,
        url: animationHref,
        variant: getInlineMediaVariant(animationMimeType),
      }
    : {
        dialogTitle: t(locale, "theMemes.detail.art.media.saveImage"),
        fallbackFileName: "image",
        format: imageFormat,
        fullscreenElementId: hasImage ? "the-art-fullscreen-img" : "",
        mimeType: imageMimeType,
        url: imageHref,
        variant: getInlineMediaVariant(imageMimeType),
      };
  const currentFormat = activeMedia.format ?? "";
  const activeMediaUrl = activeMedia.url ?? "";
  const canUseBrowserMediaActions = activeMedia.variant !== "html";
  const mediaActionLabels = {
    close: t(locale, "theMemes.detail.art.media.close"),
    download: t(locale, "theMemes.detail.art.media.download"),
    downloading: t(locale, "theMemes.detail.art.media.downloading"),
    fullscreen: t(locale, "theMemes.detail.art.media.fullscreen"),
  };
  const showBalanceControl = showBalance && Boolean(connectedProfile);
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: activeMediaUrl,
      fallbackFileName: activeMedia.fallbackFileName,
      dialogTitle: activeMedia.dialogTitle,
      mimeType: activeMedia.mimeType ?? undefined,
      labels: {
        openInBrowser: t(locale, "theMemes.detail.art.media.openInBrowser"),
        openInNewTab: t(locale, "theMemes.detail.art.media.openInNewTab"),
      },
    });

  useEffect(() => {
    if (typeof globalThis.document === "undefined") {
      return;
    }

    const doc = globalThis.document;

    function clearOriginalAfterFullscreenExit() {
      if (!getCurrentFullscreenElement(doc)) {
        setFullscreenOriginalTargetId(null);
      }
    }

    FULLSCREEN_CHANGE_EVENTS.forEach((eventName) => {
      doc.addEventListener(eventName, clearOriginalAfterFullscreenExit);
    });
    FULLSCREEN_ERROR_EVENTS.forEach((eventName) => {
      doc.addEventListener(eventName, clearOriginalAfterFullscreenExit);
    });

    return () => {
      FULLSCREEN_CHANGE_EVENTS.forEach((eventName) => {
        doc.removeEventListener(eventName, clearOriginalAfterFullscreenExit);
      });
      FULLSCREEN_ERROR_EVENTS.forEach((eventName) => {
        doc.removeEventListener(eventName, clearOriginalAfterFullscreenExit);
      });
    };
  }, []);

  useEffect(() => {
    if (!hasMultipleSlides) {
      setCurrentSlide(0);
    }
  }, [hasMultipleSlides]);

  function goToPreviousSlide() {
    setCurrentSlide((slide) => Math.max(0, slide - 1));
  }

  function goToNextSlide() {
    setCurrentSlide((slide) =>
      Math.min(hasMultipleSlides ? 1 : 0, slide + 1)
    );
  }

  function handleSlideTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (!hasMultipleSlides) {
      return;
    }

    slideTouchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleSlideTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!hasMultipleSlides) {
      slideTouchStartX.current = null;
      return;
    }

    const startX = slideTouchStartX.current;
    slideTouchStartX.current = null;

    if (startX === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) {
      return;
    }

    const swipeDelta = endX - startX;
    const minSwipeDistance = 40;

    if (Math.abs(swipeDelta) < minSwipeDistance) {
      return;
    }

    if (swipeDelta > 0) {
      goToPreviousSlide();
    } else {
      goToNextSlide();
    }
  }

  function enterActiveMediaFullScreen() {
    const fullscreenElementId = activeMedia.fullscreenElementId;

    if (!fullscreenElementId) {
      return;
    }

    flushSync(() => {
      setFullscreenOriginalTargetId(fullscreenElementId);
    });

    const clearAttemptedOriginalTarget = () => {
      setFullscreenOriginalTargetId((currentTargetId) =>
        currentTargetId === fullscreenElementId ? null : currentTargetId
      );
    };

    void (async () => {
      const didEnterFullscreen = await enterArtFullScreen(fullscreenElementId);

      if (!didEnterFullscreen) {
        clearAttemptedOriginalTarget();
      }
    })().catch(clearAttemptedOriginalTarget);
  }

  function printMediaActions() {
    if (!activeMediaUrl) {
      return null;
    }

    return (
      <InlineMediaActions
        variant={activeMedia.variant}
        onDownload={canUseBrowserMediaActions ? downloadMedia : undefined}
        onOpen={canUseBrowserMediaActions ? openMedia : undefined}
        openLabel={canUseBrowserMediaActions ? openLabel : undefined}
        isDownloading={isDownloading}
        onFullscreen={enterActiveMediaFullScreen}
        fullscreenTargetAvailable={Boolean(activeMedia.fullscreenElementId)}
        labels={mediaActionLabels}
      />
    );
  }

  function printArtworkControls() {
    if (!showBalanceControl && !hasMultipleSlides) {
      return null;
    }

    return (
      <div className={`${styles["artControls"]} tw-w-full`}>
        <div className={styles["artControlsContent"]}>
          {showBalanceControl && (
            <div className={styles["artControlsBalance"] ?? ""}>
              <NFTImageBalance
                contract={nft.contract}
                tokenId={nft.id}
                height={650}
                variant="compact"
              />
            </div>
          )}
          {hasMultipleSlides && (
            <div
              className={`${styles["artControlsCenter"] ?? ""} ${
                showBalanceControl
                  ? (styles["artControlsCenterWithBalance"] ?? "")
                  : ""
              } ${styles["artControlsCenterGrouped"] ?? ""}`}
            >
              <button
                type="button"
                aria-label={t(locale, "theMemes.detail.art.media.previous")}
                disabled={currentSlide === 0}
                className={styles["artSlideButton"]}
                onClick={goToPreviousSlide}
              >
                <ChevronLeftIcon
                  aria-hidden="true"
                  className={styles["artSlideIcon"]}
                />
              </button>
              <div className={styles["artControlsFormatLabel"]}>
                {currentFormat}
              </div>
              <button
                type="button"
                aria-label={t(locale, "theMemes.detail.art.media.next")}
                disabled={currentSlide === 1}
                className={styles["artSlideButton"]}
                onClick={goToNextSlide}
              >
                <ChevronRightIcon
                  aria-hidden="true"
                  className={styles["artSlideIcon"]}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-p-0">
      <div className="tw-flex tw-flex-1 tw-flex-col">
        {hasAnimation ? (
          <>
            <div className="tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-items-center tw-bg-iron-950 tw-p-0">
              <div
                className={`${styles["memesCarousel"] ?? ""} tw-w-full`}
                role="group"
                aria-roledescription="carousel"
                onTouchStart={handleSlideTouchStart}
                onTouchEnd={handleSlideTouchEnd}
              >
                <div
                  data-carousel-slide
                  className={`tw-h-full tw-items-center tw-justify-center tw-text-center ${
                    currentSlide === 0 ? "tw-flex" : "tw-hidden"
                  }`}
                >
                  <NFTImage
                    nft={nft}
                    animation={true}
                    height={650}
                    transparentBG={true}
                    showBalance={false}
                    showOriginal={
                      fullscreenOriginalTargetId ===
                      "the-art-fullscreen-animation"
                    }
                    id="the-art-fullscreen-animation"
                  />
                </div>
                {hasImage && (
                  <div
                    data-carousel-slide
                    className={`tw-h-full tw-items-center tw-justify-center tw-text-center ${
                      currentSlide === 1 ? "tw-flex" : "tw-hidden"
                    }`}
                  >
                    <NFTImage
                      nft={nft}
                      animation={false}
                      height={650}
                      showBalance={false}
                      showOriginal={
                        fullscreenOriginalTargetId === "the-art-fullscreen-img"
                      }
                      transparentBG={true}
                      id="the-art-fullscreen-img"
                    />
                  </div>
                )}
              </div>
              {printMediaActions()}
            </div>
            {printArtworkControls()}
          </>
        ) : (
          <>
            {hasImage && (
              <div className="tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-items-center tw-bg-iron-950">
                <NFTImage
                  nft={nft}
                  animation={false}
                  height={650}
                  transparentBG={true}
                  showBalance={false}
                  showOriginal={
                    fullscreenOriginalTargetId === "the-art-fullscreen-img"
                  }
                  id="the-art-fullscreen-img"
                />
                {printMediaActions()}
              </div>
            )}
            {printArtworkControls()}
          </>
        )}
      </div>
    </div>
  );
}
