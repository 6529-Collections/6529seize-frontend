import styles from "./TheMemes.module.scss";
import { Col, Container, Dropdown, Row, Table } from "react-bootstrap";
import { MEMES_CONTRACT, OPENSEA_STORE_FRONT_CONTRACT } from "../../constants";
import { NFT, MemesExtendedData, Rememe } from "../../entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  numberWithCommas,
  printMintDate,
} from "../../helpers/Helpers";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import NFTImage from "../nft-image/NFTImage";
import RememeImage from "../nft-image/RememeImage";
import Pagination from "../pagination/Pagination";
import { RememeSort } from "../rememes/Rememes";
import Tippy from "@tippyjs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ArtistProfileHandle from "./ArtistProfileHandle";

const REMEMES_PAGE_SIZE = 20;

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
                    <td className="text-right">
                      {numberWithCommas(props.nftMeta.edition_size)}
                    </td>
                    <td className="text-right">
                      {props.nftMeta.edition_size_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                  {props.nftMeta.burnt > 0 && (
                    <>
                      <tr>
                        <td>
                          <span className="d-flex align-items-center gap-2">
                            <span>Burnt</span>
                            <FontAwesomeIcon
                              icon="fire"
                              style={{ height: "22px", color: "#c51d34" }}
                            />
                          </span>
                        </td>
                        <td className="text-right">
                          {numberWithCommas(props.nftMeta.burnt)}
                        </td>
                      </tr>
                      <tr>
                        <td>Edition Size ex. Burnt</td>
                        <td className="text-right">
                          {numberWithCommas(
                            props.nftMeta.edition_size_not_burnt
                          )}
                        </td>
                        <td className="text-right">
                          {props.nftMeta.edition_size_not_burnt_rank}/
                          {props.nftMeta.collection_size}
                        </td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td>6529 Museum</td>
                    <td className="text-right">
                      {numberWithCommas(props.nftMeta.museum_holdings)}
                    </td>
                    <td className="text-right">
                      {props.nftMeta.museum_holdings_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Edition Size ex.{props.nftMeta.burnt > 0 && " Burnt and"}{" "}
                      6529 Museum
                    </td>
                    <td className="text-right">
                      {numberWithCommas(props.nftMeta.edition_size_cleaned)}
                    </td>
                    <td className="text-right">
                      {props.nftMeta.edition_size_cleaned_rank}/
                      {props.nftMeta.collection_size}
                    </td>
                  </tr>
                  <tr>
                    <td>Collectors</td>
                    <td className="text-right">
                      {numberWithCommas(props.nftMeta.hodlers)}
                    </td>
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
                  {props.nftMeta.burnt > 0 && (
                    <tr>
                      <td>% Unique ex. Burnt</td>
                      <td className="text-right">
                        {Math.round(
                          props.nftMeta.percent_unique_not_burnt * 100 * 10
                        ) / 10}
                        %
                      </td>
                      <td className="text-right">
                        {props.nftMeta.percent_unique_not_burnt_rank}/
                        {props.nftMeta.collection_size}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td>
                      % Unique ex.{props.nftMeta.burnt > 0 && " Burnt and"} 6529
                      Museum
                    </td>
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

  const [rememesTotalResults, setRememesTotalResults] = useState(0);
  const [rememesPage, setRememesPage] = useState(1);
  const [rememes, setRememes] = useState<Rememe[]>([]);
  const [showRememesSort, setShowRememesSort] = useState(false);
  const [rememesLoaded, setRememesLoaded] = useState(false);

  const rememesTarget = useRef<HTMLImageElement>(null);

  const rememeSorting = [RememeSort.RANDOM, RememeSort.CREATED_ASC];
  const [selectedRememeSorting, setSelectedRememeSorting] =
    useState<RememeSort>(RememeSort.RANDOM);

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

  useEffect(() => {
    if (props.nft) {
      fetchRememes(props.nft.id);
    }
  }, [props.nft, rememesPage, selectedRememeSorting]);

  function fetchRememes(meme_id: number) {
    let sort = "";
    if (selectedRememeSorting === RememeSort.CREATED_ASC) {
      sort = "&sort=created_at&sort_direction=desc";
    }
    fetchUrl(
      `${process.env.API_ENDPOINT}/api/rememes?meme_id=${meme_id}&page_size=${REMEMES_PAGE_SIZE}&page=${rememesPage}${sort}`
    ).then((response: DBResponse) => {
      setRememesTotalResults(response.count);
      setRememes(response.data);
      setShowRememesSort(response.count > REMEMES_PAGE_SIZE);
      setRememesLoaded(true);
    });
  }

  if (props.show) {
    return (
      <>
        <Row className="pt-3">
          <Col>
            <Image
              width="0"
              height="0"
              style={{ width: "250px", height: "auto" }}
              src="/memelab.png"
              alt="memelab"
            />
          </Col>
        </Row>
        <Row className="pt-4 pb-2">
          <Col>
            The Meme Lab is the lab for Meme Artists to release work that is
            related to The Meme Cards.
          </Col>
        </Row>
        {memeLabNftsLoaded && memeLabNfts.length === 0 && (
          <Row className="pt-2 pb-4">
            <Col>Meme Lab NFTs that reference this NFT will appear here.</Col>
          </Row>
        )}
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
                  <a
                    href={`/meme-lab/${nft.id}`}
                    className="decoration-none scale-hover">
                    <Container fluid className="no-padding">
                      <Row>
                        <Col>
                          <NFTImage
                            nft={nft}
                            animation={false}
                            height={300}
                            balance={0}
                            showThumbnail={true}
                            showUnseized={false}
                          />
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
                  </a>
                </Col>
              );
            })}
          </Row>
        )}
        <Row className="pt-3" ref={rememesTarget}>
          <Col className="d-flex flex-wrap align-items-center justify-content-between">
            <h1 className="mb-0 pt-2">
              <Image
                width="0"
                height="0"
                style={{ width: "250px", height: "auto", float: "left" }}
                src="/re-memes.png"
                alt="re-memes"
              />
            </h1>
            {showRememesSort && (
              <span className="d-flex align-items-center gap-2 pt-2">
                <Dropdown
                  className={styles.rememesSortDropdown}
                  drop={"down-centered"}>
                  <Dropdown.Toggle>
                    Sort: {selectedRememeSorting}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {rememeSorting.map((s) => (
                      <Dropdown.Item
                        key={`sorting-${s}`}
                        onClick={() => {
                          setRememesPage(1);
                          setRememesTotalResults(0);
                          setSelectedRememeSorting(s);
                        }}>
                        {s}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
                {selectedRememeSorting === RememeSort.RANDOM && (
                  <Tippy
                    content="Refresh results"
                    placement="top"
                    theme="light"
                    delay={250}>
                    <FontAwesomeIcon
                      icon="refresh"
                      className={styles.buttonIcon}
                      onClick={() => {
                        if (props.nft) {
                          fetchRememes(props.nft.id);
                        }
                      }}
                    />
                  </Tippy>
                )}
              </span>
            )}
          </Col>
        </Row>
        <Row className="pt-4 pb-2">
          <Col>
            ReMemes are community-created and community-submitted NFTs inspired
            by the Meme Cards. They are not created or &quot;authorized&quot; by
            6529 Collections.
          </Col>
        </Row>
        {rememesLoaded && rememes.length === 0 && (
          <Row className="pt-2 pb-4">
            <Col>ReMemes that reference this NFT will appear here.</Col>
          </Row>
        )}
        {rememes.length > 0 && (
          <>
            <Row className="pt-2 pb-2">
              {rememes.map((rememe) => {
                return (
                  <Col
                    key={`${rememe.contract}-${rememe.id}`}
                    className="pt-3 pb-3"
                    xs={{ span: 6 }}
                    sm={{ span: 4 }}
                    md={{ span: 3 }}
                    lg={{ span: 3 }}>
                    <a
                      href={`/rememes/${rememe.contract}/${rememe.id}`}
                      className="decoration-none scale-hover">
                      <Container fluid className="no-padding">
                        <Row>
                          <Col>
                            <RememeImage
                              nft={rememe}
                              animation={false}
                              height={300}
                            />
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            <Container>
                              <Row>
                                <Col className="font-smaller font-color-h d-flex justify-content-center align-items-center">
                                  {areEqualAddresses(
                                    rememe.contract,
                                    OPENSEA_STORE_FRONT_CONTRACT
                                  ) ? (
                                    <>
                                      {
                                        rememe.contract_opensea_data
                                          .collectionName
                                      }
                                    </>
                                  ) : (
                                    <>
                                      {rememe.contract_opensea_data
                                        .collectionName
                                        ? rememe.contract_opensea_data
                                            .collectionName
                                        : formatAddress(rememe.contract)}{" "}
                                      #{rememe.id}
                                    </>
                                  )}
                                  {rememe.replicas.length > 1 && (
                                    <>
                                      &nbsp;(x
                                      {numberWithCommas(rememe.replicas.length)}
                                      )
                                    </>
                                  )}
                                </Col>
                              </Row>
                              <Row>
                                <Col className="d-flex justify-content-center align-items-center">
                                  <span className="text-center">
                                    {rememe.metadata.name
                                      ? rememe.metadata.name
                                      : `${formatAddress(rememe.contract)} #${
                                          rememe.id
                                        }`}
                                  </span>
                                </Col>
                              </Row>
                            </Container>
                          </Col>
                        </Row>
                      </Container>
                    </a>
                  </Col>
                );
              })}
            </Row>
            {rememesTotalResults > REMEMES_PAGE_SIZE && (
              <Row className="text-center pt-2 pb-3">
                <Pagination
                  page={rememesPage}
                  pageSize={REMEMES_PAGE_SIZE}
                  totalResults={rememesTotalResults}
                  setPage={function (newPage: number) {
                    setRememesPage(newPage);
                    if (rememesTarget.current) {
                      rememesTarget.current.scrollIntoView({
                        behavior: "smooth",
                      });
                    }
                  }}
                />
              </Row>
            )}
          </>
        )}
      </>
    );
  } else {
    return <></>;
  }
}
