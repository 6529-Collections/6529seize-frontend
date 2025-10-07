"use client";

import Download from "@/components/download/Download";
import NFTAttributes from "@/components/nft-attributes/NFTAttributes";
import NFTImage from "@/components/nft-image/NFTImage";
import { MemesExtendedData, NFT } from "@/entities/INFT";
import {
  enterArtFullScreen,
  fullScreenSupported,
  numberWithCommas,
  parseNftDescriptionToHtml,
  printMintDate,
} from "@/helpers/Helpers";
import {
  getDimensionsFromMetadata,
  getFileTypeFromMetadata,
} from "@/helpers/nft.helpers";
import { faExpandAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Carousel, Col, Container, Row, Table } from "react-bootstrap";
import ArtistProfileHandle from "./ArtistProfileHandle";
import styles from "./TheMemes.module.scss";

export function MemePageArt(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: MemesExtendedData | undefined;
}) {
  const [isFullScreenSupported, setIsFullScreenSupported] = useState(false);

  const [fullscreenElementId, setFullscreenElementId] = useState<string>(
    "the-art-fullscreen-img"
  );

  const distributionPlanLink = (() => {
    const id = props.nft?.id;
    if (!id) return "";
    if (props.nft?.has_distribution) return `/the-memes/${id}/distribution`;
    if (id > 3)
      return `https://github.com/6529-Collections/thememecards/tree/main/card${id}`;
    return `https://github.com/6529-Collections/thememecards/tree/main/card1-3`;
  })();

  useEffect(() => {
    setIsFullScreenSupported(fullScreenSupported());
  }, []);

  function carouselHandlerSlide(event: any) {
    if (event === 0) {
      setFullscreenElementId("the-art-fullscreen-animation");
    } else {
      setFullscreenElementId("the-art-fullscreen-img");
    }
  }

  if (props.show && props.nft && props.nftMeta) {
    return (
      <>
        <Container className="p-0">
          <Row className="position-relative">
            {isFullScreenSupported && (
              <FontAwesomeIcon
                icon={faExpandAlt}
                className={styles.fullScreen}
                onClick={() =>
                  fullscreenElementId && enterArtFullScreen(fullscreenElementId)
                }
              />
            )}
            {props.nft.animation || props.nft.metadata.animation ? (
              <Carousel
                className={styles.memesCarousel}
                interval={null}
                indicators={false}
                wrap={false}
                onSlide={carouselHandlerSlide}>
                <Carousel.Item className="text-center">
                  <div className="pt-4 pb-3">
                    {props.nft.metadata.animation_details.format}
                  </div>
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
                <Carousel.Item className="text-center">
                  <div className="pt-4 pb-3">
                    {props.nft.metadata.image_details.format}
                  </div>
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
              </Carousel>
            ) : (
              <>
                <Col xs={12} className="text-center pb-5">
                  {props.nft.metadata.image_details.format}
                </Col>
                <NFTImage
                  nft={props.nft}
                  animation={false}
                  height={650}
                  transparentBG={true}
                  showOriginal={true}
                  showBalance={false}
                  id="the-art-fullscreen-img"
                />
              </>
            )}
          </Row>
        </Container>
        <Container className="pt-5 pb-3">
          <Row>
            <Col>
              <Container>
                <Row>
                  <Col>
                    <Row>
                      <Col>
                        <h3>Arweave Links</h3>
                      </Col>
                    </Row>
                    <Row>
                      <Col className="tw-flex tw-items-center tw-gap-1">
                        <span>{props.nft.metadata.image_details.format}</span>
                        <Link
                          className={styles.arweaveLink}
                          href={props.nft.metadata.image}
                          target="_blank"
                          rel="noopener noreferrer">
                          {props.nft.metadata.image}
                        </Link>
                        <Download
                          href={props.nft.metadata.image}
                          name={props.nft.name}
                          extension={props.nft.metadata.image_details.format}
                        />
                      </Col>
                    </Row>
                    {(props.nft.metadata.animation ||
                      props.nft.metadata.animation_url) && (
                      <Row className="pt-3">
                        <Col className="tw-flex tw-items-center tw-gap-1">
                          <span>
                            {props.nft.metadata.animation_details.format}
                          </span>
                          <Link
                            className={styles.arweaveLink}
                            href={
                              props.nft.metadata.animation
                                ? props.nft.metadata.animation
                                : props.nft.metadata.animation_url
                            }
                            target="_blank"
                            rel="noopener noreferrer">
                            {props.nft.metadata.animation
                              ? props.nft.metadata.animation
                              : props.nft.metadata.animation_url}
                          </Link>
                          <Download
                            href={
                              props.nft.metadata.animation
                                ? props.nft.metadata.animation
                                : props.nft.metadata.animation_url
                            }
                            name={props.nft.name}
                            extension={
                              props.nft.metadata.animation_details.format
                            }
                          />
                        </Col>
                      </Row>
                    )}
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
              lg={{ span: 6 }}>
              <Container>
                <Row>
                  <Col>
                    <h3>Card Details</h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Table bordered={false}>
                      <tbody>
                        <tr>
                          <td>Edition Size</td>
                          <td>{props.nft.supply}</td>
                        </tr>
                        <tr>
                          <td>Collection</td>
                          <td>{props.nft.collection}</td>
                        </tr>
                        <tr>
                          <td>Season</td>
                          <td>{props.nftMeta.season}</td>
                        </tr>
                        <tr>
                          <td>Meme</td>
                          <td>{props.nftMeta.meme_name}</td>
                        </tr>
                        <tr>
                          <td>Artist Name</td>
                          <td>{props.nft.artist}</td>
                        </tr>
                        <tr>
                          <td>Artist Profile</td>
                          <td>
                            <ArtistProfileHandle nft={props.nft} />
                          </td>
                        </tr>
                        <tr>
                          <td>Mint Date</td>
                          <td>{printMintDate(props.nft.mint_date)}</td>
                        </tr>
                        <tr>
                          <td>File Type</td>
                          <td>{getFileTypeFromMetadata(props.nft.metadata)}</td>
                        </tr>
                        <tr>
                          <td>Dimensions</td>
                          <td>
                            {getDimensionsFromMetadata(props.nft.metadata)}
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
              lg={{ span: 6 }}>
              <Container>
                <Row>
                  <Col>
                    <h3>Minting Approach</h3>
                  </Col>
                </Row>
                {distributionPlanLink && (
                  <Row>
                    <Col>
                      <Link
                        href={distributionPlanLink}
                        target={props.nft.has_distribution ? "_self" : "_blank"}
                        rel={
                          props.nft.has_distribution
                            ? undefined
                            : "noopener noreferrer"
                        }
                        className={styles.distributionPlanLink}>
                        Distribution Plan
                      </Link>
                    </Col>
                  </Row>
                )}
                <Row>
                  <Col>
                    Mint price:{" "}
                    {props.nft.mint_price > 0
                      ? `${numberWithCommas(
                          Math.round(props.nft.mint_price * 100000) / 100000
                        )} ETH`
                      : `N/A`}
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
                    <h3>Card Description</h3>
                  </Col>
                </Row>
                <Row>
                  <Col
                    dangerouslySetInnerHTML={{
                      __html: parseNftDescriptionToHtml(props.nft.description),
                    }}></Col>
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
                        (a: any) =>
                          !a.display_type &&
                          a.trait_type != "Type - Season" &&
                          a.trait_type != "Type - Meme" &&
                          a.trait_type != "Type - Card"
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
              lg={{ span: 6 }}>
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
                    lg={{ span: 6 }}>
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
              lg={{ span: 6 }}>
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
                    lg={{ span: 6 }}>
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
