"use client";

import { publicEnv } from "@/config/env";
import type { DBResponse } from "@/entities/IDBResponse";
import type { MemeSeason } from "@/entities/ISeason";
import type { GlobalTDHHistory, TDHCalc } from "@/entities/ITDH";
import type { ApiBlocksPage } from "@/generated/models/ApiBlocksPage";
import { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import { numberWithCommas } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { LeaderboardFocus } from "@/types/enums";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import DotLoader, { Spinner } from "../dotLoader/DotLoader";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "../searchModal/SearchModal";
import styles from "./Leaderboard.module.scss";
import LeaderboardCardsCollectedComponent from "./LeaderboardCardsCollected";
import LeaderboardInteractionsComponent from "./LeaderboardInteractions";

export enum Content {
  ALL = "All",
  MEMES = "Memes",
  GRADIENTS = "Gradient",
  MEMELAB = "MemeLab",
  NEXTGEN = "NextGen",
}

export enum Collector {
  ALL = "All",
  MEMES = "Memes",
  MEMES_SETS = "Meme SZN Set",
  GENESIS = "Genesis Set",
  GRADIENTS = "Gradient",
  MEMELAB = "MemeLab",
  NEXTGEN = "NextGen",
}

function getSelectedNetworkTdh(
  globalTdhHistory: GlobalTDHHistory | undefined,
  isUnboostedTdhView: boolean
) {
  if (!globalTdhHistory) {
    return undefined;
  }

  if (isUnboostedTdhView) {
    return globalTdhHistory.total_tdh;
  }

  return globalTdhHistory.total_boosted_tdh;
}

function getSelectedNetworkTdhChange(
  globalTdhHistory: GlobalTDHHistory | undefined,
  isUnboostedTdhView: boolean
) {
  if (!globalTdhHistory) {
    return undefined;
  }

  if (isUnboostedTdhView) {
    return globalTdhHistory.net_tdh;
  }

  return globalTdhHistory.net_boosted_tdh;
}

export default function Leaderboard(
  props: Readonly<{
    focus: LeaderboardFocus;
    setFocus: (focus: LeaderboardFocus) => void;
    tdhView: ApiConsolidatedTdhView;
    setTdhView: (tdhView: ApiConsolidatedTdhView) => void;
  }>
) {
  const [content, setContent] = useState<Content>(Content.ALL);
  const [collector, setCollector] = useState<Collector>(Collector.ALL);
  const [seasons, setSeasons] = useState<MemeSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(0);

  const [lastTDH, setLastTDH] = useState<TDHCalc>();

  const pathname = usePathname();
  const isNetworkPage = pathname.startsWith("/network");
  const showViewAll = !isNetworkPage;

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  const [globalTdhHistory, setGlobalTdhHistory] = useState<GlobalTDHHistory>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isUnboostedTdhView = props.tdhView === ApiConsolidatedTdhView.Unboosted;
  const selectedNetworkTdh = getSelectedNetworkTdh(
    globalTdhHistory,
    isUnboostedTdhView
  );
  const selectedNetworkTdhChange = getSelectedNetworkTdhChange(
    globalTdhHistory,
    isUnboostedTdhView
  );
  const selectedGlobalTdhRateChange =
    selectedNetworkTdh !== undefined &&
    selectedNetworkTdh !== 0 &&
    selectedNetworkTdhChange !== undefined
      ? (selectedNetworkTdhChange / selectedNetworkTdh) * 100
      : undefined;

  useEffect(() => {
    if (
      content !== Content.MEMES &&
      collector !== Collector.MEMES &&
      collector !== Collector.MEMES_SETS
    ) {
      setSelectedSeason(0);
    }
  }, [content, collector]);

  useEffect(() => {
    fetchUrl(`${publicEnv.API_ENDPOINT}/api/blocks?page_size=${1}`)
      .then((response: ApiBlocksPage) => {
        if (response.data.length > 0) {
          const latestTDH = {
            block: response.data[0]?.block_number!,
            date: new Date(response.data[0]?.timestamp!),
          };
          setLastTDH(latestTDH);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch latest TDH block", error);
        setLastTDH(undefined);
      });

    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
    }).then((response) => {
      setSeasons(response);
    });
  }, []);

  useEffect(() => {
    let url = `${publicEnv.API_ENDPOINT}/api/tdh_global_history?page_size=${1}`;
    fetchUrl(url)
      .then((response: DBResponse) => {
        const tdhH = response.data[0];
        setGlobalTdhHistory(tdhH);
      })
      .catch((error) => {
        console.error("Failed to fetch global TDH history", error);
        setGlobalTdhHistory(undefined);
      });
  }, []);

  function printCollectorsDropdown() {
    return (
      <Dropdown className={styles["contentDropdown"]} drop={"down-centered"}>
        <Dropdown.Toggle>
          <span>Collectors: {collector}</span>
          <span aria-hidden="true" className={styles["dropdownCaret"]} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.values(Collector).map((collector) => (
            <Dropdown.Item
              key={collector}
              onClick={() => setCollector(collector)}
            >
              {[Collector.MEMES_SETS, Collector.GENESIS].includes(collector) ? (
                <>&nbsp;&nbsp;{collector}</>
              ) : (
                collector
              )}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function printTdhViewToggle() {
    const isBoostedTdhView = props.tdhView !== ApiConsolidatedTdhView.Unboosted;

    return (
      <fieldset className={styles["tdhViewSegmentedControl"]}>
        <legend className="tw-sr-only">TDH view</legend>
        <button
          type="button"
          aria-pressed={isBoostedTdhView}
          className={`${styles["tdhViewSegment"]} ${
            isBoostedTdhView ? styles["tdhViewSegmentActive"] : ""
          }`}
          onClick={() => props.setTdhView(ApiConsolidatedTdhView.Boosted)}
        >
          Boosted
        </button>
        <button
          type="button"
          aria-pressed={props.tdhView === ApiConsolidatedTdhView.Unboosted}
          className={`${styles["tdhViewSegment"]} ${
            props.tdhView === ApiConsolidatedTdhView.Unboosted
              ? styles["tdhViewSegmentActive"]
              : ""
          }`}
          onClick={() => props.setTdhView(ApiConsolidatedTdhView.Unboosted)}
        >
          Unboosted
        </button>
        <span className="tw-sr-only" aria-live="polite">
          {props.tdhView === ApiConsolidatedTdhView.Unboosted
            ? "Showing unboosted TDH values"
            : "Showing boosted TDH values"}
        </span>
      </fieldset>
    );
  }

  function printCardsInteractionsToggle() {
    return (
      <fieldset className={styles["focusToggle"]}>
        <legend className="tw-sr-only">Leaderboard view</legend>
        <button
          type="button"
          aria-pressed={props.focus === LeaderboardFocus.TDH}
          onClick={() => props.setFocus(LeaderboardFocus.TDH)}
          className={`${styles["focus"]} ${
            props.focus === LeaderboardFocus.TDH ? "" : styles["disabled"]
          }`}
        >
          {LeaderboardFocus.TDH}
        </button>
        <span aria-hidden="true">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
        <button
          type="button"
          aria-pressed={props.focus === LeaderboardFocus.INTERACTIONS}
          onClick={() => props.setFocus(LeaderboardFocus.INTERACTIONS)}
          className={`${styles["focus"]} ${
            props.focus === LeaderboardFocus.INTERACTIONS
              ? ""
              : styles["disabled"]
          }`}
        >
          {LeaderboardFocus.INTERACTIONS}
        </button>
      </fieldset>
    );
  }

  function printCollectionsDropdown() {
    return (
      <Dropdown className={styles["contentDropdown"]} drop={"down-centered"}>
        <Dropdown.Toggle>
          <span>Collection: {content}</span>
          <span aria-hidden="true" className={styles["dropdownCaret"]} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.values(Content).map((content) => (
            <Dropdown.Item key={content} onClick={() => setContent(content)}>
              {content}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function printSeasonsDropdown() {
    return (
      <Dropdown className={styles["contentDropdown"]} drop={"down-centered"}>
        <Dropdown.Toggle
          disabled={
            content != Content.MEMES &&
            collector != Collector.MEMES &&
            collector != Collector.MEMES_SETS
          }
        >
          <span>SZN: {selectedSeason > 0 ? selectedSeason : "All"}</span>
          <span aria-hidden="true" className={styles["dropdownCaret"]} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => setSelectedSeason(0)}>
            All
          </Dropdown.Item>
          {seasons.map((season) => (
            <Dropdown.Item
              key={season.display}
              onClick={() => setSelectedSeason(season.id)}
            >
              {season.display}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  return (
    <div className={styles["networkPage"]}>
      <section className={styles["networkHeader"]}>
        <div className={styles["networkTitleBlock"]}>
          <h1 className={styles["networkTitle"]}>
            Network Nerd{" "}
            {showViewAll && (
              <Link href="/network/nerd">
                <span className={styles["viewAllLink"]}>View All</span>
              </Link>
            )}
          </h1>
          {isNetworkPage && (
            <div className="tw-mt-5 tw-flex tw-items-center tw-gap-3">
              <span className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-iron-500">
                TDH View
              </span>
              {printTdhViewToggle()}
            </div>
          )}
        </div>
        <div className={styles["networkStats"]}>
          <div className={styles["networkStat"]}>
            <span className={styles["networkStatLabel"]}>TDH Block</span>
            <span className={styles["networkStatValue"]}>
              {lastTDH ? (
                <a
                  href={`https://etherscan.io/block/${lastTDH.block}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {lastTDH.block}
                </a>
              ) : (
                <DotLoader />
              )}
            </span>
          </div>
          <div className={styles["networkStat"]}>
            <span className={styles["networkStatLabel"]}>Network TDH</span>
            <span className={styles["networkStatValue"]}>
              {selectedNetworkTdh === undefined ? (
                <DotLoader />
              ) : (
                numberWithCommas(selectedNetworkTdh)
              )}
            </span>
          </div>
          <div className={styles["networkStat"]}>
            <span className={styles["networkStatLabel"]}>Daily Change</span>
            <span className={styles["networkStatValue"]}>
              {selectedNetworkTdhChange === undefined ||
              selectedGlobalTdhRateChange === undefined ? (
                <DotLoader />
              ) : (
                <>
                  {numberWithCommas(selectedNetworkTdhChange)}{" "}
                  <span className="font-smaller">
                    ({selectedGlobalTdhRateChange.toFixed(2)}%)
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </section>
      {isNetworkPage && (
        <section className={styles["networkToolbar"]} id="leaderboard-page">
          <div className={styles["networkToolbarTop"]}>
            <div className={styles["networkFilters"]}>
              {printCollectorsDropdown()}
              {printCollectionsDropdown()}
              {printSeasonsDropdown()}
            </div>
            <div className={styles["networkViewTabs"]}>
              {printCardsInteractionsToggle()}
            </div>
          </div>
          <div className={styles["networkToolbarSearchRow"]}>
            <div className={styles["networkSearch"]}>
              <div
                className={`${styles["networkLoadingSlot"]} ${
                  isLoading ? "" : "tw-invisible"
                }`}
              >
                <Spinner dimension={30} />
              </div>
              <SearchWalletsDisplay
                searchWallets={searchWallets}
                setSearchWallets={setSearchWallets}
                setShowSearchModal={setShowSearchModal}
                variant="dark"
              />
            </div>
          </div>
        </section>
      )}
      <div
        className={`${styles["scrollContainer"]} ${styles["leaderboardSurface"]}`}
      >
        {props.focus === LeaderboardFocus.TDH && (
          <LeaderboardCardsCollectedComponent
            block={lastTDH?.block}
            content={content}
            collector={collector}
            selectedSeason={selectedSeason}
            searchWallets={searchWallets}
            tdhView={props.tdhView}
            globalTdhRateChange={selectedGlobalTdhRateChange}
            seasons={seasons}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
        {props.focus === LeaderboardFocus.INTERACTIONS && (
          <LeaderboardInteractionsComponent
            block={lastTDH?.block}
            content={content}
            collector={collector}
            selectedSeason={selectedSeason}
            searchWallets={searchWallets}
            seasons={seasons}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </div>
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
        variant="dark"
      />
    </div>
  );
}
