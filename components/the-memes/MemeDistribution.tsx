import styles from "./TheMemes.module.scss";
import { Link } from "react-scroll";

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

const SearchModal = dynamic(() => import("../searchModal/SearchModal"), {
  ssr: false,
});

export default function MemeDistribution() {
  const router = useRouter();

  const [nftId, setNftId] = useState<string>();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [phases, setPhases] = useState<
    { phase: string; distributions: IDistribution[] }[]
  >([]);
  const [distributionPhotos, setDistributionPhotos] = useState<
    IDistributionPhoto[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  function fetchDistribution(url: string) {
    fetchAllPages(url).then((response: IDistribution[]) => {
      const uniquePhases = new Set([...response].map((d) => d.phase));

      const newPhases: { phase: string; distributions: IDistribution[] }[] = [];
      Array.from(uniquePhases).map((phase) => {
        const distr = response.filter((d) => d.phase == phase);
        console.log("distr", distr.length);
        newPhases.push({
          phase: phase,
          distributions: distr,
        });
      });
      setPhases(newPhases);
      setLoaded(true);
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
        const distributionUrl = `${process.env.API_ENDPOINT}/api/distribution/${MEMES_CONTRACT}/${nftId}`;
        fetchDistribution(distributionUrl);
      });
    }
  }, [nftId]);

  useEffect(() => {
    if (nftId && router.isReady) {
      let walletFilter = "";
      if (searchWallets) {
        walletFilter = `&wallet=${searchWallets.join(",")}`;
      }
      const distributionUrl = `${process.env.API_ENDPOINT}/api/distribution/${MEMES_CONTRACT}/${nftId}?${walletFilter}`;
      setPhases([]);
      fetchDistribution(distributionUrl);
    }
  }, [searchWallets, router.isReady]);

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

  function printDistributionRow(phase: string, d: IDistribution) {}

  function printDistributionPhase(
    phase: string,
    distributions: IDistribution[]
  ) {
    return (
      <Container className="pt-4 pb-4" key={phase}>
        <Row>
          <Col>
            <h4>{phase}</h4>
          </Col>
        </Row>
        <Row className={`${styles.distributionsScrollContainer}`}>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 12 }}
            md={{ span: 12 }}
            lg={{ span: 12 }}>
            <Table
              bordered={false}
              className={styles.distributionsTable}
              id={`${phase}-table`}>
              {" "}
              <thead>
                <tr>
                  <th colSpan={2}>Wallet </th>
                  <th className="text-center">Card Balance</th>
                  <th className="text-center">TDH</th>
                  <th className="text-center">Phase</th>
                  {phase == "Airdrop" ? (
                    <th className="text-center">Count</th>
                  ) : (
                    <>
                      <th className="text-center">Available</th>
                      <th className="text-center">Used</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {distributions.map((d) => {
                  const reservedDisplay = areEqualAddresses(
                    d.wallet,
                    SIX529_MUSEUM
                  )
                    ? "6529Museum"
                    : areEqualAddresses(d.wallet, MANIFOLD)
                    ? "Manifold Minting Wallet"
                    : null;
                  const display =
                    reservedDisplay && !d.display ? reservedDisplay : d.display;
                  return (
                    <tr
                      key={`${d.contract}-${d.card_id}-${d.phase}-${d.wallet}`}>
                      <td>
                        <a
                          className={styles.distributionWalletLink}
                          href={`/${d.wallet}`}
                          target="_blank"
                          rel="noreferrer">
                          {d.wallet}
                        </a>
                      </td>
                      <td className="text-center">{display}</td>
                      <td className="text-center">
                        {d.wallet_balance
                          ? numberWithCommas(d.wallet_balance)
                          : "-"}
                      </td>
                      <td className="text-center">
                        {d.wallet_tdh ? numberWithCommas(d.wallet_tdh) : "-"}
                      </td>
                      <td className="text-center">{d.phase}</td>
                      <td className="text-center">
                        {numberWithCommas(d.count)}
                      </td>
                      {phase != "Airdrop" && (
                        <td className="text-center">
                          {d.mint_count ? numberWithCommas(d.mint_count) : "-"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }

  function printDistribution() {
    console.log("printing distribution");
    return (
      <>
        <ScrollToButton
          threshhold={500}
          to="distribution-header"
          offset={-200}
        />
        <Container className="pt-2 pb-5">
          <Row>
            <Col>{printDistributionPhotos()}</Col>
          </Row>
        </Container>
        <Container className="pt-3 pb-3">
          <Row>
            <Col className="text-center">
              {phases.map((phase) => (
                <Link
                  key={phase.phase}
                  className={styles.distributionPhaseLink}
                  activeClass="active"
                  to={`${phase.phase}-table`}
                  smooth={true}
                  offset={-60}
                  duration={250}>
                  {phase.phase}
                </Link>
              ))}
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
            </Col>
          </Row>
        </Container>
        {phases.map((phase) => {
          return (
            <Container className="pt-4 pb-4" key={phase.phase}>
              <Row>
                <Col>
                  <h4>{phase.phase}</h4>
                </Col>
              </Row>
              <Row className={`${styles.distributionsScrollContainer}`}>
                <Col
                  xs={{ span: 12 }}
                  sm={{ span: 12 }}
                  md={{ span: 12 }}
                  lg={{ span: 12 }}>
                  <table
                    className={styles.distributionsTable}
                    id={`${phase}-table`}>
                    <thead>
                      <tr>
                        <th colSpan={2}>Wallet </th>
                        <th className="text-center">Card Balance</th>
                        <th className="text-center">TDH</th>
                        <th className="text-center">Phase</th>
                        {phase.phase == "Airdrop" ? (
                          <th className="text-center">Count</th>
                        ) : (
                          <>
                            <th className="text-center">Available</th>
                            <th className="text-center">Used</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {phase.distributions.map((d) => {
                        const reservedDisplay = areEqualAddresses(
                          d.wallet,
                          SIX529_MUSEUM
                        )
                          ? "6529Museum"
                          : areEqualAddresses(d.wallet, MANIFOLD)
                          ? "Manifold Minting Wallet"
                          : null;
                        const display =
                          reservedDisplay && !d.display
                            ? reservedDisplay
                            : d.display;
                        return (
                          <tr
                            key={`${d.contract}-${d.card_id}-${d.phase}-${d.wallet}`}>
                            <td>
                              <a
                                className={styles.distributionWalletLink}
                                href={`/${d.wallet}`}
                                target="_blank"
                                rel="noreferrer">
                                {d.wallet}
                              </a>
                            </td>
                            <td className="text-center">{display}</td>
                            <td className="text-center">
                              {d.wallet_balance
                                ? numberWithCommas(d.wallet_balance)
                                : "-"}
                            </td>
                            <td className="text-center">
                              {d.wallet_tdh
                                ? numberWithCommas(d.wallet_tdh)
                                : "-"}
                            </td>
                            <td className="text-center">{d.phase}</td>
                            <td className="text-center">
                              {numberWithCommas(d.count)}
                            </td>
                            {phase.phase != "Airdrop" && (
                              <td className="text-center">
                                {d.mint_count
                                  ? numberWithCommas(d.mint_count)
                                  : "-"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Col>
              </Row>
            </Container>
          );
        })}
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
                  <h1 id={`distribution-header`}>
                    MEME CARD #{nftId} DISTRIBUTION
                  </h1>
                </Col>
              </Row>
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
