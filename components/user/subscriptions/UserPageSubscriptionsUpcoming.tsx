"use client";

import type { SeasonMintRow } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  getUpcomingMintsAcrossSeasons,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import Link from "next/link";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import { t, type MessageKey } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { DISCLOSURE_ROW_BUTTON_CLASS } from "@/components/utils/button/disclosureRowStyles";
import { CalendarDaysIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useMemo, useState, type ReactNode } from "react";
import MemeSubscriptionRow from "./MemeSubscriptionRow";
import MintingTodaySubscriptionRow from "./MintingTodaySubscriptionRow";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";
import { isSubscriptionCoverageFundedToForecastEnd } from "./coverage/subscriptionCoverage.helpers";

function getFundingBoundaryMessageKey(
  isLastFunded: boolean,
  coverage: ApiSubscriptionCoverage | undefined | null
): MessageKey {
  if (!isLastFunded) return "subscriptions.coverage.nextUnfunded";
  return isSubscriptionCoverageFundedToForecastEnd(coverage)
    ? "subscriptions.coverage.fundedAtLeastThrough"
    : "subscriptions.coverage.fundedThrough";
}

const UPCOMING_SKELETON_ROWS = ["first", "second", "third"] as const;

export default function UserPageSubscriptionsUpcoming(
  props: Readonly<{
    coverage?: ApiSubscriptionCoverage | undefined;
    profileKey: string;
    details: SubscriptionDetails | undefined;
    memes_subscriptions: NFTSubscription[];
    readonly: boolean;
    refresh: () => void;
    loading?: boolean | undefined;
    error?: boolean | undefined;
    detailsError?: boolean | undefined;
    referenceDate?: Date | undefined;
  }>
) {
  const locale = useBrowserLocale();
  const modeDescription =
    props.details?.automatic === true
      ? "subscriptions.mode.automaticDescription"
      : "subscriptions.mode.manualDescription";
  const missingDetailsKey = props.detailsError
    ? "subscriptions.details.unavailable"
    : "subscriptions.settings.loading";
  const description = t(
    locale,
    props.details ? modeDescription : missingDetailsKey
  );
  useScrollToHashOnMount("profile-subscriptions-upcoming", {
    focusId: "profile-subscriptions-upcoming-title",
  });
  const [expanded, setExpanded] = useState<boolean>(false);
  const isPhone = useMediaQuery("(max-width: 639px)");
  const showSheet = isPhone && expanded;
  const subscriptions = useMemo(
    () =>
      expanded
        ? props.memes_subscriptions
        : props.memes_subscriptions.slice(0, 3),
    [expanded, props.memes_subscriptions]
  );

  const [today] = useState(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
  const now = props.referenceDate ?? today;
  const rows = useMemo<SeasonMintRow[]>(
    () => getUpcomingMintsAcrossSeasons(props.memes_subscriptions.length, now),
    [now, props.memes_subscriptions.length]
  );

  let content: ReactNode;
  if (props.loading) {
    content = (
      <div aria-busy="true" className="tw-space-y-1 tw-p-1">
        <output className="tw-sr-only">
          {t(locale, "subscriptions.upcoming.loading")}
        </output>
        {UPCOMING_SKELETON_ROWS.map((row) => (
          <div
            key={row}
            aria-hidden="true"
            className="tw-h-[4.5rem] tw-animate-pulse tw-rounded-xl tw-bg-iron-900/70"
          />
        ))}
      </div>
    );
  } else if (subscriptions.length > 0) {
    content = (
      <div className="tw-flex tw-flex-col">
        {subscriptions.map((subscription, index) => {
          const fundedThroughToken = props.coverage?.funded_through?.token_id;
          const isLastFunded = fundedThroughToken === subscription.token_id;
          const isFirstUnfunded =
            fundedThroughToken === undefined &&
            props.coverage?.next_unfunded?.token_id === subscription.token_id;
          const fundingBoundary = (isLastFunded || isFirstUnfunded) && (
            <div className="tw-mx-4 tw-py-3 tw-text-meta tw-font-normal tw-text-amber-200 md:tw-mx-5">
              {t(
                locale,
                getFundingBoundaryMessageKey(isLastFunded, props.coverage)
              )}{" "}
              <Link
                href={`/the-memes/${subscription.token_id}`}
                className="tw-text-inherit tw-no-underline desktop-hover:hover:tw-underline"
              >
                {t(locale, "subscriptions.coverage.memeToken", {
                  token: formatInteger(locale, subscription.token_id),
                })}
              </Link>
            </div>
          );
          const mintingToday =
            index === 0 &&
            (props.referenceDate
              ? rows[0]?.utcDay.getTime() === now.getTime()
              : isMintingToday());
          const Row = mintingToday
            ? MintingTodaySubscriptionRow
            : MemeSubscriptionRow;
          return (
            <div
              key={subscription.token_id}
              className="tw-relative before:tw-absolute before:tw-inset-x-4 before:tw-top-0 before:tw-h-px before:tw-bg-white/[0.06] before:tw-content-[''] first:before:tw-hidden md:before:tw-inset-x-5"
            >
              {isFirstUnfunded && fundingBoundary}
              <Row
                controlsLoading={!props.details && !props.detailsError}
                controlsUnavailable={!props.details && !!props.detailsError}
                profileKey={props.profileKey}
                title="The Memes"
                subscription={subscription}
                eligibilityCount={
                  props.details?.subscription_eligibility_count ?? 1
                }
                readonly={props.readonly}
                refresh={props.refresh}
                minting_today={mintingToday}
                first={index === 0}
                date={rows[index] ?? null}
              />
              {isLastFunded && fundingBoundary}
            </div>
          );
        })}
      </div>
    );
  } else {
    content = (
      <div className="tw-flex tw-min-h-24 tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-iron-900/40 tw-p-4 tw-text-center">
        <CalendarDaysIcon
          className="tw-size-6 tw-text-iron-500"
          aria-hidden="true"
        />
        <span className="tw-text-meta tw-font-normal tw-text-iron-500">
          {t(
            locale,
            props.error
              ? "subscriptions.details.unavailable"
              : "subscriptions.upcoming.empty"
          )}
        </span>
      </div>
    );
  }

  return (
    <UserPageSubscriptionsSection
      id="profile-subscriptions-upcoming"
      title={t(locale, "subscriptions.upcoming.title")}
      description={
        props.readonly ? undefined : (
          <span
            id="profile-subscriptions-upcoming-description"
            className="tw-block tw-text-pretty"
          >
            {description}
          </span>
        )
      }
    >
      <>
        <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-pb-0 tw-pt-2.5 md:tw-pb-2">
          {!showSheet && content}
          {!props.loading &&
            subscriptions.length > 0 &&
            props.memes_subscriptions.length > 3 && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-haspopup={isPhone ? "dialog" : undefined}
                aria-controls={
                  isPhone ? "subscription-upcoming-sheet" : undefined
                }
                onClick={() => setExpanded(!expanded)}
                className={`${DISCLOSURE_ROW_BUTTON_CLASS} tw-min-h-11 tw-gap-2 max-md:tw-mt-1 max-md:tw-rounded-none max-md:tw-border-x-0 max-md:tw-border-b-0 max-md:tw-border-t max-md:tw-border-solid max-md:tw-border-iron-800 md:tw-h-auto md:tw-min-h-[60px] md:tw-justify-center md:tw-px-5 md:tw-py-3 md:tw-text-center md:tw-text-meta md:tw-font-normal md:tw-text-iron-400`}
              >
                {t(
                  locale,
                  expanded
                    ? "subscriptions.upcoming.showLess"
                    : "subscriptions.upcoming.showMore"
                )}
                <ChevronDownIcon
                  aria-hidden="true"
                  className={`tw-size-4 max-md:tw-text-iron-400 ${expanded ? "tw-rotate-180" : ""}`}
                />
              </button>
            )}
        </div>
        <MobileWrapperDialog
          id="subscription-upcoming-sheet"
          titleClassName="!tw-text-lg !tw-font-semibold"
          title={t(locale, "subscriptions.upcoming.title")}
          isOpen={showSheet}
          onClose={() => setExpanded(false)}
          tall
          fixedHeight
          fitVisualViewport
          focusTitleOnOpen
        >
          {showSheet && (
            <div className="tw-min-w-0 tw-px-1">
              {content}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className={`${DISCLOSURE_ROW_BUTTON_CLASS} tw-mt-1 tw-min-h-11 tw-rounded-none !tw-border-t tw-border-solid tw-border-iron-800`}
              >
                {t(locale, "subscriptions.upcoming.showLess")}
                <ChevronDownIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-rotate-180 tw-text-iron-400"
                />
              </button>
            </div>
          )}
        </MobileWrapperDialog>
      </>
    </UserPageSubscriptionsSection>
  );
}
