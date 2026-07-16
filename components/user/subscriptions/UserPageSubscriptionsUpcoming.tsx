"use client";

import type { SeasonMintRow } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  getUpcomingMintsAcrossSeasons,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import ShowMoreButton from "@/components/show-more-button/ShowMoreButton";
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
    profileKey: string;
    details: SubscriptionDetails | undefined;
    memes_subscriptions: NFTSubscription[];
    readonly: boolean;
    refresh: () => void;
    loading?: boolean | undefined;
  }>
) {
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
        <output className="tw-sr-only">Loading upcoming drops</output>
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
          <MemeSubscriptionRow
            key={subscription.token_id}
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
        <span className="tw-text-sm tw-text-iron-400">
          No upcoming drops found
        </span>
      </div>
    );
  }

  return (
    <UserPageSubscriptionsSection
      id="profile-subscriptions-upcoming"
      title="Upcoming Drops"
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-pt-8"
    >
      <>
        <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03]">
          {content}
        </div>
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
      </>
    </UserPageSubscriptionsSection>
  );
}
