import styles from "../../UserPage.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Row, Col, Form } from "react-bootstrap";
import { SortDirection } from "../../../../entities/ISort";
import { useState, useEffect } from "react";
import { MEMES_CONTRACT, GRADIENT_CONTRACT } from "../../../../constants";
import { NFT, NFTLite } from "../../../../entities/INFT";
import { areEqualAddresses } from "../../../../helpers/Helpers";
import { fetchAllPages, fetchUrl } from "../../../../services/6529api";
import { Owner } from "../../../../entities/IOwner";
import { ConsolidatedTDHMetrics, TDHMetrics } from "../../../../entities/ITDH";
import SeasonsDropdown from "../../../seasons-dropdown/SeasonsDropdown";
import { Season } from "../../../../entities/ISeason";
import UserPageCollectionNfts from "./UserPageCollectionNfts";
import UserPageCollectionControls from "./UserPageCollectionControls";

interface Props {
  show: boolean;
  owned: Owner[];
  tdh?: ConsolidatedTDHMetrics | TDHMetrics;
  memesLite: NFTLite[];
}

export enum UserCollectionSort {
  ID = "id",
  TDH = "tdh",
  RANK = "tdh_rank",
}

export default function UserPageCollection(props: Props) {
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.ASC);
  const [sort, setSort] = useState<UserCollectionSort>(UserCollectionSort.ID);

  const [hideSeized, setHideSeized] = useState(false);
  const [hideNonSeized, setHideNonSeized] = useState(true);
  const [hideMemes, setHideMemes] = useState(false);
  const [hideGradients, setHideGradients] = useState(false);

  const [gradients, setGradients] = useState<NFTLite[]>([]);
  const [nfts, setNfts] = useState<NFTLite[]>([]);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(0);

  useEffect(() => {
    if (!sort || !sortDir) {
      return;
    }

    if (sort === UserCollectionSort.ID) {
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
    if (sort === UserCollectionSort.TDH) {
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
    if (sort === UserCollectionSort.RANK) {
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
  }, [sortDir, sort]);

  useEffect(() => {
    const url = `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101&sort=${sort}&sort_direction=${sortDir}`;
    fetchAllPages(url).then((gradients: NFT[]) => {
      setGradients(gradients);
    });
  }, []);

  useEffect(() => {
    if (!!props.memesLite.length && !!gradients.length) {
      setNfts(() => [...gradients, ...props.memesLite]);
    }
  }, [props.memesLite, gradients]);

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
                onClick={() => setSort(UserCollectionSort.ID)}
                className={`${styles.sort} ${
                  sort != UserCollectionSort.ID ? styles.disabled : ""
                }`}
              >
                ID
              </span>
              <span
                onClick={() => setSort(UserCollectionSort.TDH)}
                className={`${styles.sort} ${
                  sort != UserCollectionSort.TDH ? styles.disabled : ""
                }`}
              >
                TDH
              </span>
              <span
                onClick={() => setSort(UserCollectionSort.RANK)}
                className={`${styles.sort} ${
                  sort != UserCollectionSort.RANK ? styles.disabled : ""
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
        <UserPageCollectionControls
          tdh={props.tdh}
          hideSeized={hideSeized}
          hideNonSeized={hideNonSeized}
          setHideSeized={setHideSeized}
          setHideNonSeized={setHideNonSeized}
          hideGradients={hideGradients}
          setHideGradients={setHideGradients}
          hideMemes={hideMemes}
          setHideMemes={setHideMemes}
        />

        {!!nfts.length && (
          <UserPageCollectionNfts
            owned={props.owned}
            nfts={nfts}
            tdh={props.tdh}
            seasons={seasons}
            selectedSeason={selectedSeason}
            hideSeized={hideSeized}
            hideNonSeized={hideNonSeized}
            hideMemes={hideMemes}
            hideGradients={hideGradients}
            sort={sort}
            sortDir={sortDir}
          />
        )}
      </>
    );
  } else {
    return <></>;
  }
}
