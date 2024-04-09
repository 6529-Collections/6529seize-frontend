import { Container, Row, Col, Dropdown, Button } from "react-bootstrap";
import styles from "./Rememes.module.scss";
import { fetchUrl } from "../../services/6529api";
import { OPENSEA_STORE_FRONT_CONTRACT } from "../../constants";
import { useEffect, useState } from "react";
import { NFTLite, Rememe } from "../../entities/INFT";
import { DBResponse } from "../../entities/IDBResponse";
import { useRouter } from "next/router";
import RememeImage from "../nft-image/RememeImage";
import Image from "next/image";
import Pagination from "../pagination/Pagination";
import {
  areEqualAddresses,
  formatAddress,
  numberWithCommas,
} from "../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import DotLoader from "../dotLoader/DotLoader";
import NothingHereYetSummer from "../nothingHereYet/NothingHereYetSummer";

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
  const router = useRouter();

  const [memes, setMemes] = useState<NFTLite[]>([]);
  const [memesLoaded, setMemesLoaded] = useState(false);

  const [rememes, setRememes] = useState<Rememe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [rememesLoaded, setRememesLoaded] = useState(false);

  const tokenTypes = [TokenType.ALL, TokenType.ERC721, TokenType.ERC1155];
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>(
    TokenType.ALL
  );
  const [selectedMeme, setSelectedMeme] = useState<number>(
    router.query.meme_id ? parseInt(router.query.meme_id.toString()) : 0
  );

  const sorting = [RememeSort.RANDOM, RememeSort.CREATED_ASC];
  const [selectedSorting, setSelectedSorting] = useState<RememeSort>(
    RememeSort.RANDOM
  );

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/memes_lite`).then(
      (response: DBResponse) => {
        setMemes(response.data);
        setMemesLoaded(true);
      }
    );
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
    let url = `${process.env.API_ENDPOINT}/api/rememes?page_size=${PAGE_SIZE}&page=${mypage}${memeFilter}${tokenTypeFilter}${sort}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setRememes(response.data);
      setRememesLoaded(true);
    });
  }

  useEffect(() => {
    const currentId = router.query.meme_id
      ? parseInt(router.query.meme_id.toString())
      : 0;
    if (!currentId || currentId != selectedMeme) {
      const currentQuery = { ...router.query };
      if (selectedMeme) {
        currentQuery.meme_id = selectedMeme.toString();
      } else {
        delete currentQuery.meme_id;
      }
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
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
        lg={{ span: 3 }}>
        <a
          href={`/rememes/${rememe.contract}/${rememe.id}`}
          className="decoration-none scale-hover">
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
    <Container fluid className={styles.mainContainer}>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row className="d-flex justify-content-between">
              <Col
                className={`d-flex flex-wrap align-items-center gap-2 justify-content-between`}>
                <span className="d-flex align-items-center gap-2 pt-2 pb-2">
                  <Image
                    loading={"eager"}
                    width="0"
                    height="0"
                    style={{ width: "250px", height: "auto" }}
                    src="/re-memes.png"
                    alt="re-memes"
                  />
                  {totalResults > 0 && (
                    <span className="font-color-h font-larger">
                      (x{numberWithCommas(totalResults)})
                    </span>
                  )}
                </span>
                <span className="pt-2 pb-2">
                  <Button
                    className="seize-btn btn-white d-flex align-items-center gap-2"
                    onClick={() => {
                      window.location.href = "/rememes/add";
                    }}>
                    Add ReMeme{" "}
                    <FontAwesomeIcon
                      icon="plus-circle"
                      className={styles.buttonIcon}
                      onClick={() => {
                        window.location.href = "/rememes/add";
                      }}
                    />
                  </Button>
                </span>
              </Col>
            </Row>
            {rememesLoaded && (
              <Row className="pt-2">
                <Col
                  className={`pt-2 pb-2 d-flex align-items-center flex-wrap gap-2 justify-content-between`}>
                  <span className="d-flex align-items-center gap-1">
                    <Dropdown
                      className={styles.memeRefDropdown}
                      drop={"down-centered"}>
                      <Dropdown.Toggle>Sort: {selectedSorting}</Dropdown.Toggle>
                      <Dropdown.Menu>
                        {sorting.map((s) => (
                          <Dropdown.Item
                            key={`sorting-${s}`}
                            onClick={() => {
                              setSelectedSorting(s);
                            }}>
                            {s}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    {selectedSorting === RememeSort.RANDOM && (
                      <Tippy
                        content="Refresh results"
                        placement="top"
                        theme="light"
                        delay={250}>
                        <FontAwesomeIcon
                          icon="refresh"
                          className={styles.buttonIcon}
                          onClick={() => {
                            fetchResults(page);
                          }}
                        />
                      </Tippy>
                    )}
                  </span>
                  <span className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <Dropdown
                      className={styles.memeRefDropdown}
                      drop={"down-centered"}>
                      <Dropdown.Toggle>
                        Token Type: {selectedTokenType}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {tokenTypes.map((t) => (
                          <Dropdown.Item
                            key={`token-type-${t}`}
                            onClick={() => {
                              setSelectedTokenType(t);
                            }}>
                            {t}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown
                      className={styles.memeRefDropdown}
                      drop={"down-centered"}>
                      <Dropdown.Toggle>
                        Meme Reference:{" "}
                        {router.query.meme_id
                          ? memes.find(
                              (m) => m.id.toString() === router.query.meme_id
                            )
                            ? `${router.query.meme_id} - ${
                                memes.find(
                                  (m) =>
                                    m.id.toString() === router.query.meme_id
                                )?.name
                              }`
                            : `${router.query.meme_id}`
                          : `All`}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() => {
                            setSelectedMeme(0);
                          }}>
                          All
                        </Dropdown.Item>
                        {memes.map((m) => (
                          <Dropdown.Item
                            key={`meme-${m.id}`}
                            onClick={() => {
                              setSelectedMeme(m.id);
                            }}>
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
