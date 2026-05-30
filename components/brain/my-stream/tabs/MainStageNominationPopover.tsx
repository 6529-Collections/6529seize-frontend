"use client";

import { type ReactElement } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import PermissionIcon from "@/components/utils/icons/PermissionIcon";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import {
  MEMES_NOMINEE_REQUIRED_REP,
  MEMES_SEEKING_NOMINATION_WAVE_ID,
} from "./memesNomination.constants";
import {
  useMemesNomineeProgress,
  type NominationProgress,
} from "./useMemesNomineeProgress";

const SEEKING_NOMINATION_ROUTE = getWavePathRoute(
  MEMES_SEEKING_NOMINATION_WAVE_ID
);

interface MainStageNominationPopoverProps {
  readonly children: ReactElement;
}

function RepProgressSection({
  isLoading,
  progress,
}: {
  readonly isLoading: boolean;
  readonly progress: NominationProgress | null;
}) {
  if (isLoading) {
    return (
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.03] tw-bg-white/[0.02] tw-p-4">
        <p className="tw-mb-0 tw-text-[12.5px] tw-font-medium tw-text-zinc-400">
          Loading MemesNominee Rep...
        </p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.03] tw-bg-white/[0.02] tw-p-4">
        <p className="tw-mb-0 tw-text-[10.5px] tw-font-semibold tw-tracking-wider tw-text-zinc-400">
          MemesNominee Rep
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-[12.5px] tw-font-medium tw-leading-5 tw-text-zinc-500">
          Connect a profile to see your progress toward eligibility.
        </p>
      </div>
    );
  }

  const currentRep = Math.floor(progress.currentRep);
  const requiredRep = MEMES_NOMINEE_REQUIRED_REP;
  const progressLabel =
    progress.remainingRep > 0
      ? `${formatNumberWithCommas(Math.ceil(progress.remainingRep))} rep to go`
      : "Goal reached!";

  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.03] tw-bg-white/[0.02] tw-p-4">
      <div className="tw-pointer-events-none tw-absolute -tw-right-6 -tw-top-6 tw-h-24 tw-w-24 tw-rounded-full tw-bg-primary-500/10 tw-blur-[20px]" />
      <div className="tw-relative tw-z-10 tw-mb-3 tw-flex tw-items-end tw-justify-between tw-gap-4">
        <span className="tw-text-[10.5px] tw-font-semibold tw-tracking-wider tw-text-zinc-400">
          MemesNominee Rep
        </span>
        <span className="tw-whitespace-nowrap tw-text-[13px] tw-font-semibold tw-text-zinc-200">
          {formatNumberWithCommas(currentRep)}
          <span className="tw-text-[11px] tw-font-medium tw-text-zinc-600">
            {" / "}
            {requiredRep / 1000}k
          </span>
        </span>
      </div>
      <div className="tw-relative tw-z-10 tw-h-1 tw-w-full tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/[0.03] tw-bg-[#050505]">
        <div
          className="tw-h-full tw-rounded-full tw-bg-primary-500 tw-transition-all tw-duration-700 tw-ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="tw-relative tw-z-10 tw-mb-0 tw-mt-2.5 tw-text-right tw-text-[11px] tw-font-medium tw-text-zinc-500">
        {progressLabel}
      </p>
    </div>
  );
}

function MainStageNominationPopoverContent({
  isLoading,
  progress,
}: {
  readonly isLoading: boolean;
  readonly progress: NominationProgress | null;
}) {
  return (
    <div className="tw-w-[min(88vw,20rem)]">
      <div className="tw-mb-5 tw-flex tw-flex-col tw-items-start">
        <div className="tw-mb-2 tw-flex tw-items-center tw-gap-2">
          <PermissionIcon className="tw-h-[15px] tw-w-[15px] tw-flex-shrink-0 tw-text-zinc-400" />
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-zinc-100">
            You&apos;re not eligible to submit yet
          </p>
        </div>
        <div className="tw-min-w-0">
          <p className="tw-mb-0 tw-text-[12.5px] tw-font-medium tw-leading-relaxed tw-text-zinc-400">
            Submissions open to nominated artists.
          </p>
        </div>
      </div>

      <div className="tw-mb-5">
        <RepProgressSection isLoading={isLoading} progress={progress} />
      </div>

      <Link
        href={SEEKING_NOMINATION_ROUTE}
        className="tw-inline-flex tw-h-9 tw-w-full tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-4 tw-text-[12.5px] tw-font-semibold tw-text-white tw-no-underline tw-shadow-sm tw-ring-1 tw-ring-primary-500 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-primary-600 desktop-hover:hover:tw-bg-primary-600 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-ring-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600"
      >
        Get nominated
        <ArrowRightIcon className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-opacity-70" />
      </Link>
    </div>
  );
}

export default function MainStageNominationPopover({
  children,
}: MainStageNominationPopoverProps) {
  const { isLoading, progress } = useMemesNomineeProgress();

  return (
    <HoverCard
      content={
        <MainStageNominationPopoverContent
          isLoading={isLoading}
          progress={progress}
        />
      }
      ariaLabel="Main Stage nomination progress"
      placement="bottom"
      delayShow={150}
      delayHide={0}
      offset={12}
    >
      {children}
    </HoverCard>
  );
}
