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
      <div aria-busy="true" className="tw-space-y-2 tw-p-2">
        <output className="tw-sr-only">Loading upcoming drops</output>
        {UPCOMING_SKELETON_ROWS.map((row) => (
          <div
            key={row}
            aria-hidden="true"
            className="tw-h-[4.5rem] tw-animate-pulse tw-rounded-lg tw-bg-iron-900/70"
          />
        ))}
      </div>
    );
  } else if (subscriptions.length > 0) {
    content = (
      <>
        <div className="tw-space-y-1 tw-p-2">
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
        {props.memes_subscriptions.length > 3 && (
          <div className="tw-mt-3 tw-pb-3 tw-text-center">
            <ShowMoreButton expanded={expanded} setExpanded={setExpanded} />
          </div>
        )}
      </>
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
    >
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-shadow-[0_14px_36px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.025)]">
        {content}
      </div>
    </UserPageSubscriptionsSection>
  );
}
