"use client";
import { ExploreWaveCard } from "@/components/home/explore-waves/ExploreWaveCard";
import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { mapApiWaveOverviewToSidebarWave } from "@/services/api/waves-v2-api";
import { ClockIcon } from "@heroicons/react/24/outline";
import { getActiveWaveVoteDeadlineLabel } from "./active-wave-vote.helpers";

export function ActiveWaveVoteCard({
  vote,
}: {
  readonly vote: ApiActiveWaveVote;
}) {
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();
  return (
    <ExploreWaveCard
      wave={mapApiWaveOverviewToSidebarWave(vote.wave)}
      isApp={isApp}
      compact
      headingDetails={
        <span className="tw-mt-1 tw-flex tw-items-start tw-gap-1.5 tw-text-xs tw-font-medium tw-leading-4 tw-text-primary-300">
          <ClockIcon
            aria-hidden="true"
            className="tw-mt-0.5 tw-size-3 tw-shrink-0"
          />
          <span>{getActiveWaveVoteDeadlineLabel(vote, locale)}</span>
        </span>
      }
    />
  );
}
