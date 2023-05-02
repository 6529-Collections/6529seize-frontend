import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { ConsolidatedTDH, TDHCalc } from "../../entities/ITDH";
import styles from "./Leaderboard.module.scss";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { areEqualAddresses, numberWithCommas } from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
import { OwnerTags } from "../../entities/IOwner";
import { useRouter } from "next/router";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import Address from "../address/Address";

interface Props {
  contract: string;
  nftId: number;
  page: number;
  pageSize: number;
}

enum Sort {
  card_tdh = "card_tdh",
  card_tdh__raw = "card_tdh__raw",
  card_balance = "card_balance",
  total_tdh = "total_tdh",
  total_tdh__raw = "total_tdh__raw",
  total_balance = "total_balance",
}

export default function NFTLeaderboard(props: Props) {
  const router = useRouter();
  const [pageProps, setPageProps] = useState<Props>(props);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<ConsolidatedTDH[]>();
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [lastTDH, setLastTDH] = useState<TDHCalc>();
  const [next, setNext] = useState(null);
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.card_tdh, sort_direction: SortDirection.DESC });

  async function fetchResults() {
    fetchUrl(
      `${process.env.API_ENDPOINT}/api/tdh/${props.contract}/${props.nftId}?page_size=${props.pageSize}&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}`
    ).then((response: DBResponse) => {
      setTotalResults(response.count);
      setNext(response.next);
      setLeaderboard(response.data);
      setLeaderboardLoaded(true);
    });
  }

  // useEffect(() => {
  //   async function fetchOwnersTags(url: string) {
  //     return fetchAllPages(url).then((newOwnersTags: OwnerTags[]) => {
  //       setOwnersTags(newOwnersTags);
  //       setOwnerTagsLoaded(true);
  //     });
  //   }

  //   if (leaderboard && router.isReady && leaderboard.length > 0) {
  //     const uniqueWallets = [...leaderboard].map((l) => l.consolidation_display);
  //     const initialUrlOwners = `${
  //       process.env.API_ENDPOINT
  //     }/api/owners_tags?wallet=${uniqueWallets.join(",")}`;
  //     fetchOwnersTags(initialUrlOwners);
  //   }
  // }, [router.isReady, leaderboard]);

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/blocks?page_size=${1}`).then(
      (response: DBResponse) => {
        if (response.data.length > 0) {
          setLastTDH({
            block: response.data[0].block_number,
            date: new Date(response.data[0].timestamp),
          });
        }
      }
    );
  }, []);

  useEffect(() => {
    if (pageProps.page == 1) {
      fetchResults();
    } else {
      setPageProps({ ...pageProps, page: 1 });
    }
  }, [sort]);

  useEffect(() => {
    fetchResults();
  }, [pageProps.page]);

  return (
    <Container className={`no-padding pt-3`} id={`leaderboard-${props.nftId}`}>
      <Row>
        <Col>
          <h1>COMMUNITY -</h1>
          <h1>&nbsp;CARD {props.nftId}</h1>
        </Col>
        {/* {lastTDH && (
          <Col className={`text-right ${styles.lastTDH}`}>
            * LAST TDH: {getDateDisplay(lastTDH.date)} BLOCK:{" "}
            <a
              href={`https://etherscan.io/block/${lastTDH.block}`}
              rel="noreferrer"
              target="_blank">
              {lastTDH.block}
            </a>
          </Col>
        )} */}
      </Row>
      {leaderboard && leaderboard.length > 0 && (
        <Row className={styles.scrollContainer}>
          <Col>
            <Table bordered={false} className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rank}></th>
                  <th className={styles.hodler}></th>
                  <th className={styles.gap}></th>
                  <th
                    colSpan={3}
                    className={`${styles.tdh} ${styles.borderBottom}`}>
                    <b>This Card</b>
                  </th>
                  <th className={styles.gap}></th>
                  <th
                    colSpan={3}
                    className={`${styles.tdh} ${styles.borderBottom}`}>
                    <b>Total</b>
                  </th>
                </tr>
                <tr className={styles.gap}></tr>
                <tr>
                  <th className={styles.rank}>Rank</th>
                  <th className={styles.hodler}>Collector</th>
                  <th className={styles.gap}></th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Balance&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.card_balance,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.card_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.card_balance,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.card_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      TDH&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.card_tdh,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.card_tdh
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.card_tdh,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.card_tdh
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Unweighted TDH&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.card_tdh__raw,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.card_tdh__raw
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.card_tdh__raw,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.card_tdh__raw
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.gap}></th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Balance&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.total_balance,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.total_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.total_balance,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.total_balance
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      TDH&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.total_tdh,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.total_tdh
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.total_tdh,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.total_tdh
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Unweighted TDH&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.total_tdh__raw,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.total_tdh__raw
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.total_tdh__raw,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.total_tdh__raw
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.gap}></tr>
                {leaderboard &&
                  leaderboard.map((lead, index) => {
                    const thisCard = lead.memes.find(
                      (m) => m.id == props.nftId
                    );
                    if (thisCard)
                      return (
                        <tr
                          key={`${index}-${lead.consolidation_display.replace(
                            " ",
                            "-"
                          )}`}>
                          <td className={styles.rank}>
                            {/* {lead.tdh_rank} */}
                            {index +
                              1 +
                              (pageProps.page - 1) * pageProps.pageSize}
                          </td>
                          <td className={styles.hodler}>
                            <Address
                              wallets={lead.wallets}
                              display={lead.consolidation_display}
                              tags={{
                                memesCardsSets: lead
                                  ? lead.memes_cards_sets
                                  : 0,
                                memesCardsSetS1: lead
                                  ? lead.memes_cards_sets_szn1
                                  : 0,
                                memesCardsSetS2: lead
                                  ? lead.memes_cards_sets_szn2
                                  : 0,
                                memesCardsSetS3: lead
                                  ? lead.memes_cards_sets_szn3
                                  : 0,
                                memesBalance: lead ? lead.unique_memes : 0,
                                gradientsBalance: lead
                                  ? lead.gradients_balance
                                  : 0,
                                genesis: lead ? lead.genesis : 0,
                              }}
                            />
                          </td>
                          <td className={styles.gap}></td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(thisCard.balance)}
                          </td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(Math.round(thisCard.tdh))}
                          </td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(Math.round(thisCard.tdh__raw))}
                          </td>
                          <td className={styles.gap}></td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(lead.memes_balance)}
                          </td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(Math.round(lead.boosted_tdh))}
                          </td>
                          <td className={styles.tdhSub}>
                            {numberWithCommas(Math.round(lead.tdh__raw))}
                          </td>
                        </tr>
                      );
                  })}
              </tbody>
            </Table>
          </Col>
        </Row>
      )}
      {totalResults > 0 && (
        <Row className="text-center pt-2 pb-3">
          <Pagination
            page={pageProps.page}
            pageSize={pageProps.pageSize}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPageProps({ ...pageProps, page: newPage });
            }}
          />
        </Row>
      )}
      {leaderboardLoaded && leaderboard?.length == 0 && (
        <Row>
          <Col>No TDH accrued</Col>
        </Row>
      )}
    </Container>
  );
}
