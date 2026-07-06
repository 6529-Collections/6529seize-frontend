"use client";

import type { SeasonMintRow } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  displayedSeasonNumberFromIndex,
  formatFullDate,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { RedeemedSubscriptionCounts } from "@/generated/models/RedeemedSubscriptionCounts";
import type { SubscriptionCounts } from "@/generated/models/SubscriptionCounts";
import { Time } from "@/helpers/time";
import Image from "next/image";
import Link from "next/link";
import { forwardRef } from "react";

export const ACTIVE_REPORT_GRID_CLASS_NAME =
  "sm:tw-grid-cols-[minmax(0,2fr)_minmax(5.5rem,1fr)_minmax(5.5rem,1fr)]";
export const STANDARD_REPORT_GRID_CLASS_NAME =
  "sm:tw-grid-cols-[minmax(0,3fr)_minmax(6rem,1fr)]";

const REPORT_ROW_LINK_CLASS_NAME =
  "tw-grid tw-w-full tw-items-center tw-gap-3 tw-border-t tw-border-iron-700 tw-px-4 tw-py-4 tw-text-white tw-no-underline tw-transition hover:tw-bg-iron-700 hover:tw-text-white hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-300 sm:tw-gap-4 sm:tw-px-6";
const REPORT_ROW_TITLE_CLASS_NAME =
  "tw-text-sm tw-leading-5 tw-text-white sm:tw-text-base";
const REPORT_ROW_META_CLASS_NAME = "tw-text-sm tw-leading-5 tw-text-gray-400";

function formatSubscriptionCount(count: number): string {
  return count > 0 ? count.toLocaleString() : "0";
}

function MemeCardSummary(
  props: Readonly<{
    count: RedeemedSubscriptionCounts;
    className?: string;
  }>
) {
  const dateTime = Time.fromString(props.count.mint_date);

  return (
    <div
      className={`tw-flex tw-min-w-0 tw-items-center tw-gap-3 ${props.className ?? ""}`}
    >
      <div className="tw-flex tw-h-12 tw-w-12 tw-shrink-0 tw-items-center tw-justify-center sm:tw-h-[50px] sm:tw-w-[50px]">
        <Image
          unoptimized
          src={props.count.image_url}
          alt={props.count.name || "Meme card"}
          width={0}
          height={0}
          className="tw-h-auto tw-max-h-full tw-w-auto tw-max-w-full tw-rounded-sm"
        />
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-col">
        <span className={REPORT_ROW_TITLE_CLASS_NAME}>
          #{props.count.token_id} - {props.count.name}
        </span>
        <span className={REPORT_ROW_META_CLASS_NAME}>
          SZN {props.count.szn}
          {" / "}
          {formatFullDate(dateTime.toDate())}
        </span>
      </div>
    </div>
  );
}

function ReportCountStat(
  props: Readonly<{
    label: string;
    value: string;
    active?: boolean;
    showMobileLabel?: boolean;
  }>
) {
  const showMobileLabel = props.showMobileLabel ?? props.active ?? false;

  return (
    <span
      className={[
        "tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5",
        props.active
          ? "tw-items-start tw-rounded-lg tw-bg-black/15 tw-p-3 tw-ring-1 tw-ring-white/5 sm:tw-items-center sm:tw-rounded-none sm:tw-bg-transparent sm:tw-p-0 sm:tw-ring-0"
          : "tw-shrink-0 tw-items-end sm:tw-items-center",
      ].join(" ")}
    >
      {showMobileLabel ? (
        <span className="tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-gray-400 sm:tw-hidden">
          {props.label}
        </span>
      ) : (
        <span className="tw-sr-only">{props.label}: </span>
      )}
      <span className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-white sm:tw-text-base sm:tw-font-normal">
        {props.value}
      </span>
    </span>
  );
}

export function ActiveSubscriptionRow(
  props: Readonly<{
    className: string;
    count: RedeemedSubscriptionCounts;
    subscribedCount: SubscriptionCounts | null;
  }>
) {
  const subscribed =
    props.subscribedCount?.token_id === props.count.token_id
      ? formatSubscriptionCount(props.subscribedCount.count)
      : "Unavailable";

  return (
    <Link
      href={`/the-memes/${props.count.token_id}`}
      className={`${REPORT_ROW_LINK_CLASS_NAME} tw-grid-cols-2 ${ACTIVE_REPORT_GRID_CLASS_NAME} ${props.className}`}
      aria-label={`View The Memes card #${props.count.token_id} - ${props.count.name}`}
    >
      <MemeCardSummary
        count={props.count}
        className="tw-col-span-2 sm:tw-col-span-1"
      />
      <ReportCountStat label="Subscribed" value={subscribed} active />
      <ReportCountStat
        label="Airdropped"
        value={formatSubscriptionCount(props.count.count)}
        active
      />
    </Link>
  );
}

export const SubscriptionDayRow = forwardRef<
  HTMLAnchorElement,
  Readonly<{
    className: string;
    count: SubscriptionCounts;
    date: SeasonMintRow;
  }>
>(function SubscriptionDayRow({ className, count, date }, ref) {
  return (
    <Link
      ref={ref}
      href={`/the-memes/${count.token_id}`}
      className={`${REPORT_ROW_LINK_CLASS_NAME} tw-grid-cols-[minmax(0,1fr)_auto] ${STANDARD_REPORT_GRID_CLASS_NAME} ${className}`}
      aria-label={`View The Memes card #${count.token_id}`}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-col">
        <span className={REPORT_ROW_TITLE_CLASS_NAME}>
          The Memes #{count.token_id}
        </span>
        <span className={REPORT_ROW_META_CLASS_NAME}>
          SZN {displayedSeasonNumberFromIndex(date.seasonIndex)}
          {" / "}
          {formatFullDate(date.utcDay, "utc")}
        </span>
      </div>
      <ReportCountStat
        label="Subscriptions"
        value={formatSubscriptionCount(count.count)}
      />
    </Link>
  );
});

export function RedeemedSubscriptionRow(
  props: Readonly<{
    className: string;
    count: RedeemedSubscriptionCounts;
  }>
) {
  return (
    <Link
      href={`/the-memes/${props.count.token_id}`}
      className={`${REPORT_ROW_LINK_CLASS_NAME} tw-grid-cols-[minmax(0,1fr)_auto] ${STANDARD_REPORT_GRID_CLASS_NAME} ${props.className}`}
      aria-label={`View The Memes card #${props.count.token_id} - ${props.count.name}`}
    >
      <MemeCardSummary count={props.count} />
      <ReportCountStat
        label="Subscriptions"
        value={formatSubscriptionCount(props.count.count)}
      />
    </Link>
  );
}
