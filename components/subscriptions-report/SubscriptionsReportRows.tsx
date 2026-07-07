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
import { forwardRef, type ReactNode } from "react";
import {
  areMemeTokenIdsEqual,
  getMemeTokenIdLabel,
} from "./SubscriptionsReport.utils";

export const ACTIVE_REPORT_GRID_CLASS_NAME =
  "sm:tw-grid-cols-[minmax(0,2fr)_minmax(5.5rem,1fr)_minmax(5.5rem,1fr)]";
export const STANDARD_REPORT_GRID_CLASS_NAME =
  "sm:tw-grid-cols-[minmax(0,3fr)_minmax(6rem,1fr)]";

const REPORT_ROW_LINK_CLASS_NAME =
  "tw-grid tw-w-full tw-items-center tw-gap-3 tw-border-t tw-border-iron-700 tw-px-4 tw-py-4 tw-text-white tw-no-underline tw-transition hover:tw-bg-iron-700 hover:tw-text-white hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-300 sm:tw-gap-4 sm:tw-px-6";
const REPORT_ROW_TITLE_CLASS_NAME =
  "tw-text-sm tw-leading-5 tw-text-white sm:tw-text-base";
const REPORT_ROW_META_CLASS_NAME = "tw-text-sm tw-leading-5 tw-text-gray-400";

function formatVisibleSubscriptionCount(count: number): string {
  return `x${count > 0 ? count.toLocaleString() : "0"}`;
}

function formatAccessibleSubscriptionCount(count: number): string {
  return count > 0 ? count.toLocaleString() : "0";
}

function getMemeCardName(name: string): string {
  return name || "Meme card";
}

function getMemeCardAriaLabel(count: RedeemedSubscriptionCounts): string {
  const tokenId = getMemeTokenIdLabel(count.token_id);
  return `View The Memes card #${tokenId} - ${getMemeCardName(count.name)}`;
}

const ReportRowLink = forwardRef<
  HTMLAnchorElement,
  Readonly<{
    href: string;
    gridClassName: string;
    className: string;
    ariaLabel: string;
    children: ReactNode;
  }>
>(function ReportRowLink(
  { href, gridClassName, className, ariaLabel, children },
  ref
) {
  return (
    <Link
      ref={ref}
      href={href}
      className={`${REPORT_ROW_LINK_CLASS_NAME} ${gridClassName} ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
});

function MemeCardSummary(
  props: Readonly<{
    count: RedeemedSubscriptionCounts;
    className?: string;
  }>
) {
  const dateTime = Time.fromString(props.count.mint_date);
  const tokenId = getMemeTokenIdLabel(props.count.token_id);
  const memeName = getMemeCardName(props.count.name);

  return (
    <div
      className={`tw-flex tw-min-w-0 tw-items-center tw-gap-3 ${props.className ?? ""}`}
    >
      <div className="tw-relative tw-flex tw-h-12 tw-w-12 tw-shrink-0 tw-items-center tw-justify-center sm:tw-h-[50px] sm:tw-w-[50px]">
        <Image
          fill
          unoptimized
          src={props.count.image_url}
          alt={memeName}
          sizes="50px"
          className="tw-rounded-sm tw-object-contain"
        />
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-col">
        <span className={REPORT_ROW_TITLE_CLASS_NAME}>
          #{tokenId} - {memeName}
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
    accessibleValue?: string;
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
      <span className="tw-sr-only">
        {props.label}: {props.accessibleValue ?? props.value}
      </span>
      {showMobileLabel ? (
        <span
          className="tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-gray-400 sm:tw-hidden"
          aria-hidden="true"
        >
          {props.label}
        </span>
      ) : null}
      <span
        className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-white sm:tw-text-base sm:tw-font-normal"
        aria-hidden="true"
      >
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
  const tokenId = getMemeTokenIdLabel(props.count.token_id);
  const subscribed =
    props.subscribedCount &&
    areMemeTokenIdsEqual(props.subscribedCount.token_id, props.count.token_id)
      ? {
          accessibleValue: formatAccessibleSubscriptionCount(
            props.subscribedCount.count
          ),
          value: formatVisibleSubscriptionCount(props.subscribedCount.count),
        }
      : "Unavailable";

  return (
    <ReportRowLink
      href={`/the-memes/${tokenId}`}
      gridClassName={`tw-grid-cols-2 ${ACTIVE_REPORT_GRID_CLASS_NAME}`}
      className={props.className}
      ariaLabel={getMemeCardAriaLabel(props.count)}
    >
      <MemeCardSummary
        count={props.count}
        className="tw-col-span-2 sm:tw-col-span-1"
      />
      <ReportCountStat
        label="Subscribed"
        value={typeof subscribed === "string" ? subscribed : subscribed.value}
        accessibleValue={
          typeof subscribed === "string"
            ? subscribed
            : subscribed.accessibleValue
        }
        active
      />
      <ReportCountStat
        label="Airdropped"
        value={formatVisibleSubscriptionCount(props.count.count)}
        accessibleValue={formatAccessibleSubscriptionCount(props.count.count)}
        active
      />
    </ReportRowLink>
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
  const tokenId = getMemeTokenIdLabel(count.token_id);

  return (
    <ReportRowLink
      ref={ref}
      href={`/the-memes/${tokenId}`}
      gridClassName={`tw-grid-cols-[minmax(0,1fr)_auto] ${STANDARD_REPORT_GRID_CLASS_NAME}`}
      className={className}
      ariaLabel={`View The Memes card #${tokenId}`}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-col">
        <span className={REPORT_ROW_TITLE_CLASS_NAME}>
          The Memes #{tokenId}
        </span>
        <span className={REPORT_ROW_META_CLASS_NAME}>
          SZN {displayedSeasonNumberFromIndex(date.seasonIndex)}
          {" / "}
          {formatFullDate(date.utcDay, "utc")}
        </span>
      </div>
      <ReportCountStat
        label="Subscriptions"
        value={formatVisibleSubscriptionCount(count.count)}
        accessibleValue={formatAccessibleSubscriptionCount(count.count)}
      />
    </ReportRowLink>
  );
});

export function RedeemedSubscriptionRow(
  props: Readonly<{
    className: string;
    count: RedeemedSubscriptionCounts;
  }>
) {
  const tokenId = getMemeTokenIdLabel(props.count.token_id);

  return (
    <ReportRowLink
      href={`/the-memes/${tokenId}`}
      gridClassName={`tw-grid-cols-[minmax(0,1fr)_auto] ${STANDARD_REPORT_GRID_CLASS_NAME}`}
      className={props.className}
      ariaLabel={getMemeCardAriaLabel(props.count)}
    >
      <MemeCardSummary count={props.count} />
      <ReportCountStat
        label="Subscriptions"
        value={formatVisibleSubscriptionCount(props.count.count)}
        accessibleValue={formatAccessibleSubscriptionCount(props.count.count)}
      />
    </ReportRowLink>
  );
}
