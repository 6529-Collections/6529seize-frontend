"use client";

import styles from "./SubscriptionsReport.module.css";
import SubscriptionsReportRow from "./SubscriptionsReportRow";
import AboutSubscriptionsProfileButton from "@/components/about/AboutSubscriptionsProfileButton";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { publicEnv } from "@/config/env";
import type { MemeSeason } from "@/entities/ISeason";
import type { SeasonMintRow } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  displayedSeasonNumberFromIndex,
  formatFullDate,
  getCardsRemainingUntilEndOf,
  getUpcomingMintsAcrossSeasons,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { Paginated } from "@/components/pagination/Pagination";
import Pagination from "@/components/pagination/Pagination";
import ShowMoreButton from "@/components/show-more-button/ShowMoreButton";
import type { RedeemedSubscriptionCounts } from "@/generated/models/RedeemedSubscriptionCounts";
import type { SubscriptionCounts } from "@/generated/models/SubscriptionCounts";
import { Time } from "@/helpers/time";
import { commonApiFetch } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { sanitizeErrorForUser } from "@/utils/error-sanitizer";
import Image from "next/image";
import Link from "next/link";
import useDownloader from "@/hooks/useDownloader";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 10;
const UPCOMING_PAGE_SIZE = 5;
// The link's pseudo-element stretches across the positioned table row,
// preserving row semantics while making the whole row a native link target.
const TABLE_ROW_LINK_CLASS_NAME =
  "tw-static tw-block tw-min-w-0 tw-text-white tw-no-underline before:tw-absolute before:tw-inset-0 before:tw-z-[1] before:tw-content-[''] focus-visible:tw-outline-none focus-visible:before:tw-ring-2 focus-visible:before:tw-ring-inset focus-visible:before:tw-ring-primary-300";
const TABLE_ROW_LINK_TEXT_CLASS_NAME = "tw-relative tw-z-[2]";

function isRedeemedDropFromToday(drop: RedeemedSubscriptionCounts): boolean {
  return (
    Time.fromString(drop.mint_date).toIsoDateString() ===
    Time.now().toIsoDateString()
  );
}

function getActiveRedeemedDrop(
  drops: RedeemedSubscriptionCounts[],
  mintingToday: boolean
): RedeemedSubscriptionCounts | null {
  if (!mintingToday) {
    return null;
  }

  return drops.find(isRedeemedDropFromToday) ?? null;
}

function withoutTokenId<T extends { token_id: number }>(
  drops: T[],
  tokenId: number | null
): T[] {
  if (tokenId === null) {
    return drops;
  }

  return drops.filter((drop) => drop.token_id !== tokenId);
}

function formatSubscriptionCount(count: number): string {
  return count > 0 ? count.toLocaleString() : "0";
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
  const firstNewRowRef = useRef<HTMLTableRowElement>(null);
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
      const mintingToday = isMintingToday();
      let remainingCountForSeason = getCardsRemainingUntilEndOf("szn");
      let activeRedeemedDrop: RedeemedSubscriptionCounts | null = null;

      try {
        const redeemed = await fetchRedeemedCounts(1);
        activeRedeemedDrop = getActiveRedeemedDrop(redeemed.data, mintingToday);
        activeTokenIdRef.current = activeRedeemedDrop?.token_id ?? null;
        setActiveDrop(activeRedeemedDrop);
        setRedeemedCounts(
          withoutTokenId(redeemed.data, activeRedeemedDrop?.token_id ?? null)
        );
        setTotalRedeemed(
          getDisplayedRedeemedTotal(
            redeemed.count,
            activeRedeemedDrop?.token_id ?? null
          )
        );
      } catch (error) {
        console.error("Failed to fetch redeemed subscriptions:", error);
        activeTokenIdRef.current = null;
        setActiveDrop(null);
        setRedeemedCounts([]);
        setTotalRedeemed(0);
      }

      if (mintingToday && !activeRedeemedDrop) {
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
          activeRedeemedDrop
            ? fetchSubscribedCount(activeRedeemedDrop.token_id).catch(
                (error: unknown) => {
                  console.error(
                    "Failed to fetch active drop subscribed count:",
                    error
                  );
                  return null;
                }
              )
            : Promise.resolve(null),
        ]);

        setActiveSubscribedCount(subscribedCount);
        setUpcomingCounts(
          withoutTokenId(upcoming, activeRedeemedDrop?.token_id ?? null)
        );
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
        <span className="tw-animate-pulse tw-text-sm tw-text-gray-400">
          Loading {type} drops...
        </span>
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
    <div className="tw-container tw-mx-auto tw-px-2 tw-py-5 lg:tw-px-6 xl:tw-px-8">
      <div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between">
          <h1>Subscriptions Report</h1>
          <div className="tw-flex tw-items-center tw-gap-3">
            <AboutSubscriptionsProfileButton />
            <Link
              href="/about/subscriptions"
              className="decoration-hover-underline"
              aria-label="Learn more about The Memes subscriptions"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
      {activeDrop && (
        <>
          <div className="tw-pt-3">
            <div className="tw-flex tw-items-center tw-gap-3">
              <span className="tw-text-lg tw-font-bold tw-no-underline">
                Active Drop
              </span>
            </div>
          </div>
          <div
            className="tw-pt-3"
            data-testid="subscriptions-report-active-drop"
          >
            <table className="tw-w-full tw-border-separate tw-border-spacing-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-primary-400/40 tw-bg-iron-900">
              <caption className="tw-sr-only">
                Table listing the active meme card subscribed and airdropped
                subscription counts
              </caption>
              <thead>
                <tr className="tw-bg-primary-500/10 tw-text-left tw-text-sm tw-uppercase tw-tracking-wider tw-text-gray-300">
                  <th className="tw-w-1/2 tw-border-b tw-border-primary-400/30 tw-px-6 tw-py-3 tw-font-semibold">
                    Meme Card
                  </th>
                  <th className="tw-w-1/4 tw-border-b tw-border-primary-400/30 tw-px-6 tw-py-3 tw-text-center tw-font-semibold">
                    Subscribed
                  </th>
                  <th className="tw-w-1/4 tw-border-b tw-border-primary-400/30 tw-px-6 tw-py-3 tw-text-center tw-font-semibold">
                    Airdropped
                  </th>
                </tr>
              </thead>
              <tbody>
                <SubscriptionsReportRow className="tw-bg-iron-800 hover:tw-bg-iron-700">
                  <ActiveSubscriptionDetails
                    count={activeDrop}
                    subscribedCount={activeSubscribedCount}
                  />
                </SubscriptionsReportRow>
              </tbody>
            </table>
          </div>
        </>
      )}
      <div ref={upcomingTableTopRef} />
      <div className={activeDrop ? "tw-pt-8" : "tw-pt-3"}>
        <div className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-text-lg tw-font-bold tw-no-underline">
            Upcoming Drops
          </span>
          {upcomingLoading && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </div>
      </div>
      <div
        className="tw-pt-3"
        data-testid="subscriptions-report-upcoming-drops"
      >
        <div>
          {upcomingCounts?.length > 0 ? (
            <>
              <table className="tw-w-full tw-border-separate tw-border-spacing-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-900">
                <caption className="tw-sr-only">
                  Table listing upcoming meme card subscriptions
                </caption>
                <thead>
                  <tr className="tw-bg-iron-900 tw-text-left tw-text-sm tw-uppercase tw-tracking-wider tw-text-gray-300">
                    <th className="tw-w-3/4 tw-border-b tw-border-iron-700 tw-px-6 tw-py-3 tw-font-semibold">
                      Meme Card
                    </th>
                    <th className="tw-w-1/4 tw-border-b tw-border-iron-700 tw-px-6 tw-py-3 tw-text-center tw-font-semibold">
                      Subscriptions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingCounts
                    .slice(0, upcomingVisible)
                    .map((count, index) => {
                      const isNew =
                        animateFromIndex !== null && index >= animateFromIndex;
                      return (
                        <SubscriptionsReportRow
                          key={count.token_id}
                          ref={
                            index === animateFromIndex ? firstNewRowRef : null
                          }
                          className={[
                            index % 2 === 0
                              ? "tw-bg-iron-800 hover:tw-bg-iron-700"
                              : "tw-bg-iron-900 hover:tw-bg-iron-700",
                            isNew ? styles["upcomingRowNew"] : "",
                          ].join(" ")}
                        >
                          <SubscriptionDayDetails
                            date={rows[index]!}
                            count={count}
                          />
                        </SubscriptionsReportRow>
                      );
                    })}
                </tbody>
              </table>
              {upcomingCounts.length > UPCOMING_PAGE_SIZE && (
                <div ref={upcomingToggleRef} className="tw-pt-3 tw-text-center">
                  {upcomingVisible < upcomingCounts.length ? (
                    <ShowMoreButton
                      expanded={false}
                      setExpanded={() => {
                        setAnimateFromIndex(upcomingVisible);
                        setUpcomingVisible((prev) =>
                          Math.min(
                            prev + UPCOMING_PAGE_SIZE,
                            upcomingCounts.length
                          )
                        );
                      }}
                    />
                  ) : (
                    <ShowMoreButton
                      expanded={true}
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
      <div ref={pastDropsTarget} className="tw-pt-5">
        <div className="tw-flex tw-items-center tw-gap-3">
          <span className="tw-text-lg tw-font-bold tw-no-underline">
            Past Drops
          </span>
          {redeemedLoading && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </div>
      </div>
      <div className="tw-pt-3" data-testid="subscriptions-report-past-drops">
        <div>
          {redeemedCounts?.length > 0 ? (
            <table className="tw-w-full tw-border-separate tw-border-spacing-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-900">
              <caption className="tw-sr-only">
                Table listing past meme card subscription redemptions
              </caption>
              <thead>
                <tr className="tw-bg-iron-900 tw-text-left tw-text-sm tw-uppercase tw-tracking-wider tw-text-gray-300">
                  <th className="tw-w-3/4 tw-border-b tw-border-iron-700 tw-px-6 tw-py-3 tw-font-semibold">
                    Meme Card
                  </th>
                  <th className="tw-w-1/4 tw-border-b tw-border-iron-700 tw-px-6 tw-py-3 tw-text-center tw-font-semibold">
                    Subscriptions
                  </th>
                </tr>
              </thead>
              <tbody>
                {redeemedCounts.map((count, index) => (
                  <SubscriptionsReportRow
                    key={count.token_id}
                    className={
                      index % 2 === 0
                        ? "tw-bg-iron-800 hover:tw-bg-iron-700"
                        : "tw-bg-iron-900 hover:tw-bg-iron-700"
                    }
                  >
                    <RedeemedSubscriptionDetails count={count} />
                  </SubscriptionsReportRow>
                ))}
              </tbody>
            </table>
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
        <div className="tw-pt-5">
          <div>
            <div className="tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-900/95 tw-p-4 tw-shadow-sm md:tw-p-5">
              <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
                <h2 className="tw-m-0 tw-flex tw-min-h-11 tw-items-center tw-text-base tw-font-semibold tw-leading-6 tw-text-white md:tw-text-lg">
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
                  <button
                    type="button"
                    onClick={onDownloadCsv}
                    disabled={isDownloadingCsv}
                    className="tw-flex tw-h-11 tw-min-w-[190px] tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black disabled:tw-cursor-not-allowed disabled:tw-opacity-60 sm:tw-w-52"
                  >
                    {isDownloadingCsv ? (
                      <>
                        <svg
                          className="tw-h-4 tw-w-4 tw-animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="tw-opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="tw-opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Downloading
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon
                          className="tw-size-4"
                          aria-hidden="true"
                        />
                        Download
                      </>
                    )}
                  </button>
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

function MemeCardDetails(
  props: Readonly<{
    count: RedeemedSubscriptionCounts;
  }>
) {
  const dateTime = Time.fromString(props.count.mint_date);
  return (
    <td className="tw-border-t tw-border-iron-700 tw-px-6 tw-py-4 tw-align-middle tw-text-white">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <div className="tw-flex tw-h-[50px] tw-w-[50px] tw-shrink-0 tw-items-center tw-justify-center">
          <Image
            unoptimized
            src={props.count.image_url}
            alt={props.count.name || "Meme card"}
            width={0}
            height={0}
            className="tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-rounded-sm"
          />
        </div>
        <div className="tw-flex tw-flex-col">
          <Link
            href={`/the-memes/${props.count.token_id}`}
            className={TABLE_ROW_LINK_CLASS_NAME}
            aria-label={`View The Memes card #${props.count.token_id} - ${props.count.name}`}
          >
            <span className={TABLE_ROW_LINK_TEXT_CLASS_NAME}>
              #{props.count.token_id} - {props.count.name}
            </span>
          </Link>
          <span className="tw-text-sm tw-text-gray-400">
            SZN {props.count.szn}
            {" / "}
            {formatFullDate(dateTime.toDate())}
          </span>
        </div>
      </div>
    </td>
  );
}

function SubscriptionCountCell(
  props: Readonly<{
    children: string;
  }>
) {
  return (
    <td className="tw-border-t tw-border-iron-700 tw-px-6 tw-py-4 tw-text-center tw-align-middle tw-text-white">
      {props.children}
    </td>
  );
}

function ActiveSubscriptionDetails(
  props: Readonly<{
    count: RedeemedSubscriptionCounts;
    subscribedCount: SubscriptionCounts | null;
  }>
) {
  const subscribed =
    props.subscribedCount?.token_id === props.count.token_id
      ? formatSubscriptionCount(props.subscribedCount.count)
      : "Unavailable";

  return (
    <>
      <MemeCardDetails count={props.count} />
      <SubscriptionCountCell>{subscribed}</SubscriptionCountCell>
      <SubscriptionCountCell>
        {formatSubscriptionCount(props.count.count)}
      </SubscriptionCountCell>
    </>
  );
}

function SubscriptionDayDetails(
  props: Readonly<{
    count: SubscriptionCounts;
    date: SeasonMintRow;
  }>
) {
  return (
    <>
      <td className="tw-border-t tw-border-iron-700 tw-px-6 tw-py-4 tw-align-middle tw-text-white">
        <div className="tw-flex tw-flex-col">
          <Link
            href={`/the-memes/${props.count.token_id}`}
            className={TABLE_ROW_LINK_CLASS_NAME}
            aria-label={`View The Memes card #${props.count.token_id}`}
          >
            <span className={TABLE_ROW_LINK_TEXT_CLASS_NAME}>
              The Memes #{props.count.token_id}
            </span>
          </Link>
          <span className="tw-text-sm tw-text-gray-400">
            SZN {displayedSeasonNumberFromIndex(props.date.seasonIndex)}
            {" / "}
            {formatFullDate(props.date.utcDay, "utc")}
          </span>
        </div>
      </td>
      <td className="tw-border-t tw-border-iron-700 tw-px-6 tw-py-4 tw-text-center tw-align-middle tw-text-white">
        {formatSubscriptionCount(props.count.count)}
      </td>
    </>
  );
}

function RedeemedSubscriptionDetails(
  props: Readonly<{
    count: RedeemedSubscriptionCounts;
  }>
) {
  return (
    <>
      <MemeCardDetails count={props.count} />
      <SubscriptionCountCell>
        {formatSubscriptionCount(props.count.count)}
      </SubscriptionCountCell>
    </>
  );
}
