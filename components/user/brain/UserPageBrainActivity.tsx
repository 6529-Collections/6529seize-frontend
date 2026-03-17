"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { numberWithCommas } from "@/helpers/Helpers";
import { useIdentityActivity } from "@/hooks/useIdentityActivity";
import type { ReactNode } from "react";
import { buildUserPageBrainActivityViewModel } from "./userPageBrainActivity.helpers";
import {
  UserPageBrainActivityHeatmap,
  UserPageBrainActivityHeatmapLoading,
} from "./UserPageBrainActivityHeatmap";
import { getProfileWaveIdentity } from "./userPageBrainSidebar.helpers";

function ActivityCardFrame({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <section
      className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/15 tw-bg-black tw-py-4 tw-shadow-2xl md:tw-py-5"
      aria-labelledby="brain-activity-heading"
      data-testid="brain-activity-card"
    >
      {children}
    </section>
  );
}

function ActivityCardHeader({
  periodLabel,
  totalDrops,
}: Readonly<{
  periodLabel?: string | undefined;
  totalDrops?: number | undefined;
}>) {
  const totalDropsLabel = totalDrops === 0 ? "0" : numberWithCommas(totalDrops);

  return (
    <div className="gap-x-4 tw-mb-4 tw-flex tw-flex-col tw-gap-y-2 tw-px-4 sm:tw-mb-6 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between md:tw-px-5">
      <div className="tw-min-w-0">
        <h3
          id="brain-activity-heading"
          className="tw-mb-0 tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50"
        >
          Activity
        </h3>
      </div>
      {periodLabel && totalDrops !== undefined && (
        <div className="tw-text-xs tw-font-medium tw-text-iron-400 sm:tw-max-w-none sm:tw-text-right">
          {totalDropsLabel} public post
          {totalDrops === 1 ? "" : "s"} in {periodLabel}
        </div>
      )}
    </div>
  );
}

export default function UserPageBrainActivity({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const identity = getProfileWaveIdentity(profile);
  const activityQuery = useIdentityActivity({
    identity,
    enabled: identity.length > 0,
  });

  if (!identity) {
    return null;
  }

  const activity = activityQuery.data
    ? buildUserPageBrainActivityViewModel(activityQuery.data)
    : null;
  const periodLabel = activity?.periodLabel;
  const totalDrops = activity?.totalDrops;

  let content: ReactNode;

  if (activityQuery.status === "pending") {
    content = <UserPageBrainActivityHeatmapLoading />;
  } else if (activityQuery.status === "error") {
    content = (
      <p className="tw-px-4 tw-text-sm tw-text-iron-400 md:tw-px-5">
        Unable to load activity.
      </p>
    );
  } else if (activity && activity.totalDrops > 0) {
    content = <UserPageBrainActivityHeatmap activity={activity} />;
  } else {
    content = (
      <p className="tw-px-4 tw-text-sm tw-italic tw-text-iron-500 md:tw-px-5">
        No activity in last 12 months.
      </p>
    );
  }

  return (
    <ActivityCardFrame>
      <ActivityCardHeader periodLabel={periodLabel} totalDrops={totalDrops} />
      {content}
    </ActivityCardFrame>
  );
}
