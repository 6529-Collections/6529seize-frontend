import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Dropdown,
  DropdownButton,
} from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { TDH, TDHCalc, TDHMetrics } from "../../entities/ITDH";
import styles from "./Leaderboard.module.scss";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  areEqualAddresses,
  getDateDisplay,
  numberWithCommas,
} from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
import { Owner, OwnerTags } from "../../entities/IOwner";
import { useRouter } from "next/router";

const Address = dynamic(() => import("../address/Address"), { ssr: false });

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean;
}

enum Sort {
  tdh_rank = "tdh_rank",
  boosted_tdh = "boosted_tdh",
  tdh = "tdh",
  tdh__raw = "tdh__raw",
  memes_tdh = "memes_tdh",
  boosted_memes_tdh = "memes_tdh",
  memes_tdh__raw = "memes_tdh__raw",
  szn1_tdh = "memes_tdh_season1",
  boosted_szn1_tdh = "memes_tdh_season1",
  szn1_tdh__raw = "memes_tdh_season1__raw",
  szn2_tdh = "memes_tdh_season2",
  boosted_szn2_tdh = "memes_tdh_season2",
  szn2_tdh__raw = "memes_tdh_season2__raw",
  gradients_tdh = "gradients_tdh",
  boosted_gradients_tdh = "gradients_tdh",
  gradients_tdh__raw = "gradients_tdh__raw",
  total_balance = "balance",
  memes_balance = "memes_balance",
  szn1_balance = "memes_balance_season1",
  szn2_balance = "memes_balance_season2",
  gradients_balance = "gradients_balance",
  purchases_value = "purchases_value",
  sales_value = "sales_value",
  sales_count = "sales_count",
}

enum Content {
  ALL = "All",
  MEMES = "Memes",
  MEMES1 = "Memes SZN1",
  MEMES2 = "Memes SZN2",
  GRADIENTS = "6529 Gradient",
}

export default function Leaderboard(props: Props) {
  const router = useRouter();

  const [content, setContent] = useState<Content>(Content.ALL);

  const [pageProps, setPageProps] = useState<Props>(props);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<TDHMetrics[]>();
  const [lastTDH, setLastTDH] = useState<TDHCalc>();
  const [next, setNext] = useState(null);
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.boosted_tdh, sort_direction: SortDirection.DESC });
  const [showViewAll, setShowViewAll] = useState(
    !window.location.pathname.includes("community")
  );

  const [ownerTags, setOwnersTags] = useState<OwnerTags[]>([]);
  const [ownerTagsLoaded, setOwnerTagsLoaded] = useState(false);

  async function fetchResults() {
    var top = document.getElementById(`leaderboard-page`)?.offsetTop;
    if (top && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
    fetch(
      `${process.env.API_ENDPOINT}/api/owner_metrics?page_size=${props.pageSize}&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}`
    )
      .then((res) => res.json())
      .then((response: DBResponse) => {
        setTotalResults(response.count);
        setNext(response.next);
        setLeaderboard(response.data);
      });
  }

  useEffect(() => {
    if (sort && router.isReady) {
      if (pageProps.page == 1) {
        fetchResults();
      } else {
        setPageProps({ ...pageProps, page: 1 });
      }
    }
  }, [sort, router.isReady]);

  useEffect(() => {
    fetch(`${process.env.API_ENDPOINT}/api/blocks?page_size=${1}`)
      .then((res) => res.json())
      .then((response: DBResponse) => {
        if (response.data.length > 0) {
          setLastTDH({
            block: response.data[0].block_number,
            date: new Date(response.data[0].timestamp),
          });
        }
      });
  }, []);

  useEffect(() => {
    fetchResults();
  }, [pageProps.page]);

  useEffect(() => {
    async function fetchOwnersTags(url: string, myowners: OwnerTags[]) {
      return fetch(url)
        .then((res) => res.json())
        .then((response: DBResponse) => {
          if (response.next) {
            fetchOwnersTags(response.next, [...myowners].concat(response.data));
          } else {
            const newOwnersTags = [...myowners].concat(response.data);
            setOwnersTags(newOwnersTags);
            setOwnerTagsLoaded(true);
          }
        });
    }

    if (leaderboard && router.isReady) {
      const uniqueWallets = leaderboard.map((l) => l.wallet);
      const initialUrlOwners = `${
        process.env.API_ENDPOINT
      }/api/owners_tags?wallet=${uniqueWallets.join(",")}`;
      fetchOwnersTags(initialUrlOwners, []);
    }
  }, [router.isReady, leaderboard]);

  useEffect(() => {
    if (
      [
        Sort.total_balance,
        Sort.memes_balance,
        Sort.szn1_balance,
        Sort.szn2_balance,
        Sort.gradients_balance,
      ].includes(sort.sort)
    ) {
      setSort({ sort: getBalanceSort(), sort_direction: sort.sort_direction });
    }

    if (
      [
        Sort.boosted_tdh,
        Sort.boosted_memes_tdh,
        Sort.boosted_szn1_tdh,
        Sort.boosted_szn2_tdh,
        Sort.boosted_gradients_tdh,
      ].includes(sort.sort)
    ) {
      setSort({
        sort: getBoostedTdhSort(),
        sort_direction: sort.sort_direction,
      });
    }

    if (
      [
        Sort.tdh,
        Sort.memes_tdh,
        Sort.szn1_tdh,
        Sort.szn2_tdh,
        Sort.gradients_tdh,
      ].includes(sort.sort)
    ) {
      setSort({
        sort: getTdhSort(),
        sort_direction: sort.sort_direction,
      });
    }

    if (
      [
        Sort.tdh__raw,
        Sort.memes_tdh__raw,
        Sort.szn1_tdh__raw,
        Sort.szn2_tdh__raw,
        Sort.gradients_tdh__raw,
      ].includes(sort.sort)
    ) {
      setSort({
        sort: getTdhRawSort(),
        sort_direction: sort.sort_direction,
      });
    }
  }, [content]);

  function getCardsHodled(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.memes_balance;
      case Content.MEMES1:
        return lead.memes_balance_season1;
      case Content.MEMES2:
        return lead.memes_balance_season2;
      case Content.GRADIENTS:
        return lead.gradients_balance;
      default:
        return lead.balance;
    }
  }

  function getDaysHodledTdhBoosted(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.memes_tdh * lead.boost;
      case Content.MEMES1:
        return lead.memes_tdh_season1 * lead.boost;
      case Content.MEMES2:
        return lead.memes_tdh_season2 * lead.boost;
      case Content.GRADIENTS:
        return lead.gradients_tdh * lead.boost;
      default:
        return lead.boosted_tdh;
    }
  }

  function getDaysHodledTdh(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.memes_tdh;
      case Content.MEMES1:
        return lead.memes_tdh_season1;
      case Content.MEMES2:
        return lead.memes_tdh_season2;
      case Content.GRADIENTS:
        return lead.gradients_tdh;
      default:
        return lead.tdh;
    }
  }

  function getDaysHodledTdhRaw(lead: TDHMetrics) {
    switch (content) {
      case Content.MEMES:
        return lead.memes_tdh__raw;
      case Content.MEMES1:
        return lead.memes_tdh_season1__raw;
      case Content.MEMES2:
        return lead.memes_tdh_season2__raw;
      case Content.GRADIENTS:
        return lead.gradients_tdh__raw;
      default:
        return lead.tdh__raw;
    }
  }

  function getBalanceSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.memes_balance;
      case Content.MEMES1:
        return Sort.szn1_balance;
      case Content.MEMES2:
        return Sort.szn2_balance;
      case Content.GRADIENTS:
        return Sort.gradients_balance;
      default:
        return Sort.total_balance;
    }
  }

  function getBoostedTdhSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.boosted_memes_tdh;
      case Content.MEMES1:
        return Sort.boosted_szn1_tdh;
      case Content.MEMES2:
        return Sort.boosted_szn2_tdh;
      case Content.GRADIENTS:
        return Sort.boosted_gradients_tdh;
      default:
        return Sort.boosted_tdh;
    }
  }

  function getTdhSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.memes_tdh;
      case Content.MEMES1:
        return Sort.szn1_tdh;
      case Content.MEMES2:
        return Sort.szn2_tdh;
      case Content.GRADIENTS:
        return Sort.gradients_tdh;
      default:
        return Sort.tdh;
    }
  }

  function getTdhRawSort() {
    switch (content) {
      case Content.MEMES:
        return Sort.memes_tdh__raw;
      case Content.MEMES1:
        return Sort.szn1_tdh__raw;
      case Content.MEMES2:
        return Sort.szn2_tdh__raw;
      case Content.GRADIENTS:
        return Sort.gradients_tdh__raw;
      default:
        return Sort.tdh__raw;
    }
  }

  return (
    <Container className={`no-padding pt-4`} id={`leaderboard-page`}>
      <Row>
        <Col className={styles.pageHeader}>
          <h1>
            COMMUNITY{" "}
            {showViewAll && (
              <a href="/community">
                <span className={styles.viewAllLink}>VIEW ALL</span>
              </a>
            )}
          </h1>
        </Col>
        <Col className="d-flex justify-content-center">
          <Dropdown className={styles.contentDropdown} drop={"down-centered"}>
            <Dropdown.Toggle>{content}</Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setContent(Content.ALL)}>
                {Content.ALL}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setContent(Content.MEMES)}>
                {Content.MEMES}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setContent(Content.MEMES1)}>
                &nbsp;&nbsp;{Content.MEMES1}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setContent(Content.MEMES2)}>
                &nbsp;&nbsp;{Content.MEMES2}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setContent(Content.GRADIENTS)}>
                {Content.GRADIENTS}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        {lastTDH && (
          <Col className={`${styles.lastTDH}`}>
            * LAST TDH: {getDateDisplay(lastTDH.date)} BLOCK:{" "}
            <a
              href={`https://etherscan.io/block/${lastTDH.block}`}
              rel="noreferrer"
              target="_blank">
              {lastTDH.block}
            </a>
          </Col>
        )}
      </Row>
      <Row className={styles.scrollContainer}>
        <Col>
          {leaderboard && leaderboard.length > 0 && (
            <Table bordered={false} className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.rank}></th>
                  <th className={styles.hodler}></th>
                  <th className={styles.gap}></th>
                  <th
                    colSpan={1}
                    className={`${styles.tdh} ${styles.borderBottom}`}>
                    <b>Cards HODLed</b>
                  </th>
                  <th className={styles.gap}></th>
                  <th
                    colSpan={2}
                    className={`${styles.tdh} ${styles.borderBottom}`}>
                    <b>Interactions</b>
                  </th>
                  <th className={styles.gap}></th>
                  <th
                    colSpan={3}
                    className={`${styles.tdh} ${styles.borderBottom}`}>
                    <b>Days HODLed (TDH)</b>
                  </th>
                </tr>
                <tr className={styles.gap}></tr>
                <tr>
                  <th className={styles.rank}>Rank</th>
                  <th className={styles.hodler}>HODLer</th>
                  <th className={styles.gap}></th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      {content}&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: getBalanceSort(),
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != getBalanceSort()
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: getBalanceSort(),
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != getBalanceSort()
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
                      Purchases&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.purchases_value,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.purchases_value
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.purchases_value,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.purchases_value
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Sales&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.sales_value,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.sales_value
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.sales_value,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.sales_value
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
                      {content}&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: getBoostedTdhSort(),
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != getBoostedTdhSort()
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: getBoostedTdhSort(),
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != getBoostedTdhSort()
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Unboosted&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: getTdhSort(),
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != getTdhSort()
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: getTdhSort(),
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != getTdhSort()
                              ? styles.disabled
                              : ""
                          }`}
                        />
                      </span>
                    </span>
                  </th>
                  <th className={styles.tdhSub}>
                    <span className="d-flex align-items-center justify-content-center">
                      Unweighted&nbsp;
                      <span className="d-flex flex-column">
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: getTdhRawSort(),
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != getTdhRawSort()
                              ? styles.disabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: getTdhRawSort(),
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.caret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != getTdhRawSort()
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
                  ownerTagsLoaded &&
                  leaderboard.map((lead, index) => {
                    const tags = ownerTags.find((ot) =>
                      areEqualAddresses(ot.wallet, lead.wallet)
                    );
                    return (
                      <tr key={`${index}-${lead.wallet}`}>
                        <td className={styles.rank}>
                          {/* {lead.tdh_rank} */}
                          {index +
                            1 +
                            (pageProps.page - 1) * pageProps.pageSize}
                        </td>
                        <td className={styles.hodler}>
                          <Address
                            address={lead.wallet}
                            ens={lead.wallet_display}
                            tags={{
                              memesCardsSets: tags ? tags.memes_cards_sets : 0,
                              memesBalance: tags ? tags.unique_memes : 0,
                              gradientsBalance: tags
                                ? tags.gradients_balance
                                : 0,
                              genesis: tags ? tags.genesis : false,
                            }}
                          />
                        </td>
                        <td className={styles.gap}></td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(getCardsHodled(lead))}
                        </td>
                        <td className={styles.gap}></td>
                        <td className={styles.tdhSub}>
                          {lead.purchases_count > 0 ? (
                            <>
                              x
                              {numberWithCommas(
                                Math.round(lead.purchases_count * 100) / 100
                              )}{" "}
                              -{" "}
                              {numberWithCommas(
                                Math.round(lead.purchases_value * 100) / 100
                              )}{" "}
                              eth
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={styles.tdhSub}>
                          {lead.sales_count > 0 ? (
                            <>
                              x
                              {numberWithCommas(
                                Math.round(lead.sales_count * 100) / 100
                              )}{" "}
                              -{" "}
                              {numberWithCommas(
                                Math.round(lead.sales_value * 100) / 100
                              )}{" "}
                              eth
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={styles.gap}></td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(
                            Math.round(getDaysHodledTdhBoosted(lead))
                          )}
                        </td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(getDaysHodledTdh(lead))}
                        </td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(getDaysHodledTdhRaw(lead))}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
      {props.showMore && totalResults > 0 && leaderboard && ownerTagsLoaded && (
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
    </Container>
  );
}
