import styles from "./TheMemes.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { NFT, MemesExtendedData } from "../../entities/INFT";
import { numberWithCommas, printMintDate } from "../../helpers/Helpers";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";

export function MemePageLiveRightMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: MemesExtendedData | undefined;
  nftBalance: number;
}) {
  if (props.show && props.nft && props.nftMeta) {
    return (
      <Col
        xs={{ span: 12 }}
        sm={{ span: 12 }}
        md={{ span: 6 }}
        lg={{ span: 6 }}
        className="pt-2">
        <Container className="p-0">
          <Row>
            <Col>
              <h3>Meme Collectors</h3>
            </Col>
          </Row>
          <Row>
            <Col>
              <Table bordered={false} className={styles.hodlersTableLive}>
                <tbody>
                  <tr>
                    <td>Edition Size</td>
                    <td className="text-right">{props.nftMeta.edition_size}</td>
                    <td className="text-right">
                      {props.nftMeta.edition_size_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                  <tr>
                    <td>6529 Museum</td>
                    <td className="text-right">
                      {props.nftMeta.museum_holdings}
                    </td>
                    <td className="text-right">
                      {props.nftMeta.museum_holdings_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                  <tr>
                    <td>Edition Size ex. 6529 Museum</td>
                    <td className="text-right">
                      {props.nftMeta.edition_size_cleaned}
                    </td>
                    <td className="text-right">
                      {props.nftMeta.edition_size_cleaned_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                  <tr>
                    <td>Collectors</td>
                    <td className="text-right">{props.nftMeta.hodlers}</td>
                    <td className="text-right">
                      {props.nftMeta.hodlers_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                  <tr>
                    <td>% Unique</td>
                    <td className="text-right">
                      {Math.round(props.nftMeta.percent_unique * 100 * 10) / 10}
                      %
                    </td>
                    <td className="text-right">
                      {props.nftMeta.percent_unique_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                  <tr>
                    <td>% Unique ex. 6529 Museum</td>
                    <td className="text-right">
                      {Math.round(
                        props.nftMeta.percent_unique_cleaned * 100 * 10
                      ) / 10}
                      %
                    </td>
                    <td className="text-right">
                      {props.nftMeta.percent_unique_cleaned_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          <Row className="pt-3">
            <Col>
              <h3>NFT</h3>
            </Col>
          </Row>
          <Row>
            <Col>
              <Table bordered={false}>
                <tbody>
                  <tr>
                    <td>Artist</td>
                    <td>{props.nft.artist}</td>
                  </tr>
                  <tr>
                    <td>Mint Date</td>
                    <td>{printMintDate(props.nft.mint_date)}</td>
                  </tr>
                  <tr>
                    <td>TDH Rate</td>
                    <td>{Math.round(props.nft.hodl_rate * 100) / 100}</td>
                  </tr>
                  <tr>
                    <td>Floor Price</td>
                    <td>
                      {props.nft.floor_price > 0
                        ? `${numberWithCommas(
                            Math.round(props.nft.floor_price * 100) / 100
                          )} ETH`
                        : `N/A`}
                    </td>
                  </tr>
                  <tr>
                    <td>Market Cap</td>
                    <td>
                      {props.nft.market_cap > 0
                        ? `${numberWithCommas(
                            Math.round(props.nft.market_cap * 100) / 100
                          )} ETH`
                        : `N/A`}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          <Row>
            <Col>
              <a
                href={
                  props.nft.has_distribution
                    ? `/the-memes/${props.nft.id}/distribution`
                    : `https://github.com/6529-Collections/thememecards/tree/main/card${props.nft.id}`
                }
                target={props.nft.has_distribution ? "_self" : "_blank"}
                rel="noreferrer">
                Distribution Plan
              </a>
            </Col>
          </Row>
          {props.nftBalance > 0 && (
            <Row className="pt-3">
              <Col>
                <h3 className="font-color">
                  You Own {props.nftBalance} edition
                  {props.nftBalance > 1 && "s"}
                </h3>
              </Col>
            </Row>
          )}
          <Row className="pt-4">
            <Col>
              <a
                href={`https://opensea.io/assets/ethereum/${MEMES_CONTRACT}/${props.nft.id}`}
                target="_blank"
                rel="noreferrer">
                <Image
                  className={styles.marketplace}
                  src="/opensea.png"
                  alt="opensea"
                  width={40}
                  height={40}
                />
              </a>
              {/* <a
                      href={`https://looksrare.org/collections/${MEMES_CONTRACT}/${props.nft.id}`}
                      target="_blank"
                      rel="noreferrer">
                      <Image
                        className={styles.marketplace}
                        src="/looksrare.png"
                        alt="looksrare"
                        width={40}
                        height={40}
                      />
                    </a> */}
              <a
                href={`https://x2y2.io/eth/${MEMES_CONTRACT}/${props.nft.id}`}
                target="_blank"
                rel="noreferrer">
                <Image
                  className={styles.marketplace}
                  src="/x2y2.png"
                  alt="x2y2"
                  width={40}
                  height={40}
                />
              </a>
            </Col>
          </Row>
        </Container>
      </Col>
    );
  } else {
    return <></>;
  }
}

export function MemePageLiveSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
}) {
  const [memeLabNftsLoaded, setMemeLabNftsLoaded] = useState(false);
  const [memeLabNfts, setMemeLabNfts] = useState<NFT[]>([]);

  useEffect(() => {
    if (props.nft) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/nfts_memelab?sort_direction=asc&meme_id=${props.nft.id}`
      ).then((response: DBResponse) => {
        setMemeLabNfts(response.data);
        setMemeLabNftsLoaded(true);
      });
    }
  }, [props.nft]);

  if (props.show) {
    return (
      <>
        <Row className="pt-3">
          <Col>
            <Image
              loading={"lazy"}
              width="0"
              height="0"
              style={{ width: "250px", height: "auto" }}
              src="/memelab.png"
              alt="memelab"
            />
          </Col>
        </Row>
        <Row className="pt-4 pb-4">
          <Col>
            The Meme Lab is the lab for Meme Artists to release work that is
            related to The Meme Cards.
            {memeLabNftsLoaded && memeLabNfts.length == 0 && (
              <>
                <br />
                Meme Lab NFTs that reference this NFT will appear here once the
                Meme Lab is launched.
              </>
            )}
          </Col>
        </Row>
        {memeLabNfts.length > 0 && (
          <Row className="pt-2 pb-2">
            {memeLabNfts.map((nft) => {
              return (
                <Col
                  key={`${nft.contract}-${nft.id}`}
                  className="pt-3 pb-3"
                  xs={{ span: 6 }}
                  sm={{ span: 4 }}
                  md={{ span: 3 }}
                  lg={{ span: 3 }}>
                  <Container fluid className="no-padding">
                    <Row>
                      <Col>
                        <a href={`/meme-lab/${nft.id}`}>
                          <NFTImage
                            nft={nft}
                            animation={false}
                            height={300}
                            balance={0}
                            showThumbnail={true}
                            showUnseized={false}
                          />
                        </a>
                      </Col>
                    </Row>
                    <Row>
                      <Col className="text-center pt-2">
                        <b>
                          #{nft.id} - {nft.name}
                        </b>
                      </Col>
                    </Row>
                    <Row>
                      <Col className="text-center pt-2">
                        Artists: {nft.artist}
                      </Col>
                    </Row>
                  </Container>
                </Col>
              );
            })}
          </Row>
        )}
        <Row className="pt-5">
          <Col>
            <Image
              loading={"lazy"}
              width="0"
              height="0"
              style={{ width: "250px", height: "auto" }}
              src="/re-memes.png"
              alt="re-memes"
            />
          </Col>
        </Row>
        <Row className="pt-4 pb-4">
          <Col>
            ReMemes are community-driven derivatives inspired by the Meme Cards.
            We hope to display them here once we find a &quot;safe&quot; way to
            do so.
            <br />
            Learn more{" "}
            <a href="/rememes" target="_blank">
              here
            </a>
            .
          </Col>
        </Row>
      </>
    );
  } else {
    return <></>;
  }
}
