"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Carousel } from "react-bootstrap";
import { mainnet } from "viem/chains";
import Address from "@/components/address/Address";
import DotLoader from "@/components/dotLoader/DotLoader";
import NowMintingCountdown from "@/components/home/now-minting/NowMintingCountdown";
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
} from "@/helpers/Helpers";
import { compareLocalized, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import styles from "./Distribution.module.scss";

interface Props {
  header: string;
  contract: string;
  link: string;
  locale?: SupportedLocale;
}

export default function DistributionPage(props: Readonly<Props>) {
  const params = useParams();
  const { setTitle } = useTitle();
  const locale = props.locale ?? DEFAULT_LOCALE;
  const [pageProps, setPageProps] = useState<{
    page: number;
    pageSize: number;
  }>({ page: 1, pageSize: 150 });

  const [nftId, setNftId] = useState<string>();
  const [isValidNftId, setIsValidNftId] = useState(false);

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [distributionPhotos, setDistributionPhotos] = useState<
    DistributionPhoto[]
  >([]);

  const [totalResults, setTotalResults] = useState(0);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  const [fetching, setFetching] = useState(true);

  const distributionsPhases = useMemo(() => {
    const phasesSet = new Set<string>();
    distributions.forEach((d) => {
      d.phases.forEach((p) => {
        phasesSet.add(p);
      });
    });
    const phases = Array.from(phasesSet);
    phases.sort((a, b) => compareLocalized(locale, a, b));
    return phases;
  }, [distributions, locale]);

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
    } catch (error) {
      console.error(
        `Failed to fetch distribution data for NFT ${nftId} on contract ${props.contract}`,
        error
      );
      setTotalResults(0);
      setDistributions([]);
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
      setTitle(
        t(locale, "distribution.documentTitle", {
          collection: props.header,
          tokenId: formatInteger(locale, Number.parseInt(nftId, 10)),
        })
      );
    }
  }, [isValidNftId, locale, nftId, props.header, setTitle]);

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
        <div className="tw-pb-5 tw-pt-4">
          <div>
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
                    alt={t(locale, "distribution.photos.alt", {
                      collection: props.header,
                      tokenId: formatInteger(
                        locale,
                        Number.parseInt(nftId ?? "0", 10)
                      ),
                      photoNumber: formatInteger(locale, index + 1),
                    })}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        </div>
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

    return count ? formatInteger(locale, count) : "-";
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
          {spotsAirdrop > 0 ? formatInteger(locale, spotsAirdrop) : "0"}
          {" | "}
          {spotsAllowlist > 0 ? formatInteger(locale, spotsAllowlist) : "0"}
        </span>
      );
    }
    return null;
  }

  function printDistribution() {
    return (
      <>
        <ScrollToButton threshold={500} to="distribution-table" offset={0} />
        <div className="tw-container tw-mx-auto tw-pb-3 tw-pt-5" id={`distribution-table`}>
          <div>
            <div className="tw-flex tw-items-center tw-justify-end">
              <SearchWalletsDisplay
                searchWallets={searchWallets}
                setSearchWallets={setSearchWallets}
                setShowSearchModal={setShowSearchModal}
              />
            </div>
          </div>
        </div>
        <div className="tw-container tw-mx-auto">
          <div className={styles["distributionsScrollContainer"]}>
            <div>
              <table className={styles["distributionsTable"]}>
                <caption className="tw-sr-only">
                  {t(locale, "distribution.table.caption", {
                    collection: props.header,
                    tokenId: formatInteger(
                      locale,
                      Number.parseInt(nftId ?? "0", 10)
                    ),
                  })}
                </caption>
                <thead>
                  <tr>
                    <th colSpan={2} scope="colgroup">
                      <span className="tw-sr-only">
                        {t(locale, "distribution.table.walletDetails")}
                      </span>
                    </th>
                    <th
                      colSpan={distributionsPhases.length}
                      className="tw-text-center"
                      scope="colgroup"
                    >
                      {t(locale, "distribution.table.allowlistSpots")}
                    </th>
                    <th colSpan={2} className="tw-text-center" scope="colgroup">
                      {t(locale, "distribution.table.actual")}
                    </th>
                  </tr>
                  <tr>
                    <th colSpan={2} scope="colgroup">
                      {t(locale, "distribution.table.wallet")}{" "}
                      {fetching ? (
                        <DotLoader />
                      ) : (
                        <span className="font-larger">
                          {t(locale, "distribution.table.walletCount", {
                            count: formatInteger(locale, totalResults),
                          })}
                        </span>
                      )}
                    </th>
                    {distributionsPhases.map((p) => (
                      <th
                        key={`${p}-header`}
                        className="tw-text-center"
                        scope="col"
                      >
                        {capitalizeEveryWord(p.replaceAll("_", " "))}
                      </th>
                    ))}
                    <th className="tw-text-center" scope="col">
                      {t(locale, "distribution.table.minted")}
                    </th>
                    <th className="tw-text-center" scope="col">
                      {t(locale, "distribution.table.total")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d) => (
                    <tr key={`${d.wallet}`}>
                      <th className="font-smaller" scope="row">
                        {d.wallet}
                      </th>
                      <td>
                        <Address
                          wallets={[d.wallet as `0x${string}`]}
                          display={d.wallet_display}
                          hideCopy={true}
                        />
                      </td>
                      {distributionsPhases.map((p) => (
                        <td key={`${p}-${d.wallet}`} className="tw-text-center">
                          {getCountForPhase(d, p)}&nbsp;&nbsp;
                          {getSpotsForPhase(d, p)}
                        </td>
                      ))}
                      <td className="tw-text-center">
                        {d.minted === 0 ? "-" : formatInteger(locale, d.minted)}
                      </td>
                      <td className="tw-text-center">
                        {d.total_count
                          ? formatInteger(locale, d.total_count)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  function printMintingLink() {
    if (
      areEqualAddresses(props.contract, MEMES_CONTRACT) &&
      isValidNftId &&
      nftId
    ) {
      return (
        <NowMintingCountdown
          nftId={Number.parseInt(nftId, 10)}
          contract={MEMES_CONTRACT}
          chainId={mainnet.id}
          hideNextDrop
          fullWidth
        />
      );
    }

    return <></>;
  }

  function printEmpty() {
    return (
      <div>
        {nftId && (
          <div className="tw-w-full">
            <UpcomingMemePage id={nftId} />
          </div>
        )}
        <div className="tw-w-full">
          <Image
            unoptimized
            loading="eager"
            width={0}
            height={0}
            style={{ height: "auto", width: "100px" }}
            src="/SummerGlasses.svg"
            alt=""
            aria-hidden="true"
          />{" "}
          {t(locale, "distribution.empty.soon")}
        </div>
        <div className="tw-flex tw-w-full tw-flex-wrap tw-gap-x-1">
          <span>{t(locale, "distribution.empty.checkBack")}</span>
          <span>{t(locale, "distribution.empty.dropUpdates")}</span>
          <a
            href="https://x.com/6529Collections"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(locale, "distribution.empty.xLink.ariaLabel")}
          >
            &#64;6529Collections
          </a>
        </div>
      </div>
    );
  }

  function printNotFound() {
    return (
      <div>
        <div className="tw-w-full">{t(locale, "distribution.empty.noResults")}</div>
      </div>
    );
  }

  if (!isValidNftId) {
    return <NotFound label={t(locale, "distribution.notFound.label")} />;
  }

  return (
    <>
      <div
        className={`tailwind-scope ${styles["mainContainer"]} tw-pb-10 tw-pt-6`}
      >
        <div>
          <div>
            <div className="tw-container tw-mx-auto tw-px-3">
              <div>
                <div className={`${styles["distributionHeader"]} tw-pb-1`}>
                  <h1 className="tw-mb-0 tw-text-center">
                    {t(locale, "distribution.heading", {
                      collection: props.header,
                      tokenId: formatInteger(
                        locale,
                        Number.parseInt(nftId ?? "0", 10)
                      ),
                    })}
                  </h1>
                  {printMintingLink()}
                </div>
              </div>
              {printDistributionPhotos()}
              <div>
                <div>
                  {nftId &&
                    (distributions.length > 0 || searchWallets.length > 0) &&
                    printDistribution()}
                </div>
              </div>
              {!fetching && distributions.length === 0 && (
                <>{searchWallets.length > 0 ? printNotFound() : printEmpty()}</>
              )}
              {distributions.length > 0 && (
                <div>
                  <div>
                    <span className="tw-text-sm tw-text-iron-400">
                      {t(locale, "distribution.table.note")}
                    </span>
                  </div>
                </div>
              )}
              {totalResults > pageProps.pageSize && (
                <div className="tw-pt-4 tw-text-center">
                  <div>
                    <Pagination
                      page={pageProps.page}
                      pageSize={pageProps.pageSize}
                      totalResults={totalResults}
                      setPage={function (newPage: number) {
                        setPageProps({ ...pageProps, page: newPage });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
      />
    </>
  );
}
