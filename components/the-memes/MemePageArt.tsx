"use client";

import { ArweaveLinksTable } from "@/components/nft-attributes/ArweaveLinksTable";
import NFTAttributes from "@/components/nft-attributes/NFTAttributes";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import type { IAttribute, MemesExtendedData, NFT } from "@/entities/INFT";
import {
  getAnimationDimensionsFromMetadata,
  getAnimationFileTypeFromMetadata,
  getImageDimensionsFromMetadata,
  getImageFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import Link from "next/link";
import { Col, Container, Row, Table } from "react-bootstrap";
import styles from "./TheMemes.module.scss";

const PROPERTY_EXCLUDED_TRAITS = new Set([
  "Type - Season",
  "Type - Meme",
  "Type - Card",
]);

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
}) {
  const animationHref = getResolvedAnimationSrc(props.nft);
  const hasAnimation = Boolean(animationHref);
  const imageFormat = getImageFileTypeFromMetadata(props.nft?.metadata);
  const animationFormat = getAnimationFileTypeFromMetadata(props.nft?.metadata);
  const imageDimensions = getImageDimensionsFromMetadata(props.nft?.metadata);
  const animationDimensions = getAnimationDimensionsFromMetadata(
    props.nft?.metadata
  );
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
  const dimensions = hasAnimation ? animationDimensions : imageDimensions;
  const mediaRows = [
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

  const detailRows = [
    {
      key: "meme",
      label: "Meme",
      value: <span className="tw-font-medium">{props.nftMeta?.meme_name}</span>,
    },
    {
      key: "collection",
      label: "Collection",
      value: <span className="tw-font-medium">{props.nft?.collection}</span>,
    },
    {
      key: "dimensions",
      label: "Dimensions",
      value: <span className="tw-font-medium">{dimensions || "N/A"}</span>,
    },
  ];

  if (props.show && props.nft && props.nftMeta) {
    return (
      <>
        {mediaRows.length > 0 && (
          <Container className="pt-3 pb-3">
            <Row>
              <Col>
                <Container>
                  <Row>
                    <Col>
                      <Row>
                        <Col>
                          <h3 className="tw-pb-2">Media Links</h3>
                        </Col>
                      </Row>
                      <ArweaveLinksTable
                        rows={mediaRows}
                        linkClassName={styles["arweaveLink"]}
                      />
                    </Col>
                  </Row>
                </Container>
              </Col>
            </Row>
          </Container>
        )}
        <Container className="pt-3 pb-3">
          <Row>
            <Col xs={{ span: 12 }}>
              <Container>
                <Row>
                  <Col>
                    <h3>Additional Card Details</h3>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 12 }} lg={{ span: 6 }}>
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
                {metadataHref && (
                  <Row>
                    <Col className="tw-pb-3">
                      <Link
                        href={metadataHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-white/20 tw-bg-transparent tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-transition-colors hover:tw-border-white/40 hover:tw-bg-white/10 hover:tw-text-white"
                      >
                        Open Raw Metadata
                      </Link>
                    </Col>
                  </Row>
                )}
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
