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
  return (
    <div className="tw-mb-4 tw-flex tw-flex-col tw-gap-3 tw-px-4 sm:tw-mb-6 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between md:tw-px-5">
      <div className="tw-min-w-0">
        <h3
          id="brain-activity-heading"
          className="tw-mb-0 tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50"
        >
          Activity
        </h3>
      </div>
      {periodLabel && totalDrops !== undefined && (
        <div className="tw-max-w-[14rem] tw-text-[11px] tw-font-medium tw-tracking-wide tw-text-iron-400 sm:tw-max-w-none sm:tw-text-right sm:tw-text-[12px]">
          {numberWithCommas(totalDrops)} public post
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

  const activity = activityQuery.data
    ? buildUserPageBrainActivityViewModel(activityQuery.data)
    : null;

  let content: ReactNode = null;
  let periodLabel: string | undefined;
  let totalDrops: number | undefined;

  if (identity) {
    if (activityQuery.status === "pending") {
      content = <UserPageBrainActivityHeatmapLoading />;
    } else if (activityQuery.status === "error") {
      content = (
        <p className="tw-px-4 tw-text-sm tw-text-iron-400 md:tw-px-5">
          Unable to load activity.
        </p>
      );
    } else if (activity) {
      periodLabel = activity.periodLabel;
      totalDrops = activity.totalDrops;
      content =
        activity.totalDrops > 0 ? (
          <UserPageBrainActivityHeatmap activity={activity} />
        ) : (
          <p className="tw-px-4 tw-text-sm tw-text-iron-500 md:tw-px-5">
            No activity in last 12 months.
          </p>
        );
    } else {
      content = (
        <p className="tw-px-4 tw-text-sm tw-text-iron-400 md:tw-px-5">
          No activity data available.
        </p>
      );
    }
  }

  return identity ? (
    <ActivityCardFrame>
      <ActivityCardHeader periodLabel={periodLabel} totalDrops={totalDrops} />
      {content}
    </ActivityCardFrame>
  ) : null;
}
