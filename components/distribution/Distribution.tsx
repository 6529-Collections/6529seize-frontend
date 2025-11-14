"use client";

import Address from "@/components/address/Address";
import DotLoader from "@/components/dotLoader/DotLoader";
import MemePageMintCountdown from "@/components/mint-countdown-box/MemePageMintCountdown";
import Pagination from "@/components/pagination/Pagination";
import ScrollToButton from "@/components/scrollTo/ScrollToButton";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "@/components/searchModal/SearchModal";
import { MEMES_CONTRACT } from "@/constants";
import { Distribution } from "@/entities/IDistribution";
import {
  areEqualAddresses,
  capitalizeEveryWord,
  numberWithCommas,
} from "@/helpers/Helpers";
import {
  useDistributionData,
  useDistributionPhotos,
} from "./useDistributionQueries";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Carousel, Col, Container, Row, Table } from "react-bootstrap";
import styles from "./Distribution.module.scss";

interface Props {
  readonly header: string;
  readonly contract: string;
  readonly link: string;
}

function getCountForPhase(distribution: Distribution, phase: string) {
  if (phase.toUpperCase() === "AIRDROP") {
    const count = distribution.airdrops;
    return count ? numberWithCommas(count) : "-";
  }

  const allowlistEntry = distribution.allowlist.find((entry) => entry.phase === phase);
  const count = allowlistEntry?.spots ?? 0;

  return count ? numberWithCommas(count) : "-";
}

export default function DistributionPage(props: Readonly<Props>) {
  const params = useParams();
  const [pageProps, setPageProps] = useState<{
    page: number;
    pageSize: number;
  }>({ page: 1, pageSize: 150 });

  const [nftId, setNftId] = useState<string>();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  const {
    data: distributionsResponse,
    isFetching: isDistributionsFetching,
  } = useDistributionData({
    nftId,
    contract: props.contract,
    page: pageProps.page,
    searchWallets,
  });

  const distributions = distributionsResponse?.data ?? [];
  const totalResults = distributionsResponse?.count ?? 0;

  const distributionPhases = useMemo(() => {
    const phasesSet = new Set<string>();
    for (const distribution of distributions) {
      for (const phase of distribution.phases) {
        phasesSet.add(phase);
      }
    }
    return Array.from(phasesSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [distributions]);

  const { data: distributionPhotosData } = useDistributionPhotos({
    nftId,
    contract: props.contract,
  });

  const distributionPhotos = distributionPhotosData ?? [];

  const handlePageChange = useCallback((newPage: number) => {
    setPageProps((prev) => {
      if (prev.page === newPage) {
        return prev;
      }

      return { ...prev, page: newPage };
    });
  }, []);

  useEffect(() => {
    const id = params?.id as string;
    if (id) {
      setNftId(id);
    }
  }, [params]);

  useEffect(() => {
    if (!nftId) {
      return;
    }

    setPageProps((prev) => {
      if (prev.page === 1) {
        return prev;
      }

      return { ...prev, page: 1 };
    });
  }, [nftId, searchWallets]);

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
                      colSpan={distributionPhases.length}
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
                      {isDistributionsFetching ? (
                        <DotLoader />
                      ) : (
                        <span className="font-larger">
                          x{totalResults.toLocaleString()}
                        </span>
                      )}
                    </th>
                    {distributionPhases.map((p) => (
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
                      {distributionPhases.map((p) => (
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
      return <MemePageMintCountdown nft_id={nftIdNumber} />;
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
                    {props.header} Card #{nftId} Distribution
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
                  {nftId && printDistribution()}
                </Col>
              </Row>
              {nftId && !isDistributionsFetching && distributions.length === 0 && (
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
              setPage={handlePageChange}
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
