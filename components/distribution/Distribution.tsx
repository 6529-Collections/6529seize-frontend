"use client";

import Address from "@/components/address/Address";
import DotLoader from "@/components/dotLoader/DotLoader";
import MemePageMintCountdown from "@/components/mint-countdown-box/MemePageMintCountdown";
import NotFound from "@/components/not-found/NotFound";
import Pagination from "@/components/pagination/Pagination";
import ScrollToButton from "@/components/scrollTo/ScrollToButton";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "@/components/searchModal/SearchModal";
import UpcomingMemePage from "@/components/the-memes/UpcomingMemePage";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { Distribution, DistributionPhoto } from "@/entities/IDistribution";
import {
  areEqualAddresses,
  capitalizeEveryWord,
  isValidPositiveInteger,
  numberWithCommas,
} from "@/helpers/Helpers";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Carousel, Col, Container, Row, Table } from "react-bootstrap";
import styles from "./Distribution.module.scss";

interface Props {
  header: string;
  contract: string;
  link: string;
}

export default function DistributionPage(props: Readonly<Props>) {
  const params = useParams();
  const { setTitle } = useTitle();
  const [pageProps, setPageProps] = useState<{
    page: number;
    pageSize: number;
  }>({ page: 1, pageSize: 150 });

  const [nftId, setNftId] = useState<string>();
  const [isValidNftId, setIsValidNftId] = useState(false);

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [distributionsPhases, setDistributionsPhases] = useState<string[]>([]);
  const [distributionPhotos, setDistributionPhotos] = useState<
    DistributionPhoto[]
  >([]);

  const [totalResults, setTotalResults] = useState(0);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  const [fetching, setFetching] = useState(true);

  function updateDistributionPhases(mydistributions: Distribution[]) {
    const phasesSet = new Set<string>();
    mydistributions.forEach((d) => {
      d.phases.forEach((p) => {
        phasesSet.add(p);
      });
    });
    const phases = Array.from(phasesSet);
    phases.sort((a, b) => a.localeCompare(b));
    setDistributionsPhases(phases);
  }

  async function fetchDistribution() {
    setFetching(true);
    const walletFilter =
      searchWallets.length === 0 ? "" : `&search=${searchWallets.join(",")}`;
    const distributionUrl = `${publicEnv.API_ENDPOINT}/api/distributions?card_id=${nftId}&contract=${props.contract}&page=${pageProps.page}${walletFilter}`;
    try {
      const r = await fetchUrl<DBResponse>(distributionUrl);
      setTotalResults(r.count);
      const mydistributions: Distribution[] = r.data;
      setDistributions(mydistributions);
      updateDistributionPhases(mydistributions);
    } catch (error) {
      console.error(
        `Failed to fetch distribution data for NFT ${nftId} on contract ${props.contract}`,
        error
      );
      setTotalResults(0);
      setDistributions([]);
      setDistributionsPhases([]);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    const isValid = isValidPositiveInteger(params?.["id"] as string);
    const id = isValid ? (params?.["id"] as string) : "";
    setIsValidNftId(isValid);
    setNftId(id);
  }, [params]);

  useEffect(() => {
    if (isValidNftId && nftId) {
      setTitle(`${props.header} #${nftId} | DISTRIBUTION`);
    }
  }, [isValidNftId, nftId, props.header, setTitle]);

  useEffect(() => {
    if (nftId) {
      const distributionPhotosUrl = `${publicEnv.API_ENDPOINT}/api/distribution_photos/${props.contract}/${nftId}`;

      const loadPhotosAndDistribution = async () => {
        try {
          const photos = await fetchAllPages<DistributionPhoto>(
            distributionPhotosUrl
          );
          setDistributionPhotos(photos);
        } catch (error) {
          console.error(
            `Failed to fetch distribution photos for NFT ${nftId}`,
            error
          );
          setDistributionPhotos([]);
        } finally {
          fetchDistribution();
        }
      };

      loadPhotosAndDistribution();
    }
  }, [nftId]);

  useEffect(() => {
    if (nftId) {
      setPageProps({ ...pageProps, page: 1 });
    }
  }, [searchWallets]);

  useEffect(() => {
    if (nftId && pageProps) {
      fetchDistribution();
    }
  }, [pageProps]);

  function printDistributionPhotos() {
    if (distributionPhotos.length > 0) {
      return (
        <Row className="pt-4 pb-5">
          <Col>
            <Carousel
              interval={null}
              wrap={false}
              touch={true}
              fade={true}
              className={styles["distributionCarousel"]}
            >
              {distributionPhotos.map((dp, index) => (
                <Carousel.Item key={dp.id}>
                  <Image
                    unoptimized
                    priority={index === 0}
                    width={0}
                    height={0}
                    src={dp.link}
                    alt={dp.link}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>
        </Row>
      );
    }
    return <></>;
  }

  function getCountForPhase(d: Distribution, phase: string) {
    let count = 0;

    if (phase.toUpperCase() === "AIRDROP") {
      count = d.airdrops;
    } else {
      const p = d.allowlist.find((a) => a.phase === phase);
      count = p?.spots ?? 0;
    }

    return count ? numberWithCommas(count) : "-";
  }

  function getSpotsForPhase(d: Distribution, phase: string) {
    if (phase.toUpperCase() === "AIRDROP") {
      return null;
    }
    const p = d.allowlist.find((a) => a.phase === phase);
    const count = p?.spots ?? 0;
    if (count > 0) {
      const spotsAirdrop = p?.spots_airdrop ?? 0;
      const spotsAllowlist = p?.spots_allowlist ?? 0;

      if (!spotsAirdrop && !spotsAllowlist) {
        return null;
      }

      return (
        <span className="tw-text-sm tw-text-iron-400">
          {spotsAirdrop > 0 ? numberWithCommas(spotsAirdrop) : "0"}
          {" | "}
          {spotsAllowlist > 0 ? numberWithCommas(spotsAllowlist) : "0"}
        </span>
      );
    }
    return null;
  }

  function printDistribution() {
    return (
      <>
        <ScrollToButton threshold={500} to="distribution-table" offset={0} />
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
          <Row className={styles["distributionsScrollContainer"]}>
            <Col className="no-padding">
              <Table className={styles["distributionsTable"]}>
                <thead>
                  <tr>
                    <th colSpan={2}></th>
                    <th
                      colSpan={distributionsPhases.length}
                      className="text-center"
                    >
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
                        <span className="font-larger">
                          x{totalResults.toLocaleString()}
                        </span>
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
                          display={d.wallet_display}
                          hideCopy={true}
                        />
                      </td>
                      {distributionsPhases.map((p) => (
                        <td key={`${p}-${d.wallet}`} className="text-center">
                          {getCountForPhase(d, p)}&nbsp;&nbsp;
                          {getSpotsForPhase(d, p)}
                        </td>
                      ))}
                      <td className="text-center">
                        {d.minted === 0 ? "-" : numberWithCommas(d.minted)}
                      </td>
                      <td className="text-center">
                        {!d.total_count ? "-" : numberWithCommas(d.total_count)}
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

  function printMintingLink() {
    if (
      areEqualAddresses(props.contract, MEMES_CONTRACT) &&
      isValidNftId &&
      nftId
    ) {
      return <MemePageMintCountdown nft_id={Number.parseInt(nftId, 10)} />;
    }

    return <></>;
  }

  function printEmpty() {
    return (
      <Row>
        {nftId && (
          <Col xs={12}>
            <UpcomingMemePage id={nftId} />
          </Col>
        )}
        <Col xs={12}>
          <Image
            unoptimized
            loading="eager"
            width={0}
            height={0}
            style={{ height: "auto", width: "100px" }}
            src="/SummerGlasses.svg"
            alt="SummerGlasses"
          />{" "}
          The Distribution Plan will be made available soon!
        </Col>
        <Col xs={12}>
          Please check back later and make sure to also check the{" "}
          <a
            href="https://x.com/6529Collections"
            target="_blank"
            rel="noopener noreferrer"
          >
            &#64;6529Collections
          </a>{" "}
          account on X for drop updates.
        </Col>
      </Row>
    );
  }

  function printNotFound() {
    return (
      <Row>
        <Col xs={12}>No results found for the search criteria.</Col>
      </Row>
    );
  }

  if (!isValidNftId) {
    return <NotFound label="DISTRIBUTION" />;
  }

  return (
    <>
      <Container
        fluid
        className={`${styles["mainContainer"]} tw-pb-10 tw-pt-6`}
      >
        <Row>
          <Col>
            <Container>
              <Row>
                <Col className={`${styles["distributionHeader"]} pb-1`}>
                  <h1 className="text-center mb-0">
                    {props.header} Card #{nftId} Distribution
                  </h1>
                  {printMintingLink()}
                </Col>
              </Row>
              {printDistributionPhotos()}
              <Row>
                <Col>
                  {nftId &&
                    (distributions.length > 0 || searchWallets.length > 0) &&
                    printDistribution()}
                </Col>
              </Row>
              {!fetching && distributions.length === 0 && (
                <>{searchWallets.length > 0 ? printNotFound() : printEmpty()}</>
              )}
              {distributions.length > 0 && (
                <Row>
                  <Col>
                    <span className="tw-text-sm tw-text-iron-400">
                      * Note: Each column shows the total allowlist spots for
                      that phase. The breakdown next to it displays: airdrops
                      from subscriptions | allowlist spots for mint.
                    </span>
                  </Col>
                </Row>
              )}
              {totalResults > pageProps.pageSize && (
                <Row className="text-center pt-4">
                  <Col>
                    <Pagination
                      page={pageProps.page}
                      pageSize={pageProps.pageSize}
                      totalResults={totalResults}
                      setPage={function (newPage: number) {
                        setPageProps({ ...pageProps, page: newPage });
                      }}
                    />
                  </Col>
                </Row>
              )}
            </Container>
          </Col>
        </Row>
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
