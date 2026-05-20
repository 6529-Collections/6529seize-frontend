"use client";

import NFTImage from "@/components/nft-image/NFTImage";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import { InlineMediaActions } from "@/components/drops/view/item/content/media/MediaActionToolbar";
import { useMediaActions } from "@/components/drops/view/item/content/media/useMediaActions";
import { useAuth } from "@/components/auth/Auth";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { getResolvedImageSrc } from "@/components/nft-image/utils/image-source";
import type { NFT } from "@/entities/INFT";
import { enterArtFullScreen } from "@/helpers/Helpers";
import {
  getAnimationFileTypeFromMetadata,
  getAnimationMimeTypeFromMetadata,
  getImageFileTypeFromMetadata,
  getImageMimeTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Carousel, Col, Container, Row } from "react-bootstrap";
import styles from "./TheMemes.module.scss";

type InlineMediaVariant = "image" | "html";

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
}: {
  readonly nft: NFT;
  readonly showBalance?: boolean;
}) {
  const { connectedProfile } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

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
        dialogTitle: "Save animation",
        fallbackFileName: "animation",
        format: animationFormat,
        fullscreenElementId: "the-art-fullscreen-animation",
        mimeType: animationMimeType,
        url: animationHref,
        variant: getInlineMediaVariant(animationMimeType),
      }
    : {
        dialogTitle: "Save image",
        fallbackFileName: "image",
        format: imageFormat,
        fullscreenElementId: hasImage ? "the-art-fullscreen-img" : "",
        mimeType: imageMimeType,
        url: imageHref,
        variant: getInlineMediaVariant(imageMimeType),
      };
  const currentFormat = activeMedia.format ?? "";
  const activeMediaUrl = activeMedia.url ?? "";
  const showBalanceControl = showBalance && Boolean(connectedProfile);
  const { downloadMedia, isDownloading, openLabel, openMedia } =
    useMediaActions({
      url: activeMediaUrl,
      fallbackFileName: activeMedia.fallbackFileName,
      dialogTitle: activeMedia.dialogTitle,
      mimeType: activeMedia.mimeType ?? undefined,
    });

  function carouselHandlerSlide(event: number) {
    setCurrentSlide(event);
  }

  function goToPreviousSlide() {
    setCurrentSlide((slide) => Math.max(0, slide - 1));
  }

  function goToNextSlide() {
    setCurrentSlide((slide) => Math.min(1, slide + 1));
  }

  function printMediaActions() {
    if (!activeMediaUrl) {
      return null;
    }

    return (
      <InlineMediaActions
        variant={activeMedia.variant}
        onDownload={downloadMedia}
        onOpen={openMedia}
        openLabel={openLabel}
        isDownloading={isDownloading}
        onFullscreen={() => {
          if (activeMedia.fullscreenElementId) {
            void enterArtFullScreen(activeMedia.fullscreenElementId);
          }
        }}
        fullscreenTargetAvailable={Boolean(activeMedia.fullscreenElementId)}
      />
    );
  }

  function printArtworkControls() {
    if (!showBalanceControl && !hasMultipleSlides) {
      return null;
    }

    return (
      <Col xs={12} className={styles["artControls"]}>
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
                aria-label="Show previous artwork media"
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
                aria-label="Show next artwork media"
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
      </Col>
    );
  }

  return (
    <Container className="p-0 tw-flex tw-h-full tw-flex-col">
      <Row className="g-0 tw-flex-1 tw-flex-col">
        {hasAnimation ? (
          <>
            <div className="tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-items-center tw-bg-iron-950 tw-p-0">
              <Carousel
                className={`${styles["memesCarousel"] ?? ""} tw-w-full`}
                activeIndex={currentSlide}
                controls={false}
                interval={null}
                indicators={false}
                wrap={false}
                onSelect={carouselHandlerSlide}
              >
                <Carousel.Item className="text-center">
                  <NFTImage
                    nft={nft}
                    animation={true}
                    height={650}
                    transparentBG={true}
                    showBalance={false}
                    id="the-art-fullscreen-animation"
                  />
                </Carousel.Item>
                {hasImage && (
                  <Carousel.Item className="text-center">
                    <NFTImage
                      nft={nft}
                      animation={false}
                      height={650}
                      showBalance={false}
                      transparentBG={true}
                      id="the-art-fullscreen-img"
                    />
                  </Carousel.Item>
                )}
              </Carousel>
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
                  id="the-art-fullscreen-img"
                />
                {printMediaActions()}
              </div>
            )}
            {printArtworkControls()}
          </>
        )}
      </Row>
    </Container>
  );
}
