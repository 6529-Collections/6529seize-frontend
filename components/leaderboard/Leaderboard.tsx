"use client";

import { publicEnv } from "@/config/env";
import { NETWORK_PAGE_TITLE_CLASSES } from "@/components/network/networkPageLayoutClasses";
import type { DBResponse } from "@/entities/IDBResponse";
import type { MemeSeason } from "@/entities/ISeason";
import type { GlobalTDHHistory, TDHCalc } from "@/entities/ITDH";
import type { ApiBlocksPage } from "@/generated/models/ApiBlocksPage";
import { ApiConsolidatedTdhView } from "@/generated/models/ApiConsolidatedTdhView";
import { numberWithCommas } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { LeaderboardFocus } from "@/types/enums";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import DotLoader, { Spinner } from "../dotLoader/DotLoader";
import type { CommonSelectItem } from "../utils/select/CommonSelect";
import CommonDropdown from "../utils/select/dropdown/CommonDropdown";
import CommonTabs from "../utils/select/tabs/CommonTabs";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "../searchModal/SearchModal";
import styles from "./Leaderboard.module.css";
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

const TDH_VIEW_ITEMS: CommonSelectItem<ApiConsolidatedTdhView>[] = [
  {
    label: "Boosted",
    value: ApiConsolidatedTdhView.Boosted,
    key: "tdh-view-boosted",
  },
  {
    label: "Unboosted",
    value: ApiConsolidatedTdhView.Unboosted,
    key: "tdh-view-unboosted",
  },
];

const NETWORK_META_LABEL_CLASS_NAME =
  "tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500";

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
  const isSelectedNetworkTdhChangeLoading =
    selectedNetworkTdh === undefined || selectedNetworkTdhChange === undefined;
  const selectedGlobalTdhRateChangeLabel =
    selectedNetworkTdh === 0
      ? "n/a"
      : selectedGlobalTdhRateChange === undefined
        ? undefined
        : `${selectedGlobalTdhRateChange.toFixed(2)}%`;

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
    fetchUrl<ApiBlocksPage>(
      `${publicEnv.API_ENDPOINT}/api/blocks?page_size=${1}`
    )
      .then((response) => {
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
    const items: CommonSelectItem<Collector>[] = Object.values(Collector).map(
      (value) => ({
        label: value,
        value,
        key: `collector-${value}`,
      })
    );

    return (
      <CommonDropdown
        filterLabel="Collectors"
        items={items}
        activeItem={collector}
        setSelected={setCollector}
        size="sm"
        variant="editorial"
        showFilterLabel
      />
    );
  }

  function printTdhViewToggle() {
    return (
      <div className="tw-w-fit">
        <CommonTabs
          items={TDH_VIEW_ITEMS}
          activeItem={props.tdhView}
          setSelected={props.setTdhView}
          filterLabel="TDH view"
          fill={false}
        />
        <span className="tw-sr-only" aria-live="polite">
          {props.tdhView === ApiConsolidatedTdhView.Unboosted
            ? "Showing unboosted TDH values"
            : "Showing boosted TDH values"}
        </span>
      </div>
    );
  }

  function printCardsInteractionsToggle() {
    return (
      <fieldset className="tw-m-0 tw-inline-flex tw-min-w-0 tw-items-center tw-gap-3 tw-border-0 tw-p-0 sm:tw-gap-4">
        <legend className="tw-sr-only">Leaderboard view</legend>
        <button
          type="button"
          aria-pressed={props.focus === LeaderboardFocus.TDH}
          onClick={() => props.setFocus(LeaderboardFocus.TDH)}
          className={`tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-semibold tw-leading-5 tw-transition tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
            props.focus === LeaderboardFocus.TDH
              ? "tw-text-iron-50"
              : "tw-text-iron-500 hover:tw-text-iron-200"
          }`}
        >
          {LeaderboardFocus.TDH}
        </button>
        <span
          aria-hidden="true"
          className="tw-h-6 tw-w-px tw-shrink-0 tw-bg-iron-800 sm:tw-h-8"
        />
        <button
          type="button"
          aria-pressed={props.focus === LeaderboardFocus.INTERACTIONS}
          onClick={() => props.setFocus(LeaderboardFocus.INTERACTIONS)}
          className={`tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-semibold tw-leading-5 tw-transition tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
            props.focus === LeaderboardFocus.INTERACTIONS
              ? "tw-text-iron-50"
              : "tw-text-iron-500 hover:tw-text-iron-200"
          }`}
        >
          {LeaderboardFocus.INTERACTIONS}
        </button>
      </fieldset>
    );
  }

  function printCollectionsDropdown() {
    const items: CommonSelectItem<Content>[] = Object.values(Content).map(
      (value) => ({
        label: value,
        value,
        key: `content-${value}`,
      })
    );

    return (
      <CommonDropdown
        filterLabel="Collection"
        items={items}
        activeItem={content}
        setSelected={setContent}
        size="sm"
        variant="editorial"
        showFilterLabel
      />
    );
  }

  function printSeasonsDropdown() {
    const items: CommonSelectItem<number>[] = [
      { label: "All", value: 0, key: "season-all" },
      ...seasons.map((season) => ({
        label: season.display,
        value: season.id,
        key: `season-${season.id}`,
      })),
    ];

    return (
      <CommonDropdown
        disabled={
          content != Content.MEMES &&
          collector != Collector.MEMES &&
          collector != Collector.MEMES_SETS
        }
        filterLabel="SZN"
        items={items}
        activeItem={selectedSeason}
        setSelected={setSelectedSeason}
        size="sm"
        variant="editorial"
        showFilterLabel
      />
    );
  }

  return (
    <div className={styles["networkPage"]}>
      <section className={styles["networkHeader"]}>
        <div className={styles["networkTitleBlock"]}>
          <h1 className={NETWORK_PAGE_TITLE_CLASSES}>
            Network Nerd{" "}
            {showViewAll && (
              <Link href="/network/nerd">
                <span className={styles["viewAllLink"]}>View All</span>
              </Link>
            )}
          </h1>
        </div>
        <div className={styles["networkHeaderMain"]}>
          {isNetworkPage && (
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
              <span className={NETWORK_META_LABEL_CLASS_NAME}>TDH View</span>
              {printTdhViewToggle()}
            </div>
          )}
          <div className={styles["networkStats"]}>
            <div className={styles["networkStat"]}>
              <span className={NETWORK_META_LABEL_CLASS_NAME}>TDH Block</span>
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
              <span className={NETWORK_META_LABEL_CLASS_NAME}>Network TDH</span>
              <span className={styles["networkStatValue"]}>
                {selectedNetworkTdh === undefined ? (
                  <DotLoader />
                ) : (
                  numberWithCommas(selectedNetworkTdh)
                )}
              </span>
            </div>
            <div className={styles["networkStat"]}>
              <span className={NETWORK_META_LABEL_CLASS_NAME}>
                Daily Change
              </span>
              <span
                className={clsx(
                  styles["networkStatValue"],
                  styles["networkStatChangeValue"]
                )}
              >
                {isSelectedNetworkTdhChangeLoading ? (
                  <DotLoader />
                ) : (
                  <>
                    {numberWithCommas(selectedNetworkTdhChange)}{" "}
                    <span
                      className={clsx(
                        styles["networkStatChangeRate"],
                        "tw-text-sm"
                      )}
                    >
                      ({selectedGlobalTdhRateChangeLabel})
                    </span>
                  </>
                )}
              </span>
            </div>
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
            <div className={styles["networkToolbarActions"]}>
              <div className={styles["networkViewTabs"]}>
                {printCardsInteractionsToggle()}
              </div>
              <div className={styles["networkSearch"]}>
                <div
                  className={clsx(
                    styles["networkLoadingSlot"],
                    !isLoading && "tw-invisible"
                  )}
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
