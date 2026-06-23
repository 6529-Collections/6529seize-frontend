"use client";

import styles from "./SubscriptionsReport.module.css";
import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { publicEnv } from "@/config/env";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
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
import useCapacitor from "@/hooks/useCapacitor";
import { commonApiFetch } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { sanitizeErrorForUser } from "@/utils/error-sanitizer";
import Image from "next/image";
import Link from "next/link";
import useDownloader from "@/hooks/useDownloader";
import { useEffect, useMemo, useRef, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";

const PAGE_SIZE = 10;

export default function SubscriptionsReportComponent() {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { connectedProfile, setToast } = useAuth();
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: capacitor.isIos,
    country,
  });
  const pastDropsTarget = useRef<HTMLDivElement>(null);
  const upcomingToggleRef = useRef<HTMLDivElement>(null);
  const upcomingTableTopRef = useRef<HTMLDivElement>(null);

  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingCounts, setUpcomingCounts] = useState<SubscriptionCounts[]>(
    []
  );

  const [redeemedLoading, setRedeemedLoading] = useState(true);
  const [redeemedCounts, setRedeemedCounts] = useState<
    RedeemedSubscriptionCounts[]
  >([]);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [redeemedPage, setRedeemedPage] = useState<number>(1);
  const UPCOMING_PAGE_SIZE = 5;
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

  async function fetchSeasons() {
    return await commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        let remainingCountForSeason = getCardsRemainingUntilEndOf("szn");
        const redeemed = await fetchRedeemedCounts(1);
        if (isMintingToday()) {
          const latestDrop = redeemed.data[0];
          if (latestDrop?.mint_date) {
            const mintDate = Time.fromString(latestDrop.mint_date);
            if (mintDate.toIsoDateString() !== Time.now().toIsoDateString()) {
              remainingCountForSeason += 1;
            }
          }
        }
        const upcoming = await fetchUpcomingCounts(remainingCountForSeason);

        setRedeemedCounts(redeemed.data);
        setTotalRedeemed(redeemed.count);
        setUpcomingCounts(upcoming);
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
        setRedeemedCounts(redeemed.data);
        setTotalRedeemed(redeemed.count);
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
    <Container className="tw-mx-auto tw-px-2 tw-py-5 lg:tw-px-6 xl:tw-px-8">
      <Row>
        <Col className="d-flex flex-wrap align-items-center justify-content-between">
          <h1>Subscriptions Report</h1>
          <div className="tw-flex tw-items-center tw-gap-3">
            {connectedProfile && !hideSubscriptions && (
              <Link
                href={`/${connectedProfile.normalised_handle}/subscriptions`}
                className="decoration-none"
                aria-label="Learn more about The Memes subscriptions"
              >
                <button className="tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-p-2 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600">
                  My Subscriptions
                </button>
              </Link>
            )}
            <Link
              href="/about/subscriptions"
              className="decoration-hover-underline"
              aria-label="Learn more about The Memes subscriptions"
            >
              Learn More
            </Link>
          </div>
        </Col>
      </Row>
      <div ref={upcomingTableTopRef} />
      <Row className="pt-3">
        <Col className="tw-flex tw-items-center tw-gap-3">
          <span className="font-larger font-bolder decoration-none">
            Upcoming Drops
          </span>
          {upcomingLoading && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </Col>
      </Row>
      <Row className="pt-3" data-testid="subscriptions-report-upcoming-drops">
        <Col>
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
                        <tr
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
                        </tr>
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
        </Col>
      </Row>
      <Row className="pt-5">
        <Col className="tw-flex tw-items-center tw-gap-3">
          <span className="font-larger font-bolder decoration-none">
            Past Drops
          </span>
          {redeemedLoading && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </Col>
      </Row>
      <Row className="pt-3" data-testid="subscriptions-report-past-drops">
        <Col>
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
                  <tr
                    key={count.token_id}
                    className={
                      index % 2 === 0
                        ? "tw-bg-iron-800 hover:tw-bg-iron-700"
                        : "tw-bg-iron-900 hover:tw-bg-iron-700"
                    }
                  >
                    <RedeemedSubscriptionDetails count={count} />
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            renderEmptyState(redeemedLoading, "past")
          )}
        </Col>
      </Row>
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
        <Row className="pt-5">
          <Col>
            <div className="tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-900 tw-p-5">
              <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
                <h2 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-white">
                  Redeemed Subscriptions Report
                </h2>
                <div className="tw-flex tw-w-full tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center lg:tw-w-auto lg:tw-shrink-0">
                  {availableSeasons.length > 0 && (
                    <Form.Group className="tw-mb-0 tw-min-w-[180px]">
                      <Form.Select
                        id="redeemed-meme-subscription-season"
                        aria-label="Redeemed meme subscription counts season"
                        className={`tw-h-9 tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-text-sm tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 ${isDownloadingCsv ? "tw-pointer-events-none tw-opacity-50" : ""}`}
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
                      </Form.Select>
                    </Form.Group>
                  )}
                  <button
                    type="button"
                    onClick={onDownloadCsv}
                    disabled={isDownloadingCsv}
                    className="tw-flex tw-h-9 tw-min-w-[180px] tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
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
                      "Download"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
}

function getRedeemedCsvFilename(season: MemeSeason | null): string {
  if (season) {
    return `redeemed-meme-subscription-counts-szn-${season.id}.csv`;
  }

  return "redeemed-meme-subscription-counts-all-seasons.csv";
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
          <span>The Memes #{props.count.token_id}</span>
          <span className="tw-text-sm tw-text-gray-400">
            SZN {displayedSeasonNumberFromIndex(props.date.seasonIndex)}
            {" / "}
            {formatFullDate(props.date.utcDay, "utc")}
          </span>
        </div>
      </td>
      <td className="tw-border-t tw-border-iron-700 tw-px-6 tw-py-4 tw-text-center tw-align-middle tw-text-white">
        {props.count.count > 0 ? props.count.count.toLocaleString() : "0"}
      </td>
    </>
  );
}

function RedeemedSubscriptionDetails(
  props: Readonly<{
    count: RedeemedSubscriptionCounts;
  }>
) {
  const dateTime = Time.fromString(props.count.mint_date);
  return (
    <>
      <td className="tw-border-t tw-border-iron-700 tw-px-6 tw-py-4 tw-align-middle tw-text-white">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <div className="tw-flex tw-h-[50px] tw-w-[50px] tw-shrink-0 tw-items-center tw-justify-center">
            <Image
              unoptimized
              src={props.count.image_url}
              alt={props.count.name || "Meme card"}
              width={0}
              height={0}
              className="tw-rounded-xs tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full"
            />
          </div>
          <div className="tw-flex tw-flex-col">
            <Link
              href={`/the-memes/${props.count.token_id}`}
              className="decoration-hover-underline tw-text-white"
              aria-label={`View The Memes card #${props.count.token_id} - ${props.count.name}`}
            >
              #{props.count.token_id} - {props.count.name}
            </Link>
            <span className="tw-text-sm tw-text-gray-400">
              SZN {props.count.szn}
              {" / "}
              {formatFullDate(dateTime.toDate())}
            </span>
          </div>
        </div>
      </td>
      <td className="tw-border-t tw-border-iron-700 tw-px-6 tw-py-4 tw-text-center tw-align-middle tw-text-white">
        {props.count.count > 0 ? props.count.count.toLocaleString() : "0"}
      </td>
    </>
  );
}
