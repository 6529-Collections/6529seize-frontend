"use client";

import styles from "./SubscriptionsReport.module.css";
import {
  ACTIVE_REPORT_GRID_CLASS_NAME,
  ActiveSubscriptionRow,
  RedeemedSubscriptionRow,
  STANDARD_REPORT_GRID_CLASS_NAME,
  SubscriptionDayRow,
} from "./SubscriptionsReportRows";
import {
  areMemeTokenIdsEqual,
  getMemeTokenIdKey,
  normalizeMemeTokenId,
} from "./SubscriptionsReport.utils";
import AboutSubscriptionsProfileButton from "@/components/about/AboutSubscriptionsProfileButton";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { publicEnv } from "@/config/env";
import type { MemeSeason } from "@/entities/ISeason";
import type { SeasonMintRow } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  getCardsRemainingUntilEndOf,
  getMintTimelineDetails,
  getUpcomingMintsAcrossSeasons,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { Paginated } from "@/components/pagination/Pagination";
import Pagination from "@/components/pagination/Pagination";
import ShowMoreButton from "@/components/show-more-button/ShowMoreButton";
import Button from "@/components/utils/button/Button";
import type { RedeemedSubscriptionCounts } from "@/generated/models/RedeemedSubscriptionCounts";
import type { SubscriptionCounts } from "@/generated/models/SubscriptionCounts";
import { commonApiFetch } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { sanitizeErrorForUser } from "@/utils/error-sanitizer";
import Link from "next/link";
import useDownloader from "@/hooks/useDownloader";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME,
  CONTENT_PAGE_CONTAINER_CLASS,
} from "@/components/about/AboutLayout";
import {
  SUBSCRIPTIONS_PANEL_CLASS,
  SUBSCRIPTIONS_SECTION_HEADING_CLASS,
} from "@/components/about/aboutSubscriptionsStyles";
import { DATA_TABLE_HEADER_TEXT_CLASS_NAME } from "@/components/utils/table/tableStyles";
import { useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 10;
const UPCOMING_PAGE_SIZE = 5;
const REPORT_SECTION_HEADING_CLASS_NAME =
  SUBSCRIPTIONS_SECTION_HEADING_CLASS;
const REPORT_MAJOR_SECTION_GAP_CLASS_NAME = "tw-pt-[34px]";
const REPORT_SECTION_CONTENT_GAP_CLASS_NAME = "tw-pt-[13px]";
const REPORT_TABLE_HEADER_CLASS_NAME = `tw-hidden tw-gap-4 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-2 tw-text-left tw-font-semibold tw-text-iron-400 sm:tw-grid sm:tw-px-6 sm:tw-py-3 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`;

type MemeCalendarCurrentResponse = {
  readonly status: string;
  readonly current: {
    readonly mint_number: number;
  } | null;
  readonly next?: {
    readonly mint_number: number;
    readonly mint_date: string;
  };
};

function getUtcDateKey(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function getReportActiveMintNumber(
  currentMint: MemeCalendarCurrentResponse,
  now: Date = new Date()
): number | null {
  if (currentMint.status === "live") {
    return normalizeMemeTokenId(currentMint.current?.mint_number);
  }

  const nextMint = currentMint.next;
  const todayUtc = now.toISOString().slice(0, 10);
  return currentMint.status === "none" &&
    nextMint &&
    getUtcDateKey(nextMint.mint_date) === todayUtc
    ? normalizeMemeTokenId(nextMint.mint_number)
    : null;
}

function getMintRowForTokenId(tokenId: unknown): SeasonMintRow | null {
  const normalizedTokenId = normalizeMemeTokenId(tokenId);
  if (normalizedTokenId === null) {
    return null;
  }

  const timeline = getMintTimelineDetails(normalizedTokenId);
  return {
    meme: timeline.mintNumber,
    utcDay: timeline.mintDayUtc,
    instantUtc: timeline.instantUtc,
    seasonIndex: timeline.seasonIndex,
  };
}

function getActiveRedeemedDrop(
  drops: RedeemedSubscriptionCounts[],
  currentLiveMintNumber: number | null
): RedeemedSubscriptionCounts | null {
  if (currentLiveMintNumber === null) {
    return null;
  }

  return (
    drops.find((drop) =>
      areMemeTokenIdsEqual(drop.token_id, currentLiveMintNumber)
    ) ?? null
  );
}

function withoutTokenId<T extends { token_id: number | string }>(
  drops: T[],
  tokenId: number | null
): T[] {
  if (tokenId === null) {
    return drops;
  }

  return drops.filter((drop) => !areMemeTokenIdsEqual(drop.token_id, tokenId));
}

function getDisplayedRedeemedTotal(
  totalRedeemed: number,
  activeTokenId: number | null
): number {
  if (activeTokenId === null) {
    return totalRedeemed;
  }

  return Math.max(totalRedeemed - 1, 0);
}

async function fetchReportActiveMintNumber(now: Date) {
  const response = await fetch("/api/meme-calendar/current");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch current meme calendar: ${response.status}`
    );
  }

  const currentMint = (await response.json()) as MemeCalendarCurrentResponse;
  return getReportActiveMintNumber(currentMint, now);
}

export default function SubscriptionsReportComponent() {
  const { setToast } = useAuth();
  const pastDropsTarget = useRef<HTMLDivElement>(null);
  const upcomingToggleRef = useRef<HTMLDivElement>(null);
  const upcomingTableTopRef = useRef<HTMLDivElement>(null);
  const activeTokenIdRef = useRef<number | null>(null);

  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingCounts, setUpcomingCounts] = useState<SubscriptionCounts[]>(
    []
  );

  const [redeemedLoading, setRedeemedLoading] = useState(true);
  const [redeemedCounts, setRedeemedCounts] = useState<
    RedeemedSubscriptionCounts[]
  >([]);
  const [activeDrop, setActiveDrop] =
    useState<RedeemedSubscriptionCounts | null>(null);
  const [activeSubscribedCount, setActiveSubscribedCount] =
    useState<SubscriptionCounts | null>(null);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [redeemedPage, setRedeemedPage] = useState<number>(1);
  const [upcomingVisible, setUpcomingVisible] = useState(UPCOMING_PAGE_SIZE);
  const [animateFromIndex, setAnimateFromIndex] = useState<number | null>(null);
  const firstNewRowRef = useRef<HTMLAnchorElement>(null);
  const [availableSeasons, setAvailableSeasons] = useState<MemeSeason[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [seasonOptionsLoaded, setSeasonOptionsLoaded] = useState(false);

  // Scroll first new row into view after show-more renders
  useEffect(() => {
    if (animateFromIndex === null) return;
    requestAnimationFrame(() => {
      firstNewRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [animateFromIndex, upcomingVisible]);

  const [now] = useState(new Date());
  const rows = useMemo<SeasonMintRow[]>(
    () => getUpcomingMintsAcrossSeasons(upcomingCounts.length || 50, now),
    [now, upcomingCounts.length]
  );
  const rowsByMeme = useMemo(
    () => new Map(rows.map((row) => [row.meme, row])),
    [rows]
  );
  const upcomingRows = useMemo(
    () =>
      upcomingCounts.flatMap((count, index) => {
        const tokenId = normalizeMemeTokenId(count.token_id);
        const date =
          (tokenId === null ? null : rowsByMeme.get(tokenId)) ??
          getMintRowForTokenId(count.token_id) ??
          rows[index];

        return date ? [{ count, date }] : [];
      }),
    [rows, rowsByMeme, upcomingCounts]
  );

  async function fetchUpcomingCounts(count: number) {
    return await commonApiFetch<SubscriptionCounts[]>({
      endpoint: `subscriptions/upcoming-memes-counts?card_count=${count}`,
    });
  }

  async function fetchRedeemedCounts(page: number) {
    return await commonApiFetch<Paginated<RedeemedSubscriptionCounts>>({
      endpoint: `subscriptions/redeemed-memes-counts`,
      params: {
        page_size: PAGE_SIZE.toString(),
        page: page.toString(),
      },
    });
  }

  async function fetchSubscribedCount(tokenId: number) {
    return await commonApiFetch<SubscriptionCounts>({
      endpoint: `subscriptions/memes/${tokenId}/count`,
    });
  }

  async function fetchSeasons() {
    return await commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      let remainingCountForSeason = getCardsRemainingUntilEndOf("szn");
      let activeRedeemedDrop: RedeemedSubscriptionCounts | null = null;
      let activeTokenId: number | null = null;
      let reportActiveMintNumber: number | null = null;
      const reportActiveMintNumberPromise = fetchReportActiveMintNumber(
        now
      ).catch((error: unknown) => {
        console.error("Failed to fetch current meme calendar mint:", error);
        return null;
      });

      try {
        const [redeemed, activeMintNumber] = await Promise.all([
          fetchRedeemedCounts(1),
          reportActiveMintNumberPromise,
        ]);
        reportActiveMintNumber = activeMintNumber;
        activeRedeemedDrop = getActiveRedeemedDrop(
          redeemed.data,
          reportActiveMintNumber
        );
        activeTokenId = activeRedeemedDrop
          ? normalizeMemeTokenId(activeRedeemedDrop.token_id)
          : null;
        activeTokenIdRef.current = activeTokenId;
        setActiveDrop(activeRedeemedDrop);
        setRedeemedCounts(withoutTokenId(redeemed.data, activeTokenId));
        setTotalRedeemed(
          getDisplayedRedeemedTotal(redeemed.count, activeTokenId)
        );
      } catch (error) {
        console.error("Failed to fetch redeemed subscriptions:", error);
        activeTokenId = null;
        activeTokenIdRef.current = null;
        setActiveDrop(null);
        setRedeemedCounts([]);
        setTotalRedeemed(0);
      }

      if (reportActiveMintNumber !== null && !activeRedeemedDrop) {
        remainingCountForSeason += 1;
      }

      try {
        const [upcoming, subscribedCount] = await Promise.all([
          fetchUpcomingCounts(remainingCountForSeason).catch(
            (error: unknown) => {
              console.error("Failed to fetch upcoming subscriptions:", error);
              return [];
            }
          ),
          activeTokenId !== null
            ? fetchSubscribedCount(activeTokenId).catch((error: unknown) => {
                console.error(
                  "Failed to fetch active drop subscribed count:",
                  error
                );
                return null;
              })
            : Promise.resolve(null),
        ]);

        setActiveSubscribedCount(subscribedCount);
        setUpcomingCounts(withoutTokenId(upcoming, activeTokenId));
      } catch (error) {
        console.error("Failed to fetch subscription counts:", error);
        setActiveSubscribedCount(null);
        setUpcomingCounts([]);
      } finally {
        setRedeemedLoading(false);
        setUpcomingLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSeasonOptions = async () => {
      try {
        const seasons = await fetchSeasons();
        setAvailableSeasons(seasons);
      } catch (error) {
        console.error(
          "Failed to fetch seasons for subscriptions report:",
          error
        );
      } finally {
        setSeasonOptionsLoaded(true);
      }
    };

    fetchSeasonOptions();
  }, []);

  useEffect(() => {
    if (redeemedLoading) return;
    const fetchData = async () => {
      setRedeemedLoading(true);
      try {
        const redeemed = await fetchRedeemedCounts(redeemedPage);
        setRedeemedCounts(
          withoutTokenId(redeemed.data, activeTokenIdRef.current)
        );
        setTotalRedeemed(
          getDisplayedRedeemedTotal(redeemed.count, activeTokenIdRef.current)
        );
      } finally {
        setRedeemedLoading(false);
      }
    };
    fetchData();
  }, [redeemedPage]);

  function renderEmptyState(loading: boolean, type: string) {
    if (loading) {
      return (
        <output
          className="tw-animate-pulse tw-text-sm tw-text-iron-400 motion-reduce:tw-animate-none"
        >
          Loading {type} drops...
        </output>
      );
    }
    return <>No Subscriptions Found</>;
  }

  const selectedSeason =
    availableSeasons.find(
      (season) => season.id.toString() === selectedSeasonId
    ) ?? null;

  const buildDownloadHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    const apiAuth = getStagingAuth();
    const allowlistAuth = getAuthJwt();

    if (apiAuth) {
      headers["x-6529-auth"] = apiAuth;
    }

    if (allowlistAuth) {
      headers["Authorization"] = `Bearer ${allowlistAuth}`;
    }

    return headers;
  };

  const {
    download,
    error: csvDownloadError,
    isInProgress: isDownloadingCsv,
  } = useDownloader({ headers: buildDownloadHeaders() });

  const csvDownloadUrl = useMemo(() => {
    const downloadUrl = new URL(
      "/api/subscriptions/redeemed-memes-counts/download",
      publicEnv.API_ENDPOINT
    );

    if (selectedSeason) {
      downloadUrl.searchParams.set("szn", selectedSeason.id.toString());
    }

    return downloadUrl.toString();
  }, [selectedSeason]);

  useEffect(() => {
    if (!csvDownloadError?.errorMessage) {
      return;
    }

    // react-use-downloader prefixes messages with "{status} - {statusText}: "
    // e.g. "400 - : No subscription data available" — strip that prefix
    const rawMessage = csvDownloadError.errorMessage;
    const cleanMessage = rawMessage.replace(/^\d{3}\s*-[^:]*:\s*/, "").trim();

    setToast({
      message: sanitizeErrorForUser(cleanMessage || rawMessage),
      type: "error",
    });
  }, [csvDownloadError, setToast]);

  const onDownloadCsv = async () => {
    if (isDownloadingCsv) {
      return;
    }

    await download(csvDownloadUrl, getRedeemedCsvFilename(selectedSeason));
  };

  const shouldShowDownloadSection =
    !upcomingLoading && !redeemedLoading && seasonOptionsLoaded;

  return (
    <div className={CONTENT_PAGE_CONTAINER_CLASS}>
      <div>
        <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <h1 className={ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME}>
            Subscriptions Report
          </h1>
          <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-4 tw-gap-y-3 sm:tw-w-auto sm:tw-justify-end">
            <AboutSubscriptionsProfileButton />
            <Link
              href="/about/subscriptions"
              className="hover:tw-text-primary-200 tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-leading-5 tw-text-primary-300 tw-no-underline hover:tw-underline"
              aria-label="Learn more about The Memes subscriptions"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
      {activeDrop && (
        <>
          <div className={REPORT_MAJOR_SECTION_GAP_CLASS_NAME}>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span
                aria-hidden="true"
                className="tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-emerald-500"
              />
              <h2 className={REPORT_SECTION_HEADING_CLASS_NAME}>Active Drop</h2>
            </div>
          </div>
          <div
            className={REPORT_SECTION_CONTENT_GAP_CLASS_NAME}
            data-testid="subscriptions-report-active-drop"
          >
            <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700">
              <span className="tw-sr-only">
                Active meme card subscribed and airdropped subscription counts
              </span>
              <div
                className={`${ACTIVE_REPORT_GRID_CLASS_NAME} ${REPORT_TABLE_HEADER_CLASS_NAME}`}
                aria-hidden="true"
              >
                <span>Meme Card</span>
                <span className="tw-text-center">Subscribed</span>
                <span className="tw-text-center">Airdropped</span>
              </div>
              <ActiveSubscriptionRow
                count={activeDrop}
                subscribedCount={activeSubscribedCount}
              />
            </div>
          </div>
        </>
      )}
      <div ref={upcomingTableTopRef} />
      <div className={REPORT_MAJOR_SECTION_GAP_CLASS_NAME}>
        <div className="tw-flex tw-items-center tw-gap-3">
          <h2 className={REPORT_SECTION_HEADING_CLASS_NAME}>Upcoming Drops</h2>
          {upcomingLoading && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </div>
      </div>
      <div
        className={REPORT_SECTION_CONTENT_GAP_CLASS_NAME}
        data-testid="subscriptions-report-upcoming-drops"
      >
        <div>
          {upcomingRows.length > 0 ? (
            <>
              <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/60">
                <span className="tw-sr-only">
                  Upcoming meme card subscription counts
                </span>
                <div
                  className={`${STANDARD_REPORT_GRID_CLASS_NAME} ${REPORT_TABLE_HEADER_CLASS_NAME}`}
                  aria-hidden="true"
                >
                  <span>Meme Card</span>
                  <span className="tw-text-center">Subscriptions</span>
                </div>
                <div>
                  {upcomingRows
                    .slice(0, upcomingVisible)
                    .map(({ count, date }, index) => {
                      const isNew =
                        animateFromIndex !== null && index >= animateFromIndex;
                      return (
                        <SubscriptionDayRow
                          key={getMemeTokenIdKey(count.token_id)}
                          ref={
                            index === animateFromIndex ? firstNewRowRef : null
                          }
                          className={
                            isNew ? (styles["upcomingRowNew"] ?? "") : ""
                          }
                          date={date}
                          count={count}
                        />
                      );
                    })}
                </div>
              </div>
              {upcomingRows.length > UPCOMING_PAGE_SIZE && (
                <div
                  ref={upcomingToggleRef}
                  className="tw-mt-3 tw-flex tw-justify-center tw-pb-1"
                >
                  {upcomingVisible < upcomingRows.length ? (
                    <ShowMoreButton
                      expanded={false}
                      variant="subtle"
                      setExpanded={() => {
                        setAnimateFromIndex(upcomingVisible);
                        setUpcomingVisible((prev) =>
                          Math.min(
                            prev + UPCOMING_PAGE_SIZE,
                            upcomingRows.length
                          )
                        );
                      }}
                    />
                  ) : (
                    <ShowMoreButton
                      expanded={true}
                      variant="subtle"
                      setExpanded={() => {
                        setAnimateFromIndex(null);
                        setUpcomingVisible(UPCOMING_PAGE_SIZE);
                        requestAnimationFrame(() => {
                          upcomingTableTopRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        });
                      }}
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            renderEmptyState(upcomingLoading, "upcoming")
          )}
        </div>
      </div>
      <div
        ref={pastDropsTarget}
        className={REPORT_MAJOR_SECTION_GAP_CLASS_NAME}
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          <h2 className={REPORT_SECTION_HEADING_CLASS_NAME}>Past Drops</h2>
          {redeemedLoading && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </div>
      </div>
      <div
        className={REPORT_SECTION_CONTENT_GAP_CLASS_NAME}
        data-testid="subscriptions-report-past-drops"
      >
        <div>
          {redeemedCounts?.length > 0 ? (
            <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/60">
              <span className="tw-sr-only">
                Past meme card subscription redemptions
              </span>
              <div
                className={`${STANDARD_REPORT_GRID_CLASS_NAME} ${REPORT_TABLE_HEADER_CLASS_NAME}`}
                aria-hidden="true"
              >
                <span>Meme Card</span>
                <span className="tw-text-center">Subscriptions</span>
              </div>
              <div>
                {redeemedCounts.map((count) => (
                  <RedeemedSubscriptionRow
                    key={getMemeTokenIdKey(count.token_id)}
                    count={count}
                  />
                ))}
              </div>
            </div>
          ) : (
            renderEmptyState(redeemedLoading, "past")
          )}
        </div>
      </div>
      {totalRedeemed > PAGE_SIZE && redeemedPage !== null && (
        <div
          className="tw-py-4 tw-text-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <Pagination
            page={redeemedPage}
            pageSize={PAGE_SIZE}
            totalResults={totalRedeemed}
            setPage={(newPage: number) => {
              setRedeemedPage(newPage);
              pastDropsTarget.current?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          />
        </div>
      )}
      {shouldShowDownloadSection && (
        <div className={REPORT_MAJOR_SECTION_GAP_CLASS_NAME}>
          <div>
            <div className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-5`}>
              <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
                <h2
                  className={`${REPORT_SECTION_HEADING_CLASS_NAME} tw-flex tw-min-h-11 tw-items-center`}
                >
                  Redeemed Subscriptions Report
                </h2>
                <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-stretch lg:tw-w-auto lg:tw-shrink-0">
                  {availableSeasons.length > 0 && (
                    <div className="tw-relative tw-mb-0 tw-min-w-[190px] sm:tw-w-52">
                      <select
                        id="redeemed-meme-subscription-season"
                        aria-label="Redeemed meme subscription counts season"
                        className={`tw-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-py-0 tw-pl-4 tw-pr-11 tw-text-sm tw-font-medium tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 ${isDownloadingCsv ? "tw-pointer-events-none tw-opacity-50" : ""}`}
                        value={selectedSeasonId}
                        onChange={(e) => {
                          setSelectedSeasonId(e.currentTarget.value);
                        }}
                      >
                        <option value="">All seasons</option>
                        {[...availableSeasons].reverse().map((season) => (
                          <option key={season.id} value={season.id.toString()}>
                            {season.display}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon
                        className="tw-pointer-events-none tw-absolute tw-right-3.5 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-300"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={onDownloadCsv}
                    loading={isDownloadingCsv}
                    variant="action"
                    size="lg"
                    className="tw-self-start"
                  >
                    {isDownloadingCsv ? (
                      "Downloading"
                    ) : (
                      <>
                        <ArrowDownTrayIcon
                          className="tw-size-4"
                          aria-hidden="true"
                        />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getRedeemedCsvFilename(season: MemeSeason | null): string {
  if (season) {
    return `redeemed-meme-subscription-counts-szn-${season.id}.csv`;
  }

  return "redeemed-meme-subscription-counts-all-seasons.csv";
}
