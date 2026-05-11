"use client";

import NFTImage from "@/components/nft-image/NFTImage";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { getResolvedImageSrc } from "@/components/nft-image/utils/image-source";
import type { NFT } from "@/entities/INFT";
import { enterArtFullScreen, fullScreenSupported } from "@/helpers/Helpers";
import {
  getAnimationFileTypeFromMetadata,
  getImageFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { faExpandAlt } from "@fortawesome/free-solid-svg-icons";
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

  return (
    <Container className="p-0">
      <Row className="position-relative">
        {hasAnimation ? (
          <>
            <Col xs={12} className={styles["artHeader"]}>
              <div className={styles["artHeaderContent"]}>
                <div className={styles["artFormatLabel"]}>{currentFormat}</div>
                {isFullScreenSupported && (
                  <FontAwesomeIcon
                    icon={faExpandAlt}
                    className={styles["fullScreen"]}
                    onClick={() =>
                      fullscreenElementId &&
                      enterArtFullScreen(fullscreenElementId)
                    }
                  />
                )}
              </div>
            </Col>
            <Carousel
              className={styles["memesCarousel"]}
              interval={null}
              indicators={false}
              wrap={false}
              onSlide={carouselHandlerSlide}
            >
              <Carousel.Item className="text-center">
                <NFTImage
                  nft={nft}
                  animation={true}
                  height={650}
                  transparentBG={true}
                  showOriginal={true}
                  showBalance={showBalance}
                  id="the-art-fullscreen-animation"
                />
              </Carousel.Item>
              {hasImage && (
                <Carousel.Item className="text-center">
                  <NFTImage
                    nft={nft}
                    animation={false}
                    height={650}
                    showBalance={showBalance}
                    transparentBG={true}
                    showOriginal={true}
                    id="the-art-fullscreen-img"
                  />
                </Carousel.Item>
              )}
            </Carousel>
          </>
        ) : (
          <>
            <Col xs={12} className={styles["artHeader"]}>
              <div className={styles["artHeaderContent"]}>
                <div className={styles["artFormatLabel"]}>{currentFormat}</div>
                {isFullScreenSupported && (
                  <FontAwesomeIcon
                    icon={faExpandAlt}
                    className={styles["fullScreen"]}
                    onClick={() =>
                      fullscreenElementId &&
                      enterArtFullScreen(fullscreenElementId)
                    }
                  />
                )}
              </div>
            </Col>
            {hasImage && (
              <NFTImage
                nft={nft}
                animation={false}
                height={650}
                transparentBG={true}
                showOriginal={true}
                showBalance={showBalance}
                id="the-art-fullscreen-img"
              />
            )}
          </>
        )}
      </Row>
    </Container>
  );
}
