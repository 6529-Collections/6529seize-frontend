"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import { ArweaveLinksTable } from "@/components/nft-attributes/ArweaveLinksTable";
import NFTAttributes from "@/components/nft-attributes/NFTAttributes";
import NFTImage from "@/components/nft-image/NFTImage";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { getResolvedImageSrc } from "@/components/nft-image/utils/image-source";
import type { IAttribute, MemesExtendedData, NFT } from "@/entities/INFT";
import {
  enterArtFullScreen,
  fullScreenSupported,
  numberWithCommas,
  parseNftDescriptionToHtml,
  printMintDate,
} from "@/helpers/Helpers";
import {
  getAnimationDimensionsFromMetadata,
  getAnimationFileTypeFromMetadata,
  getAnimationMimeTypeFromMetadata,
  getImageDimensionsFromMetadata,
  getImageFileTypeFromMetadata,
  getImageMimeTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { faExpandAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Carousel, Col, Container, Row, Table } from "react-bootstrap";
import ArtistProfileHandle from "./ArtistProfileHandle";
import styles from "./TheMemes.module.scss";

const PROPERTY_EXCLUDED_TRAITS = new Set([
  "Type - Season",
  "Type - Meme",
  "Type - Card",
]);

function formatTdhRate(value: number | undefined): string {
  if (!value || value <= 0) {
    return "N/A";
  }

  return numberWithCommas(Math.round(value * 100) / 100);
}

function shouldShowPropertyAttribute(attribute: IAttribute): boolean {
  const displayType = attribute.display_type?.trim().toLowerCase();

  return (
    !PROPERTY_EXCLUDED_TRAITS.has(attribute.trait_type) &&
    (!displayType || displayType === "text")
  );
}

export function MemePageArt(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: MemesExtendedData | undefined;
  showArtwork?: boolean;
}) {
  const [isFullScreenSupported, setIsFullScreenSupported] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);

  const animationHref = getResolvedAnimationSrc(props.nft);
  const hasAnimation = Boolean(animationHref);
  const imageFormat = getImageFileTypeFromMetadata(props.nft?.metadata);
  const animationFormat = getAnimationFileTypeFromMetadata(props.nft?.metadata);
  const imageDimensions = getImageDimensionsFromMetadata(props.nft?.metadata);
  const animationDimensions = getAnimationDimensionsFromMetadata(
    props.nft?.metadata
  );
  const imageHref = getResolvedImageSrc(props.nft);
  const metadataHref = props.nft?.uri.trim() ?? "";
  const metadata =
    props.nft?.metadata !== null && typeof props.nft?.metadata === "object"
      ? (props.nft.metadata as {
          readonly image?: unknown;
          readonly animation?: unknown;
          readonly animation_url?: unknown;
        })
      : undefined;
  const artImageHref =
    (typeof metadata?.image === "string" ? metadata.image.trim() : "") ||
    (typeof props.nft?.image === "string" ? props.nft.image.trim() : "") ||
    "";
  const artAnimationHref =
    (typeof metadata?.animation_url === "string"
      ? metadata.animation_url.trim()
      : "") ||
    (typeof metadata?.animation === "string"
      ? metadata.animation.trim()
      : "") ||
    (typeof props.nft?.animation === "string"
      ? props.nft.animation.trim()
      : "") ||
    "";
  const hasImage = Boolean(imageHref);
  const isShowingAnimation = hasAnimation && (currentSlide === 0 || !imageHref);
  let fullscreenElementId = "";
  if (isShowingAnimation) {
    fullscreenElementId = "the-art-fullscreen-animation";
  } else if (hasImage) {
    fullscreenElementId = "the-art-fullscreen-img";
  }
  const fileType = isShowingAnimation ? animationFormat : imageFormat;
  const fileTypeMimeType = isShowingAnimation
    ? getAnimationMimeTypeFromMetadata(props.nft?.metadata)
    : getImageMimeTypeFromMetadata(props.nft?.metadata);
  const dimensions = isShowingAnimation ? animationDimensions : imageDimensions;
  const arweaveRows = [
    metadataHref
      ? {
          label: "JSON",
          url: metadataHref,
          openLabel: "Open JSON in new tab",
        }
      : null,
    artImageHref
      ? {
          label: imageFormat?.toUpperCase() || "IMAGE",
          url: artImageHref,
          openLabel: "Open image in new tab",
          extension: imageFormat ?? "",
          downloadName: props.nft?.name || `meme-${props.nft?.id ?? "asset"}`,
        }
      : null,
    artAnimationHref
      ? {
          label: animationFormat?.toUpperCase() || "ANIMATION",
          url: artAnimationHref,
          openLabel: "Open animation in new tab",
          extension: animationFormat ?? "",
          downloadName: props.nft?.name || `meme-${props.nft?.id ?? "asset"}`,
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    url: string;
    openLabel: string;
    extension?: string | undefined;
    downloadName?: string | undefined;
  }[];

  const distributionPlanLink = (() => {
    const id = props.nft?.id;
    if (!id) return "";
    if (props.nft?.has_distribution) return `/the-memes/${id}/distribution`;
    if (id > 3)
      return `https://github.com/6529-Collections/thememecards/tree/main/card${id}`;
    return `https://github.com/6529-Collections/thememecards/tree/main/card1-3`;
  })();

  const detailRows = [
    {
      key: "edition-size",
      label: "Edition Size",
      value: <span className="tw-font-medium">{props.nft?.supply}</span>,
    },
    {
      key: "collection",
      label: "Collection",
      value: <span className="tw-font-medium">{props.nft?.collection}</span>,
    },
    {
      key: "season",
      label: "Season",
      value: <span className="tw-font-medium">{props.nftMeta?.season}</span>,
    },
    {
      key: "meme",
      label: "Meme",
      value: <span className="tw-font-medium">{props.nftMeta?.meme_name}</span>,
    },
    {
      key: "mint-date",
      label: "Mint Date",
      value: (
        <span className="tw-font-medium">
          {printMintDate(props.nft?.mint_date)}
        </span>
      ),
    },
    {
      key: "artist-name",
      label: "Artist Name",
      value: <span className="tw-font-medium">{props.nft?.artist}</span>,
    },
    {
      key: "artist-profile",
      label: "Artist Profile",
      value: (
        <span className="tw-font-medium">
          {props.nft ? <ArtistProfileHandle nft={props.nft} /> : null}
        </span>
      ),
    },
    ...(fileType
      ? [
          {
            key: "file-type",
            label: "File Type",
            value: (
              <span className="tw-font-medium">
                <MediaTypeBadge
                  mimeType={fileTypeMimeType ?? undefined}
                  size="sm"
                  showTooltip={false}
                  showLabel={true}
                  tone="color"
                  labelClassName="tw-text-inherit tw-font-medium"
                />
              </span>
            ),
          },
        ]
      : []),
    ...(distributionPlanLink
      ? [
          {
            key: "minting-approach",
            label: "Minting Approach",
            value: (
              <span className="tw-font-medium">
                <Link
                  href={distributionPlanLink}
                  target={props.nft?.has_distribution ? "_self" : "_blank"}
                  rel={
                    props.nft?.has_distribution
                      ? undefined
                      : "noopener noreferrer"
                  }
                  className={styles["distributionPlanLink"]}
                >
                  Distribution Plan
                </Link>
              </span>
            ),
          },
        ]
      : []),
    {
      key: "mint-price",
      label: "Mint Price",
      value: (
        <span className="tw-font-medium">
          {props.nft && props.nft.mint_price > 0
            ? `${numberWithCommas(
                Math.round(props.nft.mint_price * 100000) / 100000
              )} ETH`
            : `N/A`}
        </span>
      ),
    },
    {
      key: "tdh-rate",
      label: "TDH Rate",
      value: (
        <span className="tw-font-medium">
          {formatTdhRate(props.nft?.hodl_rate)}
        </span>
      ),
    },
    {
      key: "dimensions",
      label: "Dimensions",
      value: <span className="tw-font-medium">{dimensions || "N/A"}</span>,
    },
  ];
  const detailSplitIndex = Math.ceil(detailRows.length / 2);
  const detailColumns = [
    detailRows.slice(0, detailSplitIndex),
    detailRows.slice(detailSplitIndex),
  ];

  useEffect(() => {
    setIsFullScreenSupported(fullScreenSupported());
  }, []);

  useEffect(() => {
    setCurrentSlide(0);
  }, [props.nft]);

  function carouselHandlerSlide(event: any) {
    setCurrentSlide(event);
  }

  const currentFormat = fileType ?? "";
  const showArtwork = props.showArtwork ?? true;

  if (props.show && props.nft && props.nftMeta) {
    return (
      <>
        {showArtwork && (
          <Container className="p-0">
            <Row className="position-relative">
              {hasAnimation ? (
                <>
                  <Col xs={12} className={styles["artHeader"]}>
                    <div className={styles["artHeaderContent"]}>
                      <div className={styles["artFormatLabel"]}>
                        {currentFormat}
                      </div>
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
                        nft={props.nft}
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
                          nft={props.nft}
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
                </>
              ) : (
                <>
                  <Col xs={12} className={styles["artHeader"]}>
                    <div className={styles["artHeaderContent"]}>
                      <div className={styles["artFormatLabel"]}>
                        {currentFormat}
                      </div>
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
                      nft={props.nft}
                      animation={false}
                      height={650}
                      transparentBG={true}
                      showOriginal={true}
                      showBalance={false}
                      id="the-art-fullscreen-img"
                    />
                  )}
                </>
              )}
            </Row>
          </Container>
        )}
        <Container className={`${showArtwork ? "pt-5" : "pt-3"} pb-3`}>
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col>
                    <Row>
                      <Col>
                        <h3 className="tw-pb-2">Arweave Links</h3>
                      </Col>
                    </Row>
                    <ArweaveLinksTable
                      rows={arweaveRows}
                      linkClassName={styles["arweaveLink"]}
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col xs={{ span: 12 }}>
              <Container>
                <Row>
                  <Col>
                    <h3>Card Details</h3>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 12 }} className="d-lg-none">
                    <Table bordered={false}>
                      <tbody>
                        {detailRows.map((row) => (
                          <tr key={row.key}>
                            <td>{row.label}</td>
                            <td>{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                  {detailColumns.map((columnRows) => (
                    <Col
                      key={columnRows.map((row) => row.key).join("-")}
                      xs={{ span: 12 }}
                      lg={{ span: 6 }}
                      className="d-none d-lg-block"
                    >
                      <Table bordered={false}>
                        <tbody>
                          {columnRows.map((row) => (
                            <tr key={row.key}>
                              <td>{row.label}</td>
                              <td>{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Col>
                  ))}
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col>
                    <h3>Card Description</h3>
                  </Col>
                </Row>
                <Row>
                  <Col
                    dangerouslySetInnerHTML={{
                      __html: parseNftDescriptionToHtml(props.nft.description),
                    }}
                  ></Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col>
                    <h3>Properties</h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <NFTAttributes
                      attributes={props.nft.metadata.attributes.filter(
                        shouldShowPropertyAttribute
                      )}
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col
              xs={{ span: 12 }}
              sm={{ span: 6 }}
              md={{ span: 6 }}
              lg={{ span: 6 }}
            >
              <Container>
                <Row>
                  <Col>
                    <h3>Stats</h3>
                  </Col>
                </Row>
                <Row>
                  <Col
                    xs={{ span: 12 }}
                    sm={{ span: 10 }}
                    md={{ span: 8 }}
                    lg={{ span: 6 }}
                  >
                    <Table>
                      <tbody>
                        <tr>
                          <td>Type - Season</td>
                          <td className="text-right">
                            {
                              props.nft.metadata.attributes.find(
                                (a: any) => a.trait_type === "Type - Season"
                              ).value
                            }
                          </td>
                        </tr>
                        <tr>
                          <td>Type - Meme</td>
                          <td className="text-right">
                            {
                              props.nft.metadata.attributes.find(
                                (a: any) => a.trait_type === "Type - Meme"
                              ).value
                            }
                          </td>
                        </tr>
                        <tr>
                          <td>Type - Card</td>
                          <td className="text-right">
                            {
                              props.nft.metadata.attributes.find(
                                (a: any) => a.trait_type === "Type - Card"
                              ).value
                            }
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </Container>
            </Col>
            <Col
              xs={{ span: 12 }}
              sm={{ span: 6 }}
              md={{ span: 6 }}
              lg={{ span: 6 }}
            >
              <Container>
                <Row>
                  <Col>
                    <h3>Boosts</h3>
                  </Col>
                </Row>
                <Row>
                  <Col
                    xs={{ span: 12 }}
                    sm={{ span: 10 }}
                    md={{ span: 8 }}
                    lg={{ span: 6 }}
                  >
                    <Table>
                      <tbody>
                        {props.nft.metadata.attributes
                          .filter(
                            (a: any) => a.display_type === "boost_percentage"
                          )
                          .map((a: any) => (
                            <tr key={a.trait_type}>
                              <td>{a.trait_type}</td>
                              <td className="text-right">
                                {a.value > 0 && "+"}
                                {a.value}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </>
    );
  } else {
    return <></>;
  }
}
