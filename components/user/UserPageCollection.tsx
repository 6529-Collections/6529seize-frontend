import styles from "./UserPage.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Row, Col, Container, Form } from "react-bootstrap";
import { SortDirection } from "../../entities/ISort";
import { useState, useEffect } from "react";
import { MEMES_CONTRACT, GRADIENT_CONTRACT } from "../../constants";
import { NFT, NFTLite } from "../../entities/INFT";
import {
  areEqualAddresses,
  isMemesContract,
  isGradientsContract,
  numberWithCommas,
} from "../../helpers/Helpers";
import NFTImage from "../nft-image/NFTImage";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import { Owner } from "../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../entities/ITDH";
import Image from "next/image";
import SeasonsDropdown from "../seasons-dropdown/SeasonsDropdown";
import { Season } from "../../entities/ISeason";

interface Props {
  show: boolean;
  owned: Owner[];
  tdh?: ConsolidatedTDHMetrics | TDHMetrics;
  memesLite: NFTLite[];
}

enum Sort {
  ID = "id",
  TDH = "tdh",
  RANK = "tdh_rank",
}

export default function UserPageCollection(props: Props) {
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<Sort>(Sort.ID);

  const [hideSeized, setHideSeized] = useState(false);
  const [hideNonSeized, setHideNonSeized] = useState(true);
  const [hideMemes, setHideMemes] = useState(false);
  const [hideGradients, setHideGradients] = useState(false);

  const [gradients, setGradients] = useState<NFTLite[]>([]);
  const [nfts, setNfts] = useState<NFTLite[]>([]);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(0);

  const [gradientsFetched, setGradientsFetched] = useState(false);
  const [nftsFetched, setNftsFetched] = useState(false);

  useEffect(() => {
    if (sort && sortDir) {
      if (sort === Sort.ID) {
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.contract > b.contract) {
                return 1;
              } else if (a.contract < b.contract) {
                return -1;
              } else {
                return a.id > b.id ? 1 : -1;
              }
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              if (a.contract > b.contract) {
                return 1;
              } else if (a.contract < b.contract) {
                return -1;
              } else {
                return a.id > b.id ? -1 : 1;
              }
            })
          );
        }
      }
      if (sort === Sort.TDH) {
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              let atdh;
              let btdh;

              const aBalance = getBalance(a);
              const bBalance = getBalance(b);

              if (areEqualAddresses(a.contract, MEMES_CONTRACT)) {
                atdh = props.tdh?.memes.find((m) => m.id === a.id)?.tdh;
              } else if (areEqualAddresses(a.contract, GRADIENT_CONTRACT)) {
                atdh = props.tdh?.gradients.find((m) => m.id === a.id)?.tdh;
              }
              if (areEqualAddresses(b.contract, MEMES_CONTRACT)) {
                btdh = props.tdh?.memes.find((m) => m.id === b.id)?.tdh;
              } else if (areEqualAddresses(b.contract, GRADIENT_CONTRACT)) {
                btdh = props.tdh?.gradients.find((m) => m.id === b.id)?.tdh;
              }

              if (aBalance > 0 && !atdh) {
                atdh = 0;
              }
              if (bBalance > 0 && !btdh) {
                btdh = 0;
              }

              if (atdh != undefined && btdh != undefined) {
                if (atdh > btdh) {
                  return 1;
                } else if (atdh < btdh) {
                  return -1;
                } else {
                  return a.id > b.id ? 1 : -1;
                }
              } else {
                return aBalance > bBalance ? -1 : 1;
              }
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              let atdh;
              let btdh;

              const aBalance = getBalance(a);
              const bBalance = getBalance(b);

              if (areEqualAddresses(a.contract, MEMES_CONTRACT)) {
                atdh = props.tdh?.memes.find((m) => m.id === a.id)?.tdh;
              } else if (areEqualAddresses(a.contract, GRADIENT_CONTRACT)) {
                atdh = props.tdh?.gradients.find((m) => m.id === a.id)?.tdh;
              }
              if (areEqualAddresses(b.contract, MEMES_CONTRACT)) {
                btdh = props.tdh?.memes.find((m) => m.id === b.id)?.tdh;
              } else if (areEqualAddresses(b.contract, GRADIENT_CONTRACT)) {
                btdh = props.tdh?.gradients.find((m) => m.id === b.id)?.tdh;
              }

              if (aBalance > 0 && !atdh) {
                atdh = 0;
              }
              if (bBalance > 0 && !btdh) {
                btdh = 0;
              }
              if (atdh && btdh) {
                if (atdh > btdh) {
                  return -1;
                } else if (atdh < btdh) {
                  return 1;
                } else {
                  return a.id > b.id ? 1 : -1;
                }
              } else {
                return aBalance > bBalance ? -1 : 1;
              }
            })
          );
        }
      }
      if (sort === Sort.RANK) {
        if (sortDir === SortDirection.ASC) {
          setNfts(
            [...nfts].sort((a, b) => {
              let atdh;
              let btdh;

              const aBalance = getBalance(a);
              const bBalance = getBalance(b);

              if (areEqualAddresses(a.contract, MEMES_CONTRACT)) {
                atdh = props.tdh?.memes_ranks.find((m) => m.id === a.id)?.rank;
              } else if (areEqualAddresses(a.contract, GRADIENT_CONTRACT)) {
                atdh = props.tdh?.gradients_ranks.find(
                  (m) => m.id === a.id
                )?.rank;
              }
              if (areEqualAddresses(b.contract, MEMES_CONTRACT)) {
                btdh = props.tdh?.memes_ranks.find((m) => m.id === b.id)?.rank;
              } else if (areEqualAddresses(b.contract, GRADIENT_CONTRACT)) {
                btdh = props.tdh?.gradients_ranks.find(
                  (m) => m.id === b.id
                )?.rank;
              }

              if (aBalance > 0 && !atdh) {
                atdh = 0;
              }
              if (bBalance > 0 && !btdh) {
                btdh = 0;
              }

              if (atdh != undefined && btdh != undefined) {
                if (atdh > btdh) {
                  return 1;
                } else if (atdh < btdh) {
                  return -1;
                } else {
                  return a.id > b.id ? 1 : -1;
                }
              } else {
                return aBalance > bBalance ? -1 : 1;
              }
            })
          );
        } else {
          setNfts(
            [...nfts].sort((a, b) => {
              let atdh;
              let btdh;

              const aBalance = getBalance(a);
              const bBalance = getBalance(b);

              if (areEqualAddresses(a.contract, MEMES_CONTRACT)) {
                atdh = props.tdh?.memes_ranks.find((m) => m.id === a.id)?.rank;
              } else if (areEqualAddresses(a.contract, GRADIENT_CONTRACT)) {
                atdh = props.tdh?.gradients_ranks.find(
                  (m) => m.id === a.id
                )?.rank;
              }
              if (areEqualAddresses(b.contract, MEMES_CONTRACT)) {
                btdh = props.tdh?.memes_ranks.find((m) => m.id === b.id)?.rank;
              } else if (areEqualAddresses(b.contract, GRADIENT_CONTRACT)) {
                btdh = props.tdh?.gradients_ranks.find(
                  (m) => m.id === b.id
                )?.rank;
              }

              if (aBalance > 0 && !atdh) {
                atdh = 0;
              }
              if (bBalance > 0 && !btdh) {
                btdh = 0;
              }
              if (atdh && btdh) {
                if (atdh > btdh) {
                  return -1;
                } else if (atdh < btdh) {
                  return 1;
                } else {
                  return a.id > b.id ? 1 : -1;
                }
              } else {
                return aBalance > bBalance ? -1 : 1;
              }
            })
          );
        }
      }
    }
  }, [sortDir, sort, hideMemes, hideGradients, hideSeized, hideNonSeized]);


  useEffect(() => {
    const url = `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101&sort=${sort}&sort_direction=${sortDir}`;
    fetchAllPages(url).then((gradients: NFT[]) => {
      setGradients(gradients);
      setGradientsFetched(true);
    });
  }, []);

  useEffect(() => {
    if (!!props.memesLite.length && gradientsFetched) {
      setNfts(() => [...gradients, ...props.memesLite]);
      setNftsFetched(true);
    }
  }, [props.memesLite, gradientsFetched]);

  useEffect(() => {
    const url = `${process.env.API_ENDPOINT}/api/memes_seasons`;
    fetchUrl(url).then((seasons: any[]) => {
      setSeasons(seasons);
    });
  }, []);

  function getBalance(nft: NFTLite) {
    const balance = props.owned.find(
      (b) =>
        b.token_id === nft.id && areEqualAddresses(b.contract, nft.contract)
    );
    if (balance) {
      return balance.balance;
    }
    return 0;
  }

  function filterNft(nft: NFTLite) {
    const nftbalance = getBalance(nft);

    const isMemes = isMemesContract(nft.contract);
    const isGradients = isGradientsContract(nft.contract);

    if (nftbalance > 0 && hideSeized) {
      return;
    }
    if (nftbalance === 0 && (hideNonSeized || isGradients)) {
      return;
    }
    if (nftbalance > 0 && isGradients && hideGradients) {
      return;
    }
    if (nftbalance > 0 && isMemes && hideMemes) {
      return;
    }

    const season = seasons.find((s) => s.token_ids.includes(nft.id))?.season;

    if (selectedSeason != 0 && selectedSeason != season) {
      return;
    }

    return nft;
  }

  function printNft(nft: NFTLite) {
    let nfttdh;
    let nftrank;
    const nftbalance = getBalance(nft);

    const isMemes = isMemesContract(nft.contract);
    const isGradients = isGradientsContract(nft.contract);

    if (isMemes && props.tdh?.memes) {
      nfttdh = props.tdh?.memes.find((m) => m.id === nft.id)?.tdh;
      nftrank = props.tdh?.memes_ranks.find((g) => g.id === nft.id)?.rank;
    } else if (isGradients && props.tdh?.gradients) {
      nfttdh = props.tdh?.gradients.find((m) => m.id === nft.id)?.tdh;
      nftrank = props.tdh?.gradients_ranks.find((g) => g.id === nft.id)?.rank;
    }

    return (
      <Col
        key={`${nft.contract}-${nft.id}`}
        className="pt-3 pb-3"
        xs={{ span: 6 }}
        sm={{ span: 4 }}
        md={{ span: 3 }}
        lg={{ span: 3 }}
      >
        <Container fluid className="no-padding">
          <Row>
            <a
              className={styles.nftImagePadding}
              href={`/${
                areEqualAddresses(nft.contract, MEMES_CONTRACT)
                  ? "the-memes"
                  : "6529-gradient"
              }/${nft.id}`}
            >
              <NFTImage
                nft={nft}
                animation={false}
                height={300}
                balance={nftbalance}
                showOwned={
                  areEqualAddresses(nft.contract, GRADIENT_CONTRACT) &&
                  nftbalance > 0
                    ? true
                    : false
                }
                showThumbnail={true}
                showUnseized={true}
              />
            </a>
          </Row>
          <Row>
            <Col className="text-center pt-2">
              <a
                href={`/${
                  areEqualAddresses(nft.contract, MEMES_CONTRACT)
                    ? "the-memes"
                    : "6529-gradient"
                }/${nft.id}`}
              >
                {areEqualAddresses(nft.contract, MEMES_CONTRACT)
                  ? `#${nft.id} - ${nft.name}`
                  : nft.name}
              </a>
            </Col>
          </Row>
          {nfttdh && nftrank && (
            <Row>
              <Col className="text-center pt-2">
                TDH:{" "}
                {numberWithCommas(
                  Math.round(nfttdh * (props.tdh?.boost ? props.tdh.boost : 1))
                )}{" "}
                | Rank #{nftrank}
              </Col>
            </Row>
          )}
          {!nfttdh && !nftrank && nftbalance > 0 && (
            <Row>
              <Col className="text-center pt-2">TDH: 0 | Rank N/A</Col>
            </Row>
          )}
        </Container>
      </Col>
    );
  }

  function printNfts() {
    const mynfts = [...nfts].filter((n) => filterNft(n));
    if (mynfts.length === 0 && nftsFetched) {
      return (
        <Row className="pt-2">
          <Col>
            <Image
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
    return <Row className="pt-2">{mynfts.map((nft) => printNft(nft))}</Row>;
  }

  function printUserControls() {
    return (
      <Row className="pt-3">
        <Col>
          <Form.Check
            type="radio"
            name="hide"
            checked={!hideSeized && !hideNonSeized}
            className={`${styles.seizedToggle}`}
            label={`All`}
            onChange={() => {
              setHideSeized(false);
              setHideNonSeized(false);
            }}
          />
          <Form.Check
            type="radio"
            checked={!hideSeized && hideNonSeized}
            className={`${styles.seizedToggle}`}
            name="hide"
            label={`Seized`}
            onChange={() => {
              setHideSeized(false);
              setHideNonSeized(true);
            }}
          />
          <Form.Check
            type="radio"
            checked={hideSeized && !hideNonSeized}
            className={`${styles.seizedToggle}`}
            name="hide"
            label={`Unseized`}
            onChange={() => {
              setHideSeized(true);
              setHideNonSeized(false);
            }}
          />
          {props.tdh &&
            props.tdh.memes_balance > 0 &&
            props.tdh.gradients_balance > 0 && (
              <>
                <Form.Check
                  type="switch"
                  className={`${styles.seizedToggle}`}
                  label={`Hide Gradients`}
                  checked={hideGradients}
                  onChange={() => {
                    setHideGradients(!hideGradients);
                  }}
                />
                <Form.Check
                  type="switch"
                  className={`${styles.seizedToggle}`}
                  label={`Hide Memes`}
                  checked={hideMemes}
                  onChange={() => {
                    setHideMemes(!hideMemes);
                  }}
                />
              </>
            )}
        </Col>
      </Row>
    );
  }

  if (props.show) {
    return (
      <>
        <Row>
          <Col xs={5}>
            <Col xs={12}>
              Sort&nbsp;&nbsp;
              <FontAwesomeIcon
                icon="chevron-circle-up"
                onClick={() => setSortDir(SortDirection.ASC)}
                className={`${styles.sortDirection} ${
                  sortDir != SortDirection.ASC ? styles.disabled : ""
                }`}
              />{" "}
              <FontAwesomeIcon
                icon="chevron-circle-down"
                onClick={() => setSortDir(SortDirection.DESC)}
                className={`${styles.sortDirection} ${
                  sortDir != SortDirection.DESC ? styles.disabled : ""
                }`}
              />
            </Col>
            <Col xs={12} className="pt-2">
              <span
                onClick={() => setSort(Sort.ID)}
                className={`${styles.sort} ${
                  sort != Sort.ID ? styles.disabled : ""
                }`}
              >
                ID
              </span>
              <span
                onClick={() => setSort(Sort.TDH)}
                className={`${styles.sort} ${
                  sort != Sort.TDH ? styles.disabled : ""
                }`}
              >
                TDH
              </span>
              <span
                onClick={() => setSort(Sort.RANK)}
                className={`${styles.sort} ${
                  sort != Sort.RANK ? styles.disabled : ""
                }`}
              >
                RANK
              </span>
            </Col>
          </Col>
          <Col className="d-flex align-items-center justify-content-end" xs={7}>
            <SeasonsDropdown
              seasons={seasons.map((s) => s.season)}
              selectedSeason={selectedSeason}
              setSelectedSeason={setSelectedSeason}
            />
          </Col>
        </Row>
        {printUserControls()}
        {nfts.length > 0 && printNfts()}
        {/* {nftsNextPage && (
          <Row>
            <Col className="pt-3 pb-5">
              Fetching <DotLoader />
            </Col>
          </Row>
        )} */}
      </>
    );
  } else {
    return <></>;
  }
}
