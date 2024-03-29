import styles from "./Distribution.module.scss";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Container, Row, Col, Carousel, Table, Button } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import { useRouter } from "next/router";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import {
  DistributionPhase,
  IDistribution,
  IDistributionPhoto,
} from "../../entities/IDistribution";
import ScrollToButton from "../scrollTo/ScrollToButton";
import { capitalizeEveryWord, numberWithCommas } from "../../helpers/Helpers";
import Pagination from "../pagination/Pagination";
import { SortDirection } from "../../entities/ISort";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "../searchModal/SearchModal";
import DotLoader from "../dotLoader/DotLoader";
import Address from "../address/Address";

enum Sort {
  phase = "phase",
  card_mint_count = "card_mint_count",
  count = "count",
  wallet_tdh = "wallet_tdh",
  wallet_balance = "wallet_balance",
  wallet_unique_balance = "wallet_unique_balance",
}

interface Props {
  header: string;
  contract: string;
  link: string;
  minting_link: string;
}

export default function Distribution(props: Readonly<Props>) {
  const router = useRouter();
  const [pageProps, setPageProps] = useState<{
    page: number;
    pageSize: number;
  }>({ page: 1, pageSize: 150 });

  const [nftId, setNftId] = useState<string>();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [activePhase, setActivePhase] = useState("All");
  const [phases, setPhases] = useState<string[]>([]);
  const [distributions, setDistributions] = useState<IDistribution[]>([]);
  const [distributionsPhases, setDistributionsPhases] = useState<
    DistributionPhase[]
  >([]);
  const [distributionPhotos, setDistributionPhotos] = useState<
    IDistributionPhoto[]
  >([]);
  const [loaded, setLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  const [fetching, setFetching] = useState(false);

  const [sort, setSort] = useState<{
    sort: Sort;
    sort_direction: SortDirection;
  }>({ sort: Sort.phase, sort_direction: SortDirection.DESC });

  function fetchDistribution() {
    setFetching(true);
    const phasefilter = activePhase === "All" ? "" : `&phase=${activePhase}`;
    const walletFilter =
      searchWallets.length === 0 ? "" : `&wallet=${searchWallets.join(",")}`;
    // const distributionUrl = `${process.env.API_ENDPOINT}/api/distribution/${props.contract}/${nftId}?&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}${phasefilter}${walletFilter}`;
    const distributionUrl = `${process.env.API_ENDPOINT}/api/distributions?card_id=${nftId}&contract=${props.contract}&page=${pageProps.page}&sort=${sort.sort}&sort_direction=${sort.sort_direction}${walletFilter}`;
    fetchUrl(distributionUrl).then((r: DBResponse) => {
      setTotalResults(r.count);
      const mydistributions = r.data;
      setDistributions(mydistributions);
      const phases = [];
      if (mydistributions.some((d) => d.airdrop > 0)) {
        phases.push(DistributionPhase.AIRDROP);
      }
      if (mydistributions.some((d) => d.allowlist > 0)) {
        phases.push(DistributionPhase.ALLOWLIST);
      }
      if (mydistributions.some((d) => d.phase_0 > 0)) {
        phases.push(DistributionPhase.PHASE_0);
      }
      if (mydistributions.some((d) => d.phase_1 > 0)) {
        phases.push(DistributionPhase.PHASE_1);
      }
      if (mydistributions.some((d) => d.phase_2 > 0)) {
        phases.push(DistributionPhase.PHASE_2);
      }
      if (mydistributions.some((d) => d.phase_3 > 0)) {
        phases.push(DistributionPhase.PHASE_3);
      }
      setDistributionsPhases(phases);
      setFetching(false);
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
        { display: props.header, href: props.link },
        { display: `Card ${nftId}`, href: `${props.link}/${nftId}` },
        { display: `Distribution` },
      ]);

      const distributionPhotosUrl = `${process.env.API_ENDPOINT}/api/distribution_photos/${props.contract}/${nftId}`;

      fetchAllPages(distributionPhotosUrl).then((distributionPhotos: any[]) => {
        setDistributionPhotos(distributionPhotos);
        const distributionPhasesUrl = `${process.env.API_ENDPOINT}/api/distribution_phases/${props.contract}/${nftId}`;
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
              <Image
                priority
                width="0"
                height="0"
                src={dp.link}
                alt={dp.link}
              />
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
            <Col className={`d-flex justify-content-end align-items-center`}>
              <SearchWalletsDisplay
                searchWallets={searchWallets}
                setSearchWallets={setSearchWallets}
                setShowSearchModal={setShowSearchModal}
              />
            </Col>
          </Row>
        </Container>
        <Container>
          <Row className={styles.distributionsScrollContainer}>
            <Col>
              <Table className={styles.distributionsTable}>
                <thead>
                  <tr>
                    <th colSpan={2}></th>
                    <th
                      colSpan={distributionsPhases.length}
                      className="text-center">
                      ALLOWLIST SPOTS
                    </th>
                    <th colSpan={2} className="text-center">
                      ACTUAL
                    </th>
                  </tr>
                  <tr>
                    <th colSpan={2}>
                      Wallet{" "}
                      {fetching ? (
                        <DotLoader />
                      ) : (
                        <span className="font-larger">x{totalResults}</span>
                      )}
                    </th>
                    {distributionsPhases.map((p) => (
                      <th key={`${p}-header`} className="text-center">
                        {capitalizeEveryWord(p.replaceAll("_", " "))}
                      </th>
                    ))}
                    <th className="text-center">Minted</th>
                    <th className="text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d) => (
                    <tr key={`${d.wallet}`}>
                      <td className="font-smaller">{d.wallet}</td>
                      <td>
                        <Address
                          wallets={[d.wallet as `0x${string}`]}
                          display={d.display}
                          hideCopy={true}
                        />
                      </td>
                      {distributionsPhases.map((p) => (
                        <th
                          key={`${p}-${d.contract}-${d.card_id}`}
                          className="text-center">
                          {d[p] === 0 ? "-" : numberWithCommas(d[p])}
                        </th>
                      ))}
                      <td className="text-center">
                        {d.total_minted === 0
                          ? "-"
                          : numberWithCommas(d.total_minted)}
                      </td>
                      <td className="text-center">
                        {!d.total_minted && !d.airdrop
                          ? "-"
                          : numberWithCommas(d.total_minted + d.airdrop)}
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
                <Col className={`${styles.distributionHeader} pb-1`}>
                  <h1 className="text-center mb-0">
                    <span className="font-lightest">{props.header}</span> Card #
                    {nftId} Distribution
                  </h1>
                  <Button
                    className="seize-btn btn-white"
                    onClick={() => window.open(props.minting_link, "_blank")}>
                    Minting Page
                  </Button>
                </Col>
              </Row>
              {distributionPhotos.length > 0 && (
                <Row className="pt-4 pb-5">
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
                {loaded && phases.length === 0 && (
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
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
      />
    </>
  );
}
