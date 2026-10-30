"use client";

import type { SeasonMintRow } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  getUpcomingMintsAcrossSeasons,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import ShowMoreButton from "@/components/show-more-button/ShowMoreButton";
import Link from "next/link";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import { t } from "@/i18n/messages";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import UserPageSubscriptionsMode from "./UserPageSubscriptionsMode";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { useMemo, useState, type ReactNode } from "react";
import MemeSubscriptionRow from "./MemeSubscriptionRow";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";

const UPCOMING_SKELETON_ROWS = ["first", "second", "third"] as const;
const SHOW_MORE_WRAPPER_CLASS = "tw-mt-3 tw-flex tw-justify-center tw-pb-1";

export default function UserPageSubscriptionsUpcoming(
  props: Readonly<{
    coverage?: ApiSubscriptionCoverage | undefined;
    profileKey: string;
    details: SubscriptionDetails | undefined;
    memes_subscriptions: NFTSubscription[];
    readonly: boolean;
    refresh: () => void;
    loading?: boolean | undefined;
  }>
) {
  const locale = useBrowserLocale();
  useScrollToHashOnMount("profile-subscriptions-upcoming", {
    focusId: "profile-subscriptions-upcoming-title",
  });
  const [expanded, setExpanded] = useState<boolean>(false);
  const subscriptions = useMemo(
    () =>
      expanded
        ? props.memes_subscriptions
        : props.memes_subscriptions.slice(0, 3),
    [expanded, props.memes_subscriptions]
  );

  const [now] = useState(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
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
      <div className="tw-flex tw-flex-col tw-p-1">
        {subscriptions.map((subscription, index) => (
          <div key={subscription.token_id}>
            {props.coverage?.next_unfunded?.token_id ===
              subscription.token_id && (
              <div className="tw-mx-4 tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-t tw-border-dashed tw-border-amber-400/35 tw-text-sm tw-font-medium tw-text-amber-300">
                <span>{t(locale, "subscriptions.coverage.nextUnfunded")}</span>
                {!props.readonly && (
                  <Link
                    href="#profile-subscriptions-top-up"
                    className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-px-1 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                  >
                    {t(locale, "subscriptions.page.topUpTitle")}
                  </Link>
                )}
              </div>
            )}
            <MemeSubscriptionRow
              profileKey={props.profileKey}
              title="The Memes"
              subscription={subscription}
              eligibilityCount={
                props.details?.subscription_eligibility_count ?? 1
              }
              readonly={props.readonly}
              refresh={props.refresh}
              minting_today={index === 0 && isMintingToday()}
              first={index === 0}
              date={rows[index] ?? null}
            />
          </div>
        ))}
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
          {t(locale, "subscriptions.upcoming.empty")}
        </span>
      </div>
    );
  }

  return (
    <UserPageSubscriptionsSection
      id="profile-subscriptions-upcoming"
      title={t(locale, "subscriptions.upcoming.title")}
      action={
        <UserPageSubscriptionsMode
          profileKey={props.profileKey}
          details={props.details}
          readonly={props.readonly}
          refresh={props.refresh}
        />
      }
    >
      <>
        <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950">
          {content}
          {!props.loading &&
            subscriptions.length > 0 &&
            props.memes_subscriptions.length > 3 && (
              <div className={SHOW_MORE_WRAPPER_CLASS}>
                <ShowMoreButton
                  expanded={expanded}
                  setExpanded={setExpanded}
                  variant="subtle"
                />
              </div>
            )}
        </div>
      </>
    </UserPageSubscriptionsSection>
  );
}
