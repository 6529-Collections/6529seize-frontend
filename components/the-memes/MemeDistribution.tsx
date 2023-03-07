import styles from "./TheMemes.module.scss";
import { Link } from "react-scroll";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Container, Row, Col, Table, Carousel } from "react-bootstrap";
import { MEMES_CONTRACT } from "../../constants";
import { DBResponse } from "../../entities/IDBResponse";
import Breadcrumb, { Crumb } from "../breadcrumb/Breadcrumb";
import { useRouter } from "next/router";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import {
  IDistribution,
  IDistributionPhoto,
} from "../../entities/IDistribution";
import ScrollToButton from "../scrollTo/ScrollToButton";

export default function MemeDistribution() {
  const router = useRouter();

  const [nftId, setNftId] = useState<string>();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);

  const [distributions, setDistributions] = useState<IDistribution[]>([]);
  const [distributionPhotos, setDistributionPhotos] = useState<
    IDistributionPhoto[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  function fetchDistribution(url: string) {
    fetchUrl(url).then((response: DBResponse) => {
      setLoaded(true);
      setDistributions((distr) => [...distr, ...response.data]);
      if (response.next) {
        fetchDistribution(response.next);
      }
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

  function printDistributionRow(phase: string, d: IDistribution) {
    return (
      <tr key={`${d.contract}-${d.card_id}-${d.phase}-${d.wallet}`}>
        <td>
          <a
            className={styles.distributionWalletLink}
            href={`/${d.wallet}`}
            target="_blank"
            rel="noreferrer">
            {d.wallet}
          </a>
        </td>
        <td className="text-center">{d.display}</td>
        <td className="text-center">{d.wallet_balance}</td>
        <td className="text-center">{d.wallet_tdh}</td>
        <td className="text-center">{d.phase}</td>
        <td className="text-center">{d.count}</td>
        {phase != "Airdrop" && (
          <td className="text-center">{d.mint_count ? d.mint_count : "-"}</td>
        )}
      </tr>
    );
  }

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
                {distributions.map((d) => printDistributionRow(phase, d))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }

  function printDistribution() {
    console.log("printing distribution");
    const uniquePhases = new Set([...distributions].map((d) => d.phase));
    const phases: { phase: string; distributions: IDistribution[] }[] = [];
    Array.from(uniquePhases).map((phase) => {
      const distr = distributions.filter((d) => d.phase == phase);
      phases.push({
        phase: phase,
        distributions: distr,
      });
    });
    return (
      <>
        <ScrollToButton
          threshhold={400}
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
            </Col>
          </Row>
        </Container>
        {phases.map((phase) =>
          printDistributionPhase(phase.phase, phase.distributions)
        )}
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
                    (distributionPhotos.length > 0 ||
                      distributions.length > 0) &&
                    printDistribution()}
                </Col>
              </Row>
              <Row>
                {loaded && distributions.length == 0 && (
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
    </>
  );
}
