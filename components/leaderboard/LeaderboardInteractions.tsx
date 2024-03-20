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
  seasons: MemeSeason[];
  setIsLoading: (isLoading: boolean) => void;
}

enum Sort {
  "primary_purchases_count" = "primary_purchases_count",
  "primary_purchases_value" = "primary_purchases_value",
  "secondary_purchases_count" = "secondary_purchases_count",
  "secondary_purchases_value" = "secondary_purchases_value",
  "sales_count" = "sales_count",
  "sales_value" = "sales_value",
  "transfers_in" = "transfers_in",
  "transfers_out" = "transfers_out",
  "airdrops" = "airdrops",
  "burns" = "burns",
}

export interface LeaderboardInteractions {
  handle: string;
  consolidation_key: string;
  consolidation_display: string;
  pfp_url: string;
  rep_score: number;
  cic_score: number;
  boosted_tdh: number;
  day_change: number;
  level: number;
  primary_purchases_count: number;
  primary_purchases_value: number;
  secondary_purchases_count: number;
  secondary_purchases_value: number;
  sales_count: number;
  sales_value: number;
  transfers_in: number;
  transfers_out: number;
  airdrops: number;
  burns: number;
  cic_type?: CICType;
}

export default function LeaderboardInteractions(props: Readonly<Props>) {
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardInteractions[]>();
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({
    sort: Sort.primary_purchases_count,
    sort_direction: SortDirection.DESC,
  });

  const [myFetchUrl, setMyFetchUrl] = useState<string>("");

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
    props.setIsLoading(true);
    let walletFilter = "";
    if (props.searchWallets && props.searchWallets.length > 0) {
      walletFilter = `&search=${props.searchWallets.join(",")}`;
    }
    let url = `aggregated-activity`;
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
      data: LeaderboardInteractions[];
    }>({
      endpoint: url,
    }).then((response) => {
      setTotalResults(response.count);
      response.data.forEach((lead: LeaderboardInteractions) => {
        lead.cic_type = cicToType(lead.cic_score);
      });
      setLeaderboard(response.data);
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

  function printHeader(s: Sort) {
    return (
      <span className="d-flex flex-column">
        <FontAwesomeIcon
          icon="square-caret-up"
          onClick={() =>
            setSort({
              sort: s,
              sort_direction: SortDirection.ASC,
            })
          }
          className={`${styles.caret} ${
            sort.sort_direction != SortDirection.ASC || sort.sort != s
              ? styles.disabled
              : ""
          }`}
        />
        <FontAwesomeIcon
          icon="square-caret-down"
          onClick={() =>
            setSort({
              sort: s,
              sort_direction: SortDirection.DESC,
            })
          }
          className={`${styles.caret} ${
            sort.sort_direction != SortDirection.DESC || sort.sort != s
              ? styles.disabled
              : ""
          }`}
        />
      </span>
    );
  }

  return (
    <Container>
      <Row>
        <Col></Col>
        <Table bordered={false} className={styles.leaderboardTable}>
          <thead>
            <tr>
              <th colSpan={2}></th>
              <th colSpan={2} className={`text-center ${styles.borderBottom}`}>
                Primary Purchases
              </th>
              <th className={styles.gap}></th>
              <th colSpan={2} className={`text-center ${styles.borderBottom}`}>
                Secondary Purchases
              </th>
              <th className={styles.gap}></th>
              <th colSpan={2} className={`text-center ${styles.borderBottom}`}>
                Sales
              </th>
              <th className={styles.gap}></th>
              <th colSpan={4} className={`text-center ${styles.borderBottom}`}>
                Transfers
              </th>
            </tr>
            <tr>
              <th className={styles.rank}>Rank</th>
              <th className={`${styles.hodlerContainer}`}>
                Collector&nbsp;&nbsp;
                <span className={styles.totalResults}>
                  x{totalResults.toLocaleString()}
                </span>
              </th>
              {/* primary purchases */}
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Count&nbsp;
                  {printHeader(Sort.primary_purchases_count)}
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Value&nbsp;
                  {printHeader(Sort.primary_purchases_value)}
                </span>
              </th>
              <th className={styles.gap}></th>
              {/* secondary purchases */}
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Count&nbsp;
                  {printHeader(Sort.secondary_purchases_count)}
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Value&nbsp;
                  {printHeader(Sort.secondary_purchases_value)}
                </span>
              </th>
              <th className={styles.gap}></th>
              {/* sales */}
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Count&nbsp;
                  {printHeader(Sort.sales_count)}
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Value&nbsp;
                  {printHeader(Sort.sales_value)}
                </span>
              </th>
              <th className={styles.gap}></th>
              {/* transfers */}
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Airdrops&nbsp;
                  {printHeader(Sort.airdrops)}
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  In&nbsp;
                  {printHeader(Sort.transfers_in)}
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Out&nbsp;
                  {printHeader(Sort.transfers_out)}
                </span>
              </th>
              <th className={styles.tdhSub}>
                <span className="d-flex align-items-center justify-content-center">
                  Burns&nbsp;
                  {printHeader(Sort.burns)}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard &&
              leaderboard.map((lead: LeaderboardInteractions, index) => {
                return (
                  <tr key={lead.consolidation_key}>
                    <td className={styles.rank}>
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
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.primary_purchases_count)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(
                        Math.round(lead.primary_purchases_value * 100) / 100
                      )}
                    </td>
                    <th className={styles.gap}></th>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.secondary_purchases_count)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(
                        Math.round(lead.secondary_purchases_value * 100) / 100
                      )}
                    </td>
                    <th className={styles.gap}></th>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.sales_count)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(
                        Math.round(lead.sales_value * 100) / 100
                      )}
                    </td>
                    <th className={styles.gap}></th>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.airdrops)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.transfers_in)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.transfers_out)}
                    </td>
                    <td className={styles.tdhSub}>
                      {numberWithCommas(lead.burns)}
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
