"use client";

import RememeImage from "@/components/nft-image/RememeImage";
import Pagination from "@/components/pagination/Pagination";
import { printMemeReferences } from "@/components/rememes/RememePage";
import { RememeSort } from "@/components/rememes/Rememes";
import { publicEnv } from "@/config/env";
import { OPENSEA_STORE_FRONT_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT, Rememe } from "@/entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  numberWithCommas,
} from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Col, Container, Dropdown, Row } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import styles from "./TheMemes.module.scss";

const REMEMES_PAGE_SIZE = 20;

function getRememeName(rememe: Rememe) {
  const metadata = rememe.metadata as unknown;
  if (
    metadata !== null &&
    typeof metadata === "object" &&
    "name" in metadata &&
    typeof metadata.name === "string" &&
    metadata.name.trim()
  ) {
    return metadata.name;
  }
  return `${formatAddress(rememe.contract)} #${rememe.id}`;
}

export function MemePageReferencesSubMenu(props: {
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

  const fetchRememes = useCallback(
    (meme_id: number) => {
      let sort = "";
      if (selectedRememeSorting === RememeSort.CREATED_ASC) {
        sort = "&sort=created_at&sort_direction=desc";
      }
      void fetchUrl(
        `${publicEnv.API_ENDPOINT}/api/rememes?meme_id=${meme_id}&page_size=${REMEMES_PAGE_SIZE}&page=${rememesPage}${sort}`
      )
        .then((response: DBResponse) => {
          setRememesTotalResults(response.count);
          setRememes(response.data);
          setShowRememesSort(response.count > REMEMES_PAGE_SIZE);
          setRememesLoaded(true);
        })
        .catch(() => {
          setRememesTotalResults(0);
          setRememes([]);
          setShowRememesSort(false);
          setRememesLoaded(true);
        });
    },
    [rememesPage, selectedRememeSorting]
  );

  useEffect(() => {
    if (props.nft) {
      void fetchUrl(
        `${publicEnv.API_ENDPOINT}/api/nfts_memelab?sort_direction=asc&meme_id=${props.nft.id}`
      )
        .then((response: DBResponse) => {
          setMemeLabNfts(response.data);
          setMemeLabNftsLoaded(true);
        })
        .catch(() => {
          setMemeLabNfts([]);
          setMemeLabNftsLoaded(true);
        });
    }
  }, [props.nft]);

  useEffect(() => {
    if (props.nft) {
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-derived-state
      fetchRememes(props.nft.id);
    }
  }, [props.nft, fetchRememes]);

  if (!props.show) {
    return <></>;
  }

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
                drop={"down-centered"}>
                <Dropdown.Toggle>Sort: {selectedRememeSorting}</Dropdown.Toggle>
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
                    }}>
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
          ReMemes are community-created and community-submitted NFTs inspired by
          the Meme Cards. They are not created or &quot;authorized&quot; by 6529
          Collections.
        </Col>
      </Row>
      {rememesLoaded && rememes.length === 0 && (
        <Row className="pt-2 pb-4">
          <Col>ReMemes that reference this NFT will appear here.</Col>
        </Row>
      )}
      {rememes.length > 0 && (
        <>
          <Row className="py-2">
            {rememes.map((rememe) => {
              return (
                <Col
                  key={`${rememe.contract}-${rememe.id}`}
                  className="py-3"
                  xs={{ span: 6 }}
                  sm={{ span: 4 }}
                  md={{ span: 3 }}
                  lg={{ span: 3 }}>
                  <Link
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
                                  <>{rememe.contract_opensea_data.collectionName}</>
                                ) : (
                                  <>
                                    {rememe.contract_opensea_data.collectionName
                                      ? rememe.contract_opensea_data
                                          .collectionName
                                      : formatAddress(rememe.contract)}{" "}
                                    #{rememe.id}
                                  </>
                                )}
                                {rememe.replicas.length > 1 && (
                                  <>
                                    &nbsp;(x
                                    {numberWithCommas(rememe.replicas.length)})
                                  </>
                                )}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="d-flex justify-content-center align-items-center">
                                <span className="text-center">
                                  {getRememeName(rememe)}
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
}
