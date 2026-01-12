"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { NftPageStats } from "@/components/nft-attributes/NftStats";
import RememeImage from "@/components/nft-image/RememeImage";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import Pagination from "@/components/pagination/Pagination";
import { printMemeReferences } from "@/components/rememes/RememePage";
import { RememeSort } from "@/components/rememes/Rememes";
import { publicEnv } from "@/config/env";
import { OPENSEA_STORE_FRONT_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { MemesExtendedData, NFT, Rememe } from "@/entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  numberWithCommas,
  printMintDate,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { fetchUrl } from "@/services/6529api";
import { faFire, faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Col, Container, Dropdown, Row, Table } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import ArtistProfileHandle from "./ArtistProfileHandle";
import MemeCalendarPeriods from "./MemeCalendarPeriods";
import styles from "./TheMemes.module.scss";

const REMEMES_PAGE_SIZE = 20;

export function MemePageLiveRightMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: MemesExtendedData | undefined;
  nftBalance: number;
}) {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();

  const distributionPlanLink = (() => {
    const id = props.nft?.id;
    if (!id) return "";
    if (props.nft?.has_distribution) return `/the-memes/${id}/distribution`;
    if (id > 3)
      return `https://github.com/6529-Collections/thememecards/tree/main/card${id}`;
    return `https://github.com/6529-Collections/thememecards/tree/main/card1-3`;
  })();

  if (props.show && props.nft && props.nftMeta) {
    return (
      <Col
        xs={{ span: 12 }}
        sm={{ span: 12 }}
        md={{ span: 6 }}
        lg={{ span: 6 }}
        className="pt-2"
      >
        <Container className="p-0">
          <Row>
            <Col>
              <MemeCalendarPeriods id={props.nft.id} />
            </Col>
          </Row>
          <Row className="pt-2">
            <Col>
              <h3>Meme Collectors</h3>
            </Col>
          </Row>
          <Row>
            <Col>
              <Table bordered={false} className={styles["hodlersTableLive"]}>
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
                              icon={faFire}
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
                  <NftPageStats nft={props.nft} />
                </tbody>
              </Table>
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
                >
                  Distribution Plan
                </Link>
              </Col>
            </Row>
          )}
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
          {(!capacitor.isIos || country === "US") && (
            <Row className="pt-4">
              <Col>
                <NFTMarketplaceLinks
                  contract={props.nft.contract}
                  id={props.nft.id}
                />
              </Col>
            </Row>
          )}
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
        `${publicEnv.API_ENDPOINT}/api/nfts_memelab?sort_direction=asc&meme_id=${props.nft.id}`
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
      `${publicEnv.API_ENDPOINT}/api/rememes?meme_id=${meme_id}&page_size=${REMEMES_PAGE_SIZE}&page=${rememesPage}${sort}`
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
              unoptimized
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
        {printMemeReferences(memeLabNfts, "meme-lab", memeLabNftsLoaded, true)}
        <Row className="pt-3" ref={rememesTarget}>
          <Col className="d-flex flex-wrap align-items-center justify-content-between">
            <h1 className="mb-0 pt-2">
              <Image
                unoptimized
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
                  className={styles["rememesSortDropdown"]}
                  drop={"down-centered"}
                >
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
                        }}
                      >
                        {s}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
                {selectedRememeSorting === RememeSort.RANDOM && (
                  <>
                    <FontAwesomeIcon
                      icon={faRefresh}
                      className={styles["buttonIcon"]}
                      onClick={() => {
                        if (props.nft) {
                          fetchRememes(props.nft.id);
                        }
                      }}
                      data-tooltip-id="refresh-rememes"
                    />
                    <Tooltip
                      id="refresh-rememes"
                      place="top"
                      delayShow={250}
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#212529",
                        padding: "4px 8px",
                      }}
                    >
                      Refresh results
                    </Tooltip>
                  </>
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
                    lg={{ span: 3 }}
                  >
                    <Link
                      href={`/rememes/${rememe.contract}/${rememe.id}`}
                      className="decoration-none scale-hover"
                    >
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
                    </Link>
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
