"use client";

import { Container, Row, Col } from "react-bootstrap";
import {
  SubscriptionCounts,
  RedeemedSubscriptionCounts,
} from "../../entities/ISubscription";
import {
  getMintingDates,
  isMintingToday,
  numberOfCardsForSeasonEnd,
} from "../../helpers/meme_calendar.helpers";
import { Time } from "../../helpers/time";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { commonApiFetch } from "../../services/api/common-api";
import Pagination, { Paginated } from "../pagination/Pagination";
import CircleLoader, {
  CircleLoaderSize,
} from "../distribution-plan-tool/common/CircleLoader";
import { useAuth } from "../auth/Auth";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import useCapacitor from "../../hooks/useCapacitor";

const PAGE_SIZE = 20;

export default function SubscriptionsReportComponent() {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { connectedProfile } = useAuth();
  const pastDropsTarget = useRef<HTMLDivElement>(null);

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

  const [dates, setDates] = useState<Time[]>([]);

  const [remainingMintsForSeason, setRemainingMintsForSeason] = useState<{
    szn: number;
    count: number;
  }>(numberOfCardsForSeasonEnd());

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const remainingMintsForSeason = numberOfCardsForSeasonEnd();
        const redeemed = await fetchRedeemedCounts(1);
        if (isMintingToday()) {
          const latestDrop = redeemed.data[0];
          if (latestDrop?.mint_date) {
            const mintDate = Time.fromString(latestDrop.mint_date);
            if (mintDate.toIsoDateString() !== Time.now().toIsoDateString()) {
              remainingMintsForSeason.count += 1;
            }
          }
        }
        const upcoming = await fetchUpcomingCounts(
          remainingMintsForSeason.count
        );

        const addDays = redeemed.data.some((r) => {
          const mintDate = Time.fromString(r.mint_date);
          return mintDate.toIsoDateString() === Time.now().toIsoDateString();
        })
          ? 1
          : 0;

        setRedeemedCounts(redeemed.data);
        setTotalRedeemed(redeemed.count);
        setUpcomingCounts(upcoming);
        setDates(getMintingDates(upcoming.length, addDays));
        setRemainingMintsForSeason(remainingMintsForSeason);
      } finally {
        setRedeemedLoading(false);
        setUpcomingLoading(false);
      }
    };
    fetchData();
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
        <span className="tw-text-gray-400 tw-text-sm tw-animate-pulse">
          Loading {type} drops...
        </span>
      );
    }
    return <>No Subscriptions Found</>;
  }

  return (
    <Container className="pt-4">
      <Row>
        <Col className="d-flex flex-wrap align-items-center justify-content-between">
          <h1>
            <span className="font-lightest">Subscriptions</span> Report
          </h1>
          <div className="tw-flex tw-items-center tw-gap-3">
            {connectedProfile && (!capacitor.isIos || country === "US") && (
              <Link
                href={`/${connectedProfile.normalised_handle}/subscriptions`}
                className="decoration-none"
                aria-label="Learn more about The Memes subscriptions">
                <button className="tw-p-2 tw-bg-primary-500 hover:tw-bg-primary-600 tw-rounded-lg tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out">
                  My Subscriptions
                </button>
              </Link>
            )}
            <Link
              href="/about/subscriptions"
              className="decoration-hover-underline"
              aria-label="Learn more about The Memes subscriptions">
              Learn More
            </Link>
          </div>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col className="tw-flex tw-items-center tw-gap-3">
          <span className="font-larger font-bolder decoration-none">
            Upcoming Drops for SZN{remainingMintsForSeason.szn}
          </span>
          {upcomingLoading && <CircleLoader size={CircleLoaderSize.MEDIUM} />}
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          {upcomingCounts?.length > 0 ? (
            <table className="tw-w-full tw-rounded-xl tw-overflow-hidden tw-bg-iron-900 tw-border tw-border-iron-700 tw-border-separate tw-border-spacing-0">
              <caption className="tw-sr-only">
                Table listing upcoming meme card subscriptions
              </caption>
              <thead>
                <tr className="tw-bg-iron-900 tw-text-left tw-text-sm tw-uppercase tw-tracking-wider tw-text-gray-300">
                  <th className="tw-px-6 tw-py-3 tw-w-3/4 tw-border-b tw-border-iron-700 tw-font-semibold">
                    Meme Card
                  </th>
                  <th className="tw-px-6 tw-py-3 tw-w-1/4 tw-text-center tw-border-b tw-border-iron-700 tw-font-semibold">
                    Subscriptions
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingCounts.map((count, index) => (
                  <tr
                    key={count.token_id}
                    className={
                      index % 2 === 0
                        ? "tw-bg-iron-800 hover:tw-bg-iron-700"
                        : "tw-bg-iron-900 hover:tw-bg-iron-700"
                    }>
                    <SubscriptionDayDetails date={dates[index]} count={count} />
                  </tr>
                ))}
              </tbody>
            </table>
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
      <Row className="pt-3">
        <Col>
          {redeemedCounts?.length > 0 ? (
            <table className="tw-w-full tw-rounded-xl tw-overflow-hidden tw-bg-iron-900 tw-border tw-border-iron-700 tw-border-separate tw-border-spacing-0">
              <caption className="tw-sr-only">
                Table listing past meme card subscription redemptions
              </caption>
              <thead>
                <tr className="tw-bg-iron-900 tw-text-left tw-text-sm tw-uppercase tw-tracking-wider tw-text-gray-300">
                  <th className="tw-px-6 tw-py-3 tw-w-3/4 tw-border-b tw-border-iron-700 tw-font-semibold">
                    Meme Card
                  </th>
                  <th className="tw-px-6 tw-py-3 tw-w-1/4 tw-text-center tw-border-b tw-border-iron-700 tw-font-semibold">
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
                    }>
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
          className="tw-text-center tw-pt-2 tw-pb-3"
          aria-live="polite"
          aria-atomic="true">
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
    </Container>
  );
}

function SubscriptionDayDetails(
  props: Readonly<{
    count: SubscriptionCounts;
    date: Time;
  }>
) {
  return (
    <>
      <td className="tw-px-6 tw-py-4 tw-align-middle tw-text-white tw-border-t tw-border-iron-700">
        <div className="tw-flex tw-flex-col">
          <span>The Memes #{props.count.token_id}</span>
          <span className="tw-text-gray-400 tw-text-sm">
            {props.date.toIsoDateString()} / {props.date.toDayName()}
          </span>
        </div>
      </td>
      <td className="tw-px-6 tw-py-4 tw-text-center tw-align-middle tw-text-white tw-border-t tw-border-iron-700">
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
      <td className="tw-px-6 tw-py-4 tw-align-middle tw-text-white tw-border-t tw-border-iron-700">
        <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
          <div className="tw-w-[50px] tw-h-[50px] tw-flex tw-items-center tw-justify-center tw-shrink-0">
            <Image
              src={props.count.image_url}
              alt={props.count.name || "Meme card"}
              width={0}
              height={0}
              className="tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-rounded-xs"
            />
          </div>
          <div className="tw-flex tw-flex-col">
            <Link
              href={`/the-memes/${props.count.token_id}`}
              className="decoration-hover-underline tw-text-white"
              aria-label={`View The Memes card #${props.count.token_id} - ${props.count.name}`}>
              #{props.count.token_id} - {props.count.name}
            </Link>
            <span className="tw-text-gray-400 tw-text-sm">
              {dateTime.toIsoDateString()} / {dateTime.toDayName()} / SZN
              {props.count.szn}
            </span>
          </div>
        </div>
      </td>
      <td className="tw-px-6 tw-py-4 tw-text-center tw-align-middle tw-text-white tw-border-t tw-border-iron-700">
        {props.count.count > 0 ? props.count.count.toLocaleString() : "0"}
      </td>
    </>
  );
}
