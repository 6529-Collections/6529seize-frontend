import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import styles from "./Leaderboard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cicToType, numberWithCommas } from "../../helpers/Helpers";
import { SortDirection } from "../../entities/ISort";
import DotLoader from "../dotLoader/DotLoader";
import { LeaderboardCollector } from "./LeaderboardCollector";
import { commonApiFetch } from "../../services/api/common-api";
import { CICType } from "../../entities/IProfile";
import { MemeSeason } from "../../entities/ISeason";
import { Collector, Content } from "./Leaderboard";
import DownloadUrlWidget from "../downloadUrlWidget/DownloadUrlWidget";
import Pagination from "../pagination/Pagination";

const PAGE_SIZE = 50;

interface Props {
  block: number | undefined;
  content: Content;
  collector: Collector;
  selectedSeason: number;
  searchWallets: string[];
  globalTdhRateChange?: number;
  seasons: MemeSeason[];
  setIsLoading: (isLoading: boolean) => void;
}

enum Sort {
  level = "level",
  balance = "balance",
  unique_memes = "unique_memes",
  memes_cards_sets = "memes_cards_sets",
  boosted_tdh = "boosted_tdh",
  day_change = "day_change",
}

export interface LeaderboardMetrics {
  handle: string;
  consolidation_key: string;
  consolidation_display: string;
  pfp_url: string;
  balance: number;
  unique_memes: number;
  unique_memes_total: number;
  memes_cards_sets: number;
  rep_score: number;
  cic_score: number;
  boosted_tdh: number;
  day_change: number;
  level: number;
  cic_type?: CICType;
}

export default function LeaderboardCardsCollected(props: Readonly<Props>) {
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardMetrics[]>();
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.level, sort_direction: SortDirection.DESC });
  const [showLoader, setShowLoader] = useState(false);

  const [myFetchUrl, setMyFetchUrl] = useState<string>("");

  const memesCount = props.seasons.reduce(
    (acc, season) => acc + season.count,
    0
  );

  function getFileName(page?: number) {
    const tdhBlockSuffix = props.block ? `-${props.block}` : "";
    const csvFileName = `consolidated-community-download${tdhBlockSuffix}`;
    if (page) {
      return `${csvFileName}-page${page}.csv`;
    }
    return `${csvFileName}.csv`;
  }

  async function fetchResults() {
    setMyFetchUrl("");
    setShowLoader(true);
    props.setIsLoading(true);
    let walletFilter = "";
    if (props.searchWallets && props.searchWallets.length > 0) {
      walletFilter = `&search=${props.searchWallets.join(",")}`;
    }
    let url = `tdh/consolidated_metrics`;
    let mysort = sort.sort;

    let contentFilter = "";
    if (props.content !== Content.ALL) {
      contentFilter = `&content=${props.content.toLowerCase()}`;
    }

    let collectorFilter = "";
    if (props.collector !== Collector.ALL) {
      collectorFilter = `&collector=${props.collector.toLowerCase()}`;
    }

    let seasonFilter = "";
    if (props.selectedSeason > 0) {
      seasonFilter = `&season=${props.selectedSeason}`;
    }

    url = `${url}?page_size=${PAGE_SIZE}&page=${page}&sort=${mysort}&sort_direction=${sort.sort_direction}${walletFilter}${contentFilter}${collectorFilter}${seasonFilter}`;
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: LeaderboardMetrics[];
    }>({
      endpoint: url,
    }).then((response) => {
      setTotalResults(response.count);
      response.data.forEach((lead: LeaderboardMetrics) => {
        lead.cic_type = cicToType(lead.cic_score);
      });
      setLeaderboard(response.data);
      setShowLoader(false);
      props.setIsLoading(false);
      setMyFetchUrl(url);
    });
  }

  useEffect(() => {
    if (page === 1) {
      fetchResults();
    } else {
      setPage(1);
    }
  }, [
    sort,
    props.content,
    props.selectedSeason,
    props.searchWallets,
    props.collector,
  ]);

  useEffect(() => {
    fetchResults();
    var top = document.getElementById(`leaderboard-page`)?.offsetTop;
    if (top && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, [page]);

  function getTDHChange(lead: LeaderboardMetrics) {
    if (!lead.boosted_tdh) {
      return "";
    }

    const tdhChange = (lead.day_change / lead.boosted_tdh) * 100;
    return ` (${tdhChange.toFixed(2)}%)`;
  }

  function calculateTdhVsCommunity(lead: LeaderboardMetrics) {
    if (!props.globalTdhRateChange || !lead.day_change || !lead.boosted_tdh) {
      return "-";
    }
    const tdhChange = (lead.day_change / lead.boosted_tdh) * 100;
    return `${(tdhChange / props.globalTdhRateChange).toFixed(2)}x`;
  }

  if (!leaderboard) {
    return <></>;
  }

  if (leaderboard.length === 0) {
    return (
      <Container>
        <Row>
          <Col>No results found. Change filters and try again.</Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row>
        <Col></Col>
        <Table bordered={false} className={styles.leaderboardTable}>
          <thead>
            <tr>
              <th className={styles.rank}>Rank</th>
              <th className={`${styles.hodlerContainer}`}>
                Collector&nbsp;&nbsp;
                <span className={styles.totalResults}>
                  x{totalResults.toLocaleString()}
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Level&nbsp;
                  <span className="d-flex flex-column">
                    <FontAwesomeIcon
                      icon="square-caret-up"
                      onClick={() =>
                        setSort({
                          sort: Sort.level,
                          sort_direction: SortDirection.ASC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.ASC ||
                        sort.sort != Sort.level
                          ? styles.disabled
                          : ""
                      }`}
                    />
                    <FontAwesomeIcon
                      icon="square-caret-down"
                      onClick={() =>
                        setSort({
                          sort: Sort.level,
                          sort_direction: SortDirection.DESC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.DESC ||
                        sort.sort != Sort.level
                          ? styles.disabled
                          : ""
                      }`}
                    />
                  </span>
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Cards Collected&nbsp;
                  <span className="d-flex flex-column">
                    <FontAwesomeIcon
                      icon="square-caret-up"
                      onClick={() =>
                        setSort({
                          sort: Sort.balance,
                          sort_direction: SortDirection.ASC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.ASC ||
                        sort.sort != Sort.balance
                          ? styles.disabled
                          : ""
                      }`}
                    />
                    <FontAwesomeIcon
                      icon="square-caret-down"
                      onClick={() =>
                        setSort({
                          sort: Sort.balance,
                          sort_direction: SortDirection.DESC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.DESC ||
                        sort.sort != Sort.balance
                          ? styles.disabled
                          : ""
                      }`}
                    />
                  </span>
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Unique Memes&nbsp;
                  <span className="d-flex flex-column">
                    <FontAwesomeIcon
                      icon="square-caret-up"
                      onClick={() =>
                        setSort({
                          sort: Sort.unique_memes,
                          sort_direction: SortDirection.ASC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.ASC ||
                        sort.sort != Sort.unique_memes
                          ? styles.disabled
                          : ""
                      }`}
                    />
                    <FontAwesomeIcon
                      icon="square-caret-down"
                      onClick={() =>
                        setSort({
                          sort: Sort.unique_memes,
                          sort_direction: SortDirection.DESC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.DESC ||
                        sort.sort != Sort.unique_memes
                          ? styles.disabled
                          : ""
                      }`}
                    />
                  </span>
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Sets&nbsp;
                  <span className="d-flex flex-column">
                    <FontAwesomeIcon
                      icon="square-caret-up"
                      onClick={() =>
                        setSort({
                          sort: Sort.memes_cards_sets,
                          sort_direction: SortDirection.ASC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.ASC ||
                        sort.sort != Sort.memes_cards_sets
                          ? styles.disabled
                          : ""
                      }`}
                    />
                    <FontAwesomeIcon
                      icon="square-caret-down"
                      onClick={() =>
                        setSort({
                          sort: Sort.memes_cards_sets,
                          sort_direction: SortDirection.DESC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.DESC ||
                        sort.sort != Sort.memes_cards_sets
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
                          sort: Sort.boosted_tdh,
                          sort_direction: SortDirection.ASC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.ASC ||
                        sort.sort != Sort.boosted_tdh
                          ? styles.disabled
                          : ""
                      }`}
                    />
                    <FontAwesomeIcon
                      icon="square-caret-down"
                      onClick={() =>
                        setSort({
                          sort: Sort.boosted_tdh,
                          sort_direction: SortDirection.DESC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.DESC ||
                        sort.sort != Sort.boosted_tdh
                          ? styles.disabled
                          : ""
                      }`}
                    />
                  </span>
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Daily Change&nbsp; &nbsp;
                  <span className="d-flex flex-column">
                    <FontAwesomeIcon
                      icon="square-caret-up"
                      onClick={() =>
                        setSort({
                          sort: Sort.day_change,
                          sort_direction: SortDirection.ASC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.ASC ||
                        sort.sort != Sort.day_change
                          ? styles.disabled
                          : ""
                      }`}
                    />
                    <FontAwesomeIcon
                      icon="square-caret-down"
                      onClick={() =>
                        setSort({
                          sort: Sort.day_change,
                          sort_direction: SortDirection.DESC,
                        })
                      }
                      className={`${styles.caret} ${
                        sort.sort_direction != SortDirection.DESC ||
                        sort.sort != Sort.day_change
                          ? styles.disabled
                          : ""
                      }`}
                    />
                  </span>
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  vs Community&nbsp; &nbsp;
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard &&
              leaderboard.map((lead: LeaderboardMetrics, index) => {
                return (
                  <tr key={lead.consolidation_key}>
                    <td className={styles.rank}>
                      {/* {lead.tdh_rank} */}
                      {numberWithCommas(index + 1 + (page - 1) * PAGE_SIZE)}
                    </td>
                    <td className="tw-max-w-[20px] tw-truncate">
                      <LeaderboardCollector
                        handle={lead.handle}
                        consolidationKey={lead.consolidation_key}
                        consolidationDisplay={lead.consolidation_display}
                        pfp={lead.pfp_url}
                        cicType={lead.cic_type}
                        level={lead.level}
                      />
                    </td>

                    <td className={styles.tdhSub}>{lead.level}</td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.balance)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.unique_memes)} /{" "}
                      {numberWithCommas(lead.unique_memes_total)} (
                      {Math.round(
                        (lead.unique_memes / lead.unique_memes_total) * 100
                      )}
                      %)
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.memes_cards_sets)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(Math.round(lead.boosted_tdh))}
                    </td>
                    <td className={styles.tdhSub}>
                      {!lead.day_change ? (
                        "-"
                      ) : (
                        <>
                          {lead.day_change > 0 ? `+` : ``}
                          {numberWithCommas(lead.day_change)}
                          {lead.day_change != 0 && (
                            <span className={styles.tdhBoost}>
                              {getTDHChange(lead)}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className={styles.tdhSub}>
                      {!lead.day_change
                        ? "-"
                        : `${calculateTdhVsCommunity(lead)}`}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Row>
      {totalResults > 0 && leaderboard && myFetchUrl && (
        <Row>
          <Col
            xs={12}
            sm={12}
            md={6}
            className="pt-4 pb-3 d-flex justify-content-center gap-4">
            <DownloadUrlWidget
              preview="Page"
              name={getFileName(page)}
              url={`${myFetchUrl}&include_primary_wallet=true&download_page=true`}
            />
            <DownloadUrlWidget
              preview="All Pages"
              name={getFileName()}
              url={`${myFetchUrl}&include_primary_wallet=true&download_all=true`}
            />
          </Col>
          {totalResults > PAGE_SIZE && (
            <Col
              xs={12}
              sm={12}
              md={6}
              className="pt-4 pb-3 d-flex justify-content-center">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                totalResults={totalResults}
                setPage={function (newPage: number) {
                  setPage(newPage);
                }}
              />
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
}
