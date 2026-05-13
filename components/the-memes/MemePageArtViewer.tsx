"use client";

import NFTImage from "@/components/nft-image/NFTImage";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { getResolvedImageSrc } from "@/components/nft-image/utils/image-source";
import type { NFT } from "@/entities/INFT";
import { enterArtFullScreen, fullScreenSupported } from "@/helpers/Helpers";
import {
  getAnimationFileTypeFromMetadata,
  getImageFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { faExpandAlt } from "@fortawesome/free-solid-svg-icons";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useSyncExternalStore } from "react";
import { Carousel, Col, Container, Row } from "react-bootstrap";
import styles from "./TheMemes.module.scss";

export function MemePageArtViewer({
  nft,
  showBalance = false,
}: {
  readonly nft: NFT;
  readonly showBalance?: boolean;
}) {
  const isFullScreenSupported = useSyncExternalStore(
    () => () => undefined,
    fullScreenSupported,
    () => false
  );
  const [currentSlide, setCurrentSlide] = useState(0);

  const animationHref = getResolvedAnimationSrc(nft);
  const hasAnimation = Boolean(animationHref);
  const metadata = nft.metadata as Parameters<
    typeof getImageFileTypeFromMetadata
  >[0];
  const imageFormat = getImageFileTypeFromMetadata(metadata);
  const animationFormat = getAnimationFileTypeFromMetadata(metadata);
  const imageHref = getResolvedImageSrc(nft);
  const hasImage = Boolean(imageHref);
  const isShowingAnimation = hasAnimation && (currentSlide === 0 || !imageHref);
  const hasMultipleSlides = hasAnimation && hasImage;
  let fullscreenElementId = "";
  if (isShowingAnimation) {
    fullscreenElementId = "the-art-fullscreen-animation";
  } else if (hasImage) {
    fullscreenElementId = "the-art-fullscreen-img";
  }
  const fileType = isShowingAnimation ? animationFormat : imageFormat;
  const currentFormat = fileType ?? "";

  function carouselHandlerSlide(event: number) {
    setCurrentSlide(event);
  }

  function goToPreviousSlide() {
    setCurrentSlide((slide) => Math.max(0, slide - 1));
  }

  function goToNextSlide() {
    setCurrentSlide((slide) => Math.min(1, slide + 1));
  }

  function printArtworkControls() {
    return (
      <Col xs={12} className={styles["artControls"]}>
        <div className={styles["artControlsContent"]}>
          {showBalance && (
            <div className={styles["artControlsBalance"]}>
              <NFTImageBalance
                contract={nft.contract}
                tokenId={nft.id}
                height={650}
                inline
              />
            </div>
          )}
          <div className={styles["artControlsCenter"]}>
            {hasMultipleSlides && (
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
            )}
            <div className={styles["artControlsFormatLabel"]}>
              {currentFormat}
            </div>
            {hasMultipleSlides && (
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
            )}
          </div>
          {isFullScreenSupported && (
            <button
              type="button"
              aria-label="View artwork fullscreen"
              className={styles["fullScreenButton"]}
              onClick={() =>
                fullscreenElementId && enterArtFullScreen(fullscreenElementId)
              }
            >
              <FontAwesomeIcon
                aria-hidden="true"
                icon={faExpandAlt}
                className={styles["fullScreen"]}
              />
            </button>
          )}
        </div>
      </Col>
    );
  }

  return (
    <Container className="p-0">
      <Row className="position-relative">
        {hasAnimation ? (
          <>
            <Carousel
              className={styles["memesCarousel"]}
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
                  showOriginal={true}
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
                    showOriginal={true}
                    id="the-art-fullscreen-img"
                  />
                </Carousel.Item>
              )}
            </Carousel>
            {printArtworkControls()}
          </>
        ) : (
          <>
            {hasImage && (
              <NFTImage
                nft={nft}
                animation={false}
                height={650}
                transparentBG={true}
                showOriginal={true}
                showBalance={false}
                id="the-art-fullscreen-img"
              />
            )}
            {printArtworkControls()}
          </>
        )}
      </Row>
    </Container>
  );
}
