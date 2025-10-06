"use client";

import Address from "@/components/address/Address";
import DotLoader from "@/components/dotLoader/DotLoader";
import Pagination from "@/components/pagination/Pagination";
import ScrollToButton from "@/components/scrollTo/ScrollToButton";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "@/components/searchModal/SearchModal";
import MemePageMintCountdown from "@/components/the-memes/MemePageMintCountdown";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants";
import { DBResponse } from "@/entities/IDBResponse";
import { Distribution, DistributionPhoto } from "@/entities/IDistribution";
import {
  areEqualAddresses,
  capitalizeEveryWord,
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
  const [pageProps, setPageProps] = useState<{
    page: number;
    pageSize: number;
  }>({ page: 1, pageSize: 150 });

  const [nftId, setNftId] = useState<string>();

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

  function fetchDistribution() {
    setFetching(true);
    const walletFilter =
      searchWallets.length === 0 ? "" : `&search=${searchWallets.join(",")}`;
    const distributionUrl = `${publicEnv.API_ENDPOINT}/api/distributions?card_id=${nftId}&contract=${props.contract}&page=${pageProps.page}${walletFilter}`;
    fetchUrl(distributionUrl).then((r: DBResponse) => {
      setTotalResults(r.count);
      const mydistributions: Distribution[] = r.data;
      setDistributions(mydistributions);
      updateDistributionPhases(mydistributions);
      setFetching(false);
    });
  }

  useEffect(() => {
    const id = params?.id as string;
    if (id) {
      setNftId(id);
    }
  }, [params]);

  useEffect(() => {
    if (nftId) {
      const distributionPhotosUrl = `${publicEnv.API_ENDPOINT}/api/distribution_photos/${props.contract}/${nftId}`;

      fetchAllPages(distributionPhotosUrl).then((distributionPhotos: any[]) => {
        setDistributionPhotos(distributionPhotos);
        fetchDistribution();
      });
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
        <Carousel
          interval={null}
          wrap={false}
          touch={true}
          fade={true}
          className={styles.distributionCarousel}>
          {distributionPhotos.map((dp) => (
            <Carousel.Item key={dp.id}>
              <Image
                unoptimized
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
          <Row className={styles.distributionsScrollContainer}>
            <Col className="no-padding">
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
                          {getCountForPhase(d, p)}
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
    const nftIdNumber = parseInt(nftId ?? "");
    if (
      !isNaN(nftIdNumber) &&
      areEqualAddresses(props.contract, MEMES_CONTRACT)
    ) {
      return (
        <MemePageMintCountdown
          nft_id={nftIdNumber}
          hide_mint_btn={false}
          is_full_width={false}
          show_only_if_active={true}
        />
      );
    }

    return <></>;
  }

  function printEmpty() {
    return (
      <Row>
        <Col xs={12}>
          <Image
            unoptimized
            loading="eager"
            width="0"
            height="0"
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
            rel="noopener noreferrer">
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

  return (
    <>
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
                  {printMintingLink()}
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
                    (distributions.length > 0 || searchWallets.length > 0) &&
                    printDistribution()}
                </Col>
              </Row>
              {!fetching && distributions.length === 0 && (
                <>{searchWallets.length > 0 ? printNotFound() : printEmpty()}</>
              )}
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
