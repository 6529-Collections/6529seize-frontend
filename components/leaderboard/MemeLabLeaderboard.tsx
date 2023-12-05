import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { TDHCalc } from "../../entities/ITDH";
import styles from "./Leaderboard.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { areEqualAddresses, numberWithCommas } from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
import { Owner, OwnerTags } from "../../entities/IOwner";
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
  card_balance = "balance",
}

export default function MemeLabLeaderboard(props: Readonly<Props>) {
  const router = useRouter();
  const [pageProps, setPageProps] = useState<Props>(props);
  const [totalResults, setTotalResults] = useState(0);
  const [leaderboard, setLeaderboard] = useState<Owner[]>();
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [lastTDH, setLastTDH] = useState<TDHCalc>();
  const [next, setNext] = useState(null);
  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.card_balance, sort_direction: SortDirection.DESC });

  const [ownerTags, setOwnersTags] = useState<OwnerTags[]>([]);
  const [ownerTagsLoaded, setOwnerTagsLoaded] = useState(false);

  async function fetchResults() {
    fetchUrl(
      `${process.env.API_ENDPOINT}/api/owners_memelab?id=${props.nftId}&page_size=${props.pageSize}&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}`
    ).then((response: DBResponse) => {
      setTotalResults(response.count);
      setNext(response.next);
      setLeaderboard(response.data);
      setLeaderboardLoaded(true);
    });
  }

  useEffect(() => {
    async function fetchOwnersTags(url: string) {
      return fetchAllPages(url).then((newOwnersTags: OwnerTags[]) => {
        setOwnersTags(newOwnersTags);
        setOwnerTagsLoaded(true);
      });
    }

    if (leaderboard && router.isReady && leaderboard.length > 0) {
      const uniqueWallets = [...leaderboard].map((l) => l.wallet);
      const initialUrlOwners = `${
        process.env.API_ENDPOINT
      }/api/owners_tags?wallet=${uniqueWallets.join(",")}`;
      fetchOwnersTags(initialUrlOwners);
    }
  }, [router.isReady, leaderboard]);

  useEffect(() => {
    if (pageProps.page === 1) {
      fetchResults();
    } else {
      setPageProps({ ...pageProps, page: 1 });
    }
  }, [sort]);

  useEffect(() => {
    fetchResults();
  }, [pageProps.page]);

  function getDisplay(lead: any) {
    if (lead.handle) {
      return lead.handle;
    }
    if (lead.consolidation_display) {
      return lead.consolidation_display;
    }
    return lead.wallet_display;
  }

  function getDisplayEns(lead: any) {
    if (!lead.handle) {
      return;
    }
    if (lead.wallet_display?.includes(" ")) {
      return;
    }

    if (lead.wallet_display?.endsWith(".eth")) {
      return lead.wallet_display;
    }

    if (lead.consolidation_display?.includes(" ")) {
      return;
    }
    if (lead.consolidation_display?.endsWith(".eth")) {
      return lead.consolidation_display;
    }
    return;
  }

  return (
    <Container className={`no-padding`} id={`leaderboard-${props.nftId}`}>
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
            <Table bordered={false} className={styles.memeLabLeaderboardTable}>
              <thead>
                <tr>
                  <th className={styles.memeLabRank}>Rank</th>
                  <th className={styles.memeLabHodler}>Collector</th>
                  <th className={`${styles.memeLabBalance} text-center`}>
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
                </tr>
                <tr className={styles.gap}></tr>
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
                          {index +
                            1 +
                            (pageProps.page - 1) * pageProps.pageSize}
                        </td>
                        <td className={styles.hodlerContainer}>
                          <div className={styles.hodler}>
                            <Address
                              wallets={[lead.wallet]}
                              display={getDisplay(lead)}
                              displayEns={getDisplayEns(lead)}
                              tags={{
                                memesCardsSets: tags
                                  ? tags.memes_cards_sets
                                  : 0,
                                memesCardsSetS1: tags
                                  ? tags.memes_cards_sets_szn1
                                  : 0,
                                memesCardsSetS2: tags
                                  ? tags.memes_cards_sets_szn2
                                  : 0,
                                memesCardsSetS3: tags
                                  ? tags.memes_cards_sets_szn3
                                  : 0,
                                memesCardsSetS4: tags
                                  ? tags.memes_cards_sets_szn4
                                  : 0,
                                memesCardsSetS5: tags
                                  ? tags.memes_cards_sets_szn5
                                  : 0,
                                memesBalance: tags ? tags.unique_memes : 0,
                                gradientsBalance: tags
                                  ? tags.gradients_balance
                                  : 0,
                                genesis: tags ? tags.genesis : 0,
                              }}
                            />
                          </div>
                        </td>
                        <td className={styles.tdhSub}>
                          {numberWithCommas(lead.balance)}
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
      {leaderboardLoaded && leaderboard?.length === 0 && (
        <Row>
          <Col>No TDH accrued</Col>
        </Row>
      )}
    </Container>
  );
}
