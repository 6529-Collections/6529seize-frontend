import styles from "./TheMemes.module.scss";
import { Carousel, Col, Container, Row, Table } from "react-bootstrap";
import { NFT, MemesExtendedData } from "../../entities/INFT";
import {
  enterArtFullScreen,
  fullScreenSupported,
  numberWithCommas,
  parseNftDescriptionToHtml,
  printMintDate,
} from "../../helpers/Helpers";
import { useEffect, useState } from "react";
import NFTImage from "../nft-image/NFTImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import Download from "../download/Download";
import ArtistProfileHandle from "./ArtistProfileHandle";
import {
  getFileTypeFromMetadata,
  getDimensionsFromMetadata,
} from "../../helpers/nft.helpers";
import NFTAttributes from "../nftAttributes/NFTAttributes";

export function MemePageArt(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: MemesExtendedData | undefined;
}) {
  const router = useRouter();

  const [isFullScreenSupported, setIsFullScreenSupported] = useState(false);

  const [fullscreenElementId, setFullscreenElementId] = useState<string>(
    "the-art-fullscreen-img"
  );

  useEffect(() => {
    if (router.isReady) {
      setIsFullScreenSupported(fullScreenSupported());
    }
  }, [router.isReady]);

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
                icon="expand-alt"
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
                onSlide={carouselHandlerSlide}
              >
                <Carousel.Item className="text-center">
                  <div className="pt-4 pb-3">
                    {props.nft.metadata.animation_details.format}
                  </div>
                  <NFTImage
                    nft={props.nft}
                    animation={true}
                    height={650}
                    balance={0}
                    transparentBG={true}
                    showOriginal={true}
                    showUnseized={false}
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
                    balance={0}
                    transparentBG={true}
                    showOriginal={true}
                    showUnseized={false}
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
                  balance={0}
                  transparentBG={true}
                  showOriginal={true}
                  showUnseized={false}
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
                      <Col>
                        {props.nft.metadata.image_details.format}{" "}
                        <a
                          className={styles.arweaveLink}
                          href={props.nft.metadata.image}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {props.nft.metadata.image}
                        </a>
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
                        <Col>
                          {props.nft.metadata.animation_details.format}{" "}
                          <a
                            className={styles.arweaveLink}
                            href={
                              props.nft.metadata.animation
                                ? props.nft.metadata.animation
                                : props.nft.metadata.animation_url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {props.nft.metadata.animation
                              ? props.nft.metadata.animation
                              : props.nft.metadata.animation_url}
                          </a>
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
              lg={{ span: 6 }}
            >
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
              lg={{ span: 6 }}
            >
              <Container>
                <Row>
                  <Col>
                    <h3>Minting Approach</h3>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <a
                      onClick={() => {
                        if (props.nft && props.nft.has_distribution) {
                          router.push(
                            `/the-memes/${props.nft.id}/distribution`
                          );
                        } else {
                          let link;
                          if (props.nft && props.nft.id > 3) {
                            link = `https://github.com/6529-Collections/thememecards/tree/main/card${props.nft.id}`;
                          } else {
                            link = `https://github.com/6529-Collections/thememecards/tree/main/card1-3`;
                          }
                          window.open(link, "_blank");
                        }
                      }}
                      target={props.nft.has_distribution ? "_self" : "_blank"}
                      rel="noreferrer"
                      className={styles.distributionPlanLink}
                    >
                      Distribution Plan
                    </a>
                  </Col>
                </Row>
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
