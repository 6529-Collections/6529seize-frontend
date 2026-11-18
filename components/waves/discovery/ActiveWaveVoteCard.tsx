"use client";
import { ExploreWaveCard } from "@/components/home/explore-waves/ExploreWaveCard";
import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { mapApiWaveOverviewToSidebarWave } from "@/services/api/waves-v2-api";
import { ClockIcon } from "@heroicons/react/24/outline";
import { getActiveWaveVoteLabel } from "./active-wave-vote.helpers";

export function ActiveWaveVoteCard({
  vote,
}: {
  readonly vote: ApiActiveWaveVote;
}) {
  const locale = useBrowserLocale();
  const zone = useDisplayTimeZone();
  const { isApp } = useDeviceInfo();
  const hasSubmissionCount = typeof vote.active_submission_count === "number";
  const hasNoSubmissions = vote.active_submission_count === 0;
  return (
    <ExploreWaveCard
      wave={mapApiWaveOverviewToSidebarWave(vote.wave)}
      isApp={isApp}
      compact
      headingDetails={
        <span
          className={`tw-mt-1 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-normal tw-leading-4 ${hasNoSubmissions ? "tw-text-iron-500" : "tw-text-primary-300"}`}
        >
          {!hasSubmissionCount && (
            <ClockIcon aria-hidden="true" className="tw-size-3 tw-shrink-0" />
          )}
          <span>{getActiveWaveVoteLabel(vote, locale, zone)}</span>
        </span>
      }
    />
  );
}
