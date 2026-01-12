"use client";

import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import DotLoader from "@/components/dotLoader/DotLoader";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import RememeImage from "@/components/nft-image/RememeImage";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import Pagination from "@/components/pagination/Pagination";
import { publicEnv } from "@/config/env";
import { OPENSEA_STORE_FRONT_CONTRACT } from "@/constants/constants";
import { useSetTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFTLite, Rememe } from "@/entities/INFT";
import {
  areEqualAddresses,
  formatAddress,
  numberWithCommas,
} from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { faPlusCircle, faRefresh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Col, Container, Dropdown, Row } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import styles from "./Rememes.module.scss";

const PAGE_SIZE = 40;

enum TokenType {
  ALL = "All",
  ERC721 = "ERC-721",
  ERC1155 = "ERC-1155",
}

export enum RememeSort {
  RANDOM = "Random",
  CREATED_ASC = "Recently Added",
}

export default function Rememes() {
  useSetTitle("ReMemes | Collections");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [memes, setMemes] = useState<NFTLite[]>([]);

  const [rememes, setRememes] = useState<Rememe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [rememesLoaded, setRememesLoaded] = useState(false);

  const tokenTypes = [TokenType.ALL, TokenType.ERC721, TokenType.ERC1155];
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>(
    TokenType.ALL
  );

  const queryMemeId = searchParams?.get("meme_id");
  const [selectedMeme, setSelectedMeme] = useState<number>(
    queryMemeId ? parseInt(queryMemeId) : 0
  );

  const sorting = [RememeSort.RANDOM, RememeSort.CREATED_ASC];
  const [selectedSorting, setSelectedSorting] = useState<RememeSort>(
    RememeSort.RANDOM
  );

  useEffect(() => {
    fetchUrl(`${publicEnv.API_ENDPOINT}/api/memes_lite`)
      .then((response: DBResponse) => {
        setMemes(response.data);
      })
      .catch((error) => {
        console.error("Error fetching memes", error);
      });
  }, []);

  function fetchResults(mypage: number) {
    setRememesLoaded(false);
    let memeFilter = "";
    if (selectedMeme) {
      memeFilter = `&meme_id=${selectedMeme}`;
    }
    let tokenTypeFilter = "";
    if (selectedTokenType !== TokenType.ALL) {
      tokenTypeFilter = `&token_type=${selectedTokenType.replaceAll("-", "")}`;
    }
    let sort = "";
    if (selectedSorting === RememeSort.CREATED_ASC) {
      sort = "&sort=created_at&sort_direction=desc";
    }
    let url = `${publicEnv.API_ENDPOINT}/api/rememes?page_size=${PAGE_SIZE}&page=${mypage}${memeFilter}${tokenTypeFilter}${sort}`;
    fetchUrl(url)
      .then((response: DBResponse) => {
        setTotalResults(response.count);
        setRememes(response.data);
      })
      .catch((err) => {
        console.error("Error fetching rememes", err);
      })
      .finally(() => {
        setRememesLoaded(true);
      });
  }

  useEffect(() => {
    const currentId = searchParams?.get("meme_id")
      ? parseInt(searchParams.get("meme_id")!)
      : 0;
    if (!currentId || currentId != selectedMeme) {
      const newPath = `${pathname}${
        selectedMeme ? `?meme_id=${selectedMeme}` : ""
      }`;
      router.push(newPath);
    }
  }, [selectedMeme]);

  useEffect(() => {
    if (page === 1) {
      fetchResults(page);
    } else {
      setPage(1);
    }
  }, [selectedTokenType, selectedSorting, selectedMeme]);

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  function printRememe(rememe: Rememe) {
    return (
      <Col
        key={`${rememe.contract}-${rememe.id}`}
        className="pt-3 pb-3"
        xs={{ span: 6 }}
        sm={{ span: 4 }}
        md={{ span: 3 }}
        lg={{ span: 3 }}
      >
        <a
          href={`/rememes/${rememe.contract}/${rememe.id}`}
          className="decoration-none scale-hover"
        >
          <Container fluid>
            <Row>
              <RememeImage nft={rememe} animation={false} height={300} />
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
                            ? rememe.contract_opensea_data.collectionName
                            : formatAddress(rememe.contract)}{" "}
                          #{rememe.id}
                        </>
                      )}
                      {rememe.replicas.length > 1 && (
                        <>&nbsp;(x{numberWithCommas(rememe.replicas.length)})</>
                      )}
                    </Col>
                  </Row>
                  <Row>
                    <Col className="d-flex justify-content-center align-items-center">
                      <span className="text-center">
                        {rememe.metadata.name
                          ? rememe.metadata.name
                          : `${formatAddress(rememe.contract)} #${rememe.id}`}
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
  }

  function printRememes() {
    if (rememes.length === 0) {
      return (
        <Row>
          <Col>
            <NothingHereYetSummer />
          </Col>
        </Row>
      );
    }
    return (
      <>
        <Row className="pt-2">
          {rememes.map((rememe) => printRememe(rememe))}
        </Row>
      </>
    );
  }

  return (
    <Container fluid className={styles["mainContainer"]}>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row className="mb-3">
              <Col xs={12} sm={8} md={9} className="pb-3 pb-sm-0">
                <span className="d-flex align-items-center gap-3 flex-wrap">
                  <span className="d-flex align-items-center gap-2">
                    <Image
                      unoptimized
                      loading={"eager"}
                      width="0"
                      height="0"
                      style={{ width: "250px", height: "auto" }}
                      className="d-none d-md-block"
                      src="/re-memes.png"
                      alt="re-memes"
                    />
                    <Image
                      unoptimized
                      loading={"eager"}
                      width="0"
                      height="0"
                      style={{ width: "150px", height: "auto" }}
                      className="d-md-none"
                      src="/re-memes.png"
                      alt="re-memes"
                    />
                    {totalResults > 0 && (
                      <span className="font-color-h font-larger">
                        (x{numberWithCommas(totalResults)})
                      </span>
                    )}
                  </span>
                  <LFGButton contract={"rememes"} />
                </span>
              </Col>
              <Col
                xs={12}
                sm={4}
                md={3}
                className="d-flex justify-content-sm-end align-items-center"
              >
                <Button
                  className="seize-btn btn-white d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                  onClick={() => {
                    window.location.href = "/rememes/add";
                  }}
                >
                  Add ReMeme{" "}
                  <FontAwesomeIcon
                    icon={faPlusCircle}
                    className={styles["buttonIcon"]}
                  />
                </Button>
              </Col>
            </Row>

            <Row className="d-xl-none mb-3">
              <Col xs={12} sm="auto">
                <CollectionsDropdown activePage="rememes" />
              </Col>
            </Row>
            {rememesLoaded && (
              <Row className="pt-2">
                <Col
                  className={`pt-2 pb-2 d-flex align-items-center flex-wrap gap-2 justify-content-between`}
                >
                  <span className="d-flex align-items-center gap-1">
                    <Dropdown
                      className={styles["memeRefDropdown"]}
                      drop={"down-centered"}
                    >
                      <Dropdown.Toggle>Sort: {selectedSorting}</Dropdown.Toggle>
                      <Dropdown.Menu>
                        {sorting.map((s) => (
                          <Dropdown.Item
                            key={`sorting-${s}`}
                            onClick={() => {
                              setSelectedSorting(s);
                            }}
                          >
                            {s}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    {selectedSorting === RememeSort.RANDOM && (
                      <>
                        <FontAwesomeIcon
                          icon={faRefresh}
                          className={styles["buttonIcon"]}
                          onClick={() => {
                            fetchResults(page);
                          }}
                          data-tooltip-id="refresh-rememes-results"
                        />
                        <Tooltip
                          id="refresh-rememes-results"
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
                  <span className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <Dropdown
                      className={styles["memeRefDropdown"]}
                      drop={"down-centered"}
                    >
                      <Dropdown.Toggle>
                        Token Type: {selectedTokenType}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {tokenTypes.map((t) => (
                          <Dropdown.Item
                            key={`token-type-${t}`}
                            onClick={() => {
                              setSelectedTokenType(t);
                            }}
                          >
                            {t}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown
                      className={styles["memeRefDropdown"]}
                      drop={"down-centered"}
                    >
                      <Dropdown.Toggle>
                        Meme Reference:{" "}
                        {queryMemeId
                          ? memes.find((m) => m.id.toString() === queryMemeId)
                            ? `${queryMemeId} - ${
                                memes.find(
                                  (m) => m.id.toString() === queryMemeId
                                )?.name
                              }`
                            : `${queryMemeId}`
                          : `All`}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() => {
                            setSelectedMeme(0);
                          }}
                        >
                          All
                        </Dropdown.Item>
                        {memes.map((m) => (
                          <Dropdown.Item
                            key={`meme-${m.id}`}
                            onClick={() => {
                              setSelectedMeme(m.id);
                            }}
                          >
                            #{m.id} - {m.name}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </span>
                </Col>
              </Row>
            )}

            {rememesLoaded ? (
              printRememes()
            ) : (
              <Col className="pt-3">
                Fetching <DotLoader />
              </Col>
            )}
          </Container>
        </Col>
      </Row>
      {totalResults > PAGE_SIZE && rememesLoaded && (
        <Row className="text-center pt-4 pb-4">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </Row>
      )}
    </Container>
  );
}
