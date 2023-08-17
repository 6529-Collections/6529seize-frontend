import { Container, Row, Col, Dropdown, Button } from "react-bootstrap";
import styles from "./Rememes.module.scss";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import { MEMES_CONTRACT, OPENSEA_STORE_FRONT_CONTRACT } from "../../constants";
import { useEffect, useState } from "react";
import { NFT, Rememe } from "../../entities/INFT";
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

const PAGE_SIZE = 20;

enum TokenType {
  ALL = "All",
  ERC721 = "ERC-721",
  ERC1155 = "ERC-1155",
}

export enum RememeSort {
  RANDOM = "Random",
  CREATED_ASC = "Recently Added",
}

interface Props {
  meme_id?: number;
}

export default function Rememes(props: Props) {
  const router = useRouter();

  const [memes, setMemes] = useState<NFT[]>([]);
  const [memesLoaded, setMemesLoaded] = useState(false);

  const [rememes, setRememes] = useState<Rememe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [rememesLoaded, setRememesLoaded] = useState(false);

  const [urlMemeId, setUrlMemeId] = useState<number | undefined>(props.meme_id);

  const tokenTypes = [TokenType.ALL, TokenType.ERC721, TokenType.ERC1155];
  const [selectedTokenType, setSelectedTokenType] = useState<TokenType>(
    TokenType.ALL
  );
  const [selectedMeme, setSelectedMeme] = useState<NFT>();

  const sorting = [RememeSort.RANDOM, RememeSort.CREATED_ASC];
  const [selectedSorting, setSelectedSorting] = useState<RememeSort>(
    RememeSort.RANDOM
  );

  useEffect(() => {
    fetchAllPages(
      `${process.env.API_ENDPOINT}/api/nfts?contract=${MEMES_CONTRACT}`
    ).then((responseNfts: NFT[]) => {
      setMemes(responseNfts.sort((a, b) => a.id - b.id));
      setMemesLoaded(true);
    });
  }, []);

  function fetchResults(mypage: number) {
    setRememesLoaded(false);
    let memeFilter = "";
    if (urlMemeId) {
      memeFilter = `&meme_id=${urlMemeId}`;
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
    if (selectedMeme || urlMemeId) {
      setUrlMemeId(selectedMeme ? selectedMeme.id : urlMemeId);
      router.replace(
        {
          query: { meme_id: selectedMeme ? selectedMeme.id : urlMemeId },
        },
        undefined,
        { shallow: true }
      );
    } else {
      setUrlMemeId(undefined);
      router.replace(
        {
          query: {},
        },
        undefined,
        { shallow: true }
      );
    }
  }, [selectedMeme || urlMemeId]);

  useEffect(() => {
    fetchResults(page);
  }, [page, router.isReady, urlMemeId, selectedTokenType, selectedSorting]);

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
            <Image
              loading={"eager"}
              width="0"
              height="0"
              style={{ height: "auto", width: "100px" }}
              src="/SummerGlasses.svg"
              alt="SummerGlasses"
            />{" "}
            Nothing here yet
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
                              setTotalResults(0);
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
                              setTotalResults(0);
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
                        {urlMemeId
                          ? memes.find((m) => m.id === urlMemeId)
                            ? `${urlMemeId} - ${
                                memes.find((m) => m.id === urlMemeId)?.name
                              }`
                            : `${urlMemeId}`
                          : `All`}
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() => {
                            setUrlMemeId(undefined);
                            setTotalResults(0);
                            setSelectedMeme(undefined);
                          }}>
                          All
                        </Dropdown.Item>
                        {memes.map((m) => (
                          <Dropdown.Item
                            key={`meme-${m.id}`}
                            onClick={() => {
                              setTotalResults(0);
                              setSelectedMeme(m);
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
