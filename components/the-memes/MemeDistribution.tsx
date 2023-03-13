import styles from "./TheMemes.module.scss";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Container, Row, Col, Carousel, Table } from "react-bootstrap";
import { MANIFOLD, MEMES_CONTRACT, SIX529_MUSEUM } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import { useRouter } from "next/router";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import {
  IDistribution,
  IDistributionPhoto,
} from "../../entities/IDistribution";
import ScrollToButton from "../scrollTo/ScrollToButton";
import { areEqualAddresses, numberWithCommas } from "../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";

const SearchModal = dynamic(() => import("../searchModal/SearchModal"), {
  ssr: false,
});

enum Sort {
  phase = "phase",
  mint_count = "mint_count",
  count = "count",
  wallet_tdh = "wallet_tdh",
  wallet_balance = "wallet_balance",
  wallet_unique_balance = "wallet_unique_balance",
}

export default function MemeDistribution() {
  const router = useRouter();
  const [pageProps, setPageProps] = useState<{
    page: number;
    pageSize: number;
  }>({ page: 1, pageSize: 250 });

  const [nftId, setNftId] = useState<string>();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [activePhase, setActivePhase] = useState("All");
  const [phases, setPhases] = useState<string[]>([]);
  const [distributions, setDistributions] = useState<IDistribution[]>([]);
  const [distributionPhotos, setDistributionPhotos] = useState<
    IDistributionPhoto[]
  >([]);
  const [loaded, setLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.phase, sort_direction: SortDirection.DESC });

  function fetchDistribution() {
    const phasefilter = activePhase == "All" ? "" : `&phase=${activePhase}`;
    const walletFilter =
      searchWallets.length == 0 ? "" : `&wallet=${searchWallets.join(",")}`;
    const distributionUrl = `${process.env.API_ENDPOINT}/api/distribution/${MEMES_CONTRACT}/${nftId}?&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}${phasefilter}${walletFilter}`;

    fetchUrl(distributionUrl).then((r: DBResponse) => {
      setTotalResults(r.count);
      setDistributions(r.data);
    });
  }

  useEffect(() => {
    if (router.isReady) {
      if (router.query.id) {
        setNftId(router.query.id as string);
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    if (nftId) {
      setBreadcrumbs([
        { display: "Home", href: "/" },
        { display: "The Memes", href: "/the-memes" },
        { display: `Card ${nftId}`, href: `/the-memes/${nftId}` },
        { display: `Distribution` },
      ]);

      const distributionPhotosUrl = `${process.env.API_ENDPOINT}/api/distribution_photos/${MEMES_CONTRACT}/${nftId}`;

      fetchAllPages(distributionPhotosUrl).then((distributionPhotos: any[]) => {
        setDistributionPhotos(distributionPhotos);
        const distributionPhasesUrl = `${process.env.API_ENDPOINT}/api/distribution_phases/${MEMES_CONTRACT}/${nftId}`;
        fetchUrl(distributionPhasesUrl).then((result: DBResponse) => {
          setPhases(result.data);
          setLoaded(true);
        });
        fetchDistribution();
      });
    }
  }, [nftId]);

  useEffect(() => {
    if (nftId) {
      setPageProps({ ...pageProps, page: 1 });
    }
  }, [activePhase, searchWallets, sort]);

  useEffect(() => {
    if (nftId && pageProps) {
      fetchDistribution();
    }
  }, [pageProps]);

  function printDistributionPhotos() {
    if (distributionPhotos.length > 0) {
      return (
        <Carousel
          interval={null}
          wrap={false}
          touch={true}
          fade={true}
          className={styles.distributionCarousel}>
          {distributionPhotos.map((dp) => (
            <Carousel.Item key={dp.id}>
              <Image width="0" height="0" src={dp.link} alt={dp.link} />
            </Carousel.Item>
          ))}
        </Carousel>
      );
    }
  }

  function printDistribution() {
    return (
      <>
        <ScrollToButton threshhold={500} to="distribution-table" offset={0} />
        <Container className="pt-5 pb-3" id={`distribution-table`}>
          <Row>
            <Col
              className={styles.leaderboardNavigationLeft}
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 8 }}
              lg={{ span: 8 }}>
              <span
                onClick={() => {
                  setActivePhase("All");
                }}
                className={`${styles.distributionPhaseLink} ${
                  "All" == activePhase ? styles.distributionPhaseLinkActive : ""
                }`}>
                All
              </span>
              {phases.map((phase) => (
                <span
                  key={phase}
                  onClick={() => {
                    setActivePhase(phase);
                  }}
                  className={`${styles.distributionPhaseLink} ${
                    phase == activePhase
                      ? styles.distributionPhaseLinkActive
                      : ""
                  }`}>
                  {phase}
                </span>
              ))}
            </Col>
            <Col
              className={styles.leaderboardNavigationRight}
              xs={{ span: 12 }}
              sm={{ span: 12 }}
              md={{ span: 4 }}
              lg={{ span: 4 }}>
              <span>
                {searchWallets.length > 0 && (
                  <span className={styles.clearSearchText}>
                    search: {searchWallets.length} wallet
                    {searchWallets.length > 1 ? `s` : ``}{" "}
                  </span>
                )}
                <span
                  onClick={() => setShowSearchModal(true)}
                  className={`${styles.searchBtn} ${
                    searchWallets.length > 0 ? styles.searchBtnActive : ""
                  } d-inline-flex align-items-center justify-content-center`}>
                  {" "}
                  <FontAwesomeIcon
                    className={styles.searchBtnIcon}
                    icon="search"></FontAwesomeIcon>
                </span>
                {searchWallets.length > 0 && (
                  <span
                    className={styles.distributionPhaseLink}
                    onClick={() => setSearchWallets([])}>
                    {" "}
                    clear
                  </span>
                )}
              </span>
            </Col>
          </Row>
        </Container>
        <Container>
          <Row className={styles.distributionsScrollContainer}>
            <Col>
              <Table className={styles.distributionsTable}>
                <thead>
                  <tr>
                    <th colSpan={2}>
                      Wallet{" "}
                      <span className={styles.totalResults}>
                        x{totalResults}
                      </span>
                    </th>
                    <th className="text-center">
                      Cards&nbsp;
                      <span
                        className={`${styles.distributionsCaretWrapper} d-flex flex-column`}>
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.wallet_balance,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.wallet_balance
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.wallet_balance,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.wallet_balance
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                      </span>
                    </th>
                    <th className="text-center">
                      Unique&nbsp;
                      <span
                        className={`${styles.distributionsCaretWrapper} d-flex flex-column`}>
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.wallet_unique_balance,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.wallet_unique_balance
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.wallet_unique_balance,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.wallet_unique_balance
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                      </span>
                    </th>
                    <th className="text-center">
                      TDH&nbsp;
                      <span
                        className={`${styles.distributionsCaretWrapper} d-flex flex-column`}>
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.wallet_tdh,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.wallet_tdh
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.wallet_tdh,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.wallet_tdh
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                      </span>
                    </th>
                    <th className="text-center">
                      Phase&nbsp;
                      <span
                        className={`${styles.distributionsCaretWrapper} d-flex flex-column`}>
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.phase,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.phase
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.phase,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.phase
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                      </span>
                    </th>
                    <th className="text-center">
                      Count&nbsp;
                      <span
                        className={`${styles.distributionsCaretWrapper} d-flex flex-column`}>
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.count,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.count
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.count,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.count
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                      </span>
                    </th>
                    <th className="text-center">
                      Minted&nbsp;
                      <span
                        className={`${styles.distributionsCaretWrapper} d-flex flex-column`}>
                        <FontAwesomeIcon
                          icon="square-caret-up"
                          onClick={() =>
                            setSort({
                              sort: Sort.mint_count,
                              sort_direction: SortDirection.ASC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.ASC ||
                            sort.sort != Sort.mint_count
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                        <FontAwesomeIcon
                          icon="square-caret-down"
                          onClick={() =>
                            setSort({
                              sort: Sort.mint_count,
                              sort_direction: SortDirection.DESC,
                            })
                          }
                          className={`${styles.distributionsCaret} ${
                            sort.sort_direction != SortDirection.DESC ||
                            sort.sort != Sort.mint_count
                              ? styles.distributionsCaretDisabled
                              : ""
                          }`}
                        />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d) => (
                    <tr
                      key={`${d.contract}-${d.card_id}-${d.phase}-${d.wallet}}`}>
                      <td className={styles.distributionsTableWallet}>
                        {d.wallet}
                      </td>
                      <td className="text-center">{d.display}</td>
                      <td className="text-center">
                        {d.wallet_balance
                          ? numberWithCommas(d.wallet_balance)
                          : "-"}
                      </td>
                      <td className="text-center">
                        {d.wallet_unique_balance
                          ? numberWithCommas(d.wallet_unique_balance)
                          : "-"}
                      </td>
                      <td className="text-center">
                        {d.wallet_tdh ? numberWithCommas(d.wallet_tdh) : "-"}
                      </td>
                      <td className="text-center">{d.phase}</td>
                      <td className="text-center">
                        {numberWithCommas(d.count)}
                      </td>
                      <td className="text-center">
                        {d.phase == "Airdrop" || !d.mint_count
                          ? "-"
                          : d.mint_count == 0
                          ? d.mint_count
                          : numberWithCommas(d.mint_count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Container>
      </>
    );
  }

  return (
    <>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <Container fluid className={styles.mainContainer}>
        <Row>
          <Col>
            <Container className="pt-4 pb-4">
              <Row>
                <Col>
                  <h1>MEME CARD #{nftId} DISTRIBUTION</h1>
                </Col>
              </Row>
              {distributionPhotos.length > 0 && (
                <Row className="pt-2 pb-5">
                  <Col>{printDistributionPhotos()}</Col>
                </Row>
              )}
              <Row>
                <Col>
                  {nftId &&
                    (distributionPhotos.length > 0 || phases.length > 0) &&
                    printDistribution()}
                </Col>
              </Row>
              <Row>
                {loaded && phases.length == 0 && (
                  <Col>
                    <Image
                      loading={"lazy"}
                      width="0"
                      height="0"
                      style={{ height: "auto", width: "100px" }}
                      src="/SummerGlasses.svg"
                      alt="SummerGlasses"
                    />{" "}
                    Nothing here yet
                  </Col>
                )}
              </Row>
            </Container>
          </Col>
        </Row>
        {totalResults > pageProps.pageSize && (
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
      <SearchModal
        show={showSearchModal}
        searchWallets={searchWallets}
        setShow={function (show: boolean) {
          setShowSearchModal(show);
        }}
        addSearchWallet={function (newW: string) {
          setSearchWallets((searchWallets) => [...searchWallets, newW]);
        }}
        removeSearchWallet={function (removeW: string) {
          setSearchWallets([...searchWallets].filter((sw) => sw != removeW));
        }}
        clearSearchWallets={function () {
          setSearchWallets([]);
        }}
      />
    </>
  );
}
