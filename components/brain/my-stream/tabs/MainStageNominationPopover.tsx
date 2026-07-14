"use client";

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import PermissionIcon from "@/components/utils/icons/PermissionIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
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

function RepStatusCard({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title?: string;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-white/5 tw-p-4">
      {title && (
        <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-tracking-wider tw-text-iron-400">
          {title}
        </p>
      )}
      <p
        className={
          title
            ? "tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-500"
            : "tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400"
        }
      >
        {children}
      </p>
    </div>
  );
}

function AnimatedProgressBar({
  label,
  percent,
  valueMax,
  valueNow,
  valueText,
}: {
  readonly label: string;
  readonly percent: number;
  readonly valueMax: number;
  readonly valueNow: number;
  readonly valueText: string;
}) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const frameId = globalThis.requestAnimationFrame(() => {
      setAnimatedPercent(percent);
    });

    return () => globalThis.cancelAnimationFrame(frameId);
  }, [percent]);

  return (
    <div className="tw-relative tw-z-10 tw-h-1 tw-w-full tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/[0.05] tw-bg-iron-950 tw-shadow-[inset_0_1px_2px_rgba(0,0,0,0.85)]">
      <progress
        className="tw-sr-only"
        max={valueMax}
        value={valueNow}
        aria-label={label}
        aria-valuetext={valueText}
      >
        {valueText}
      </progress>
      <div
        aria-hidden="true"
        className="tw-relative tw-h-full tw-w-full tw-origin-left tw-transform-gpu tw-overflow-hidden tw-rounded-full tw-bg-gradient-to-r tw-from-primary-600 tw-via-primary-500 tw-to-primary-300 tw-shadow-[0_0_14px_rgba(64,106,254,0.58)] tw-transition-transform tw-duration-1000 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none"
        style={{ transform: `scaleX(${animatedPercent / 100})` }}
      >
        {percent > 0 && (
          <span className="tw-pointer-events-none tw-absolute tw-right-0 tw-top-1/2 tw-h-3 tw-w-3 -tw-translate-y-1/2 tw-translate-x-1/2 tw-rounded-full tw-bg-white/80 tw-blur-[3px]" />
        )}
      </div>
    </div>
  );
}

function RepProgressSection({
  hasProfile,
  isError,
  isLoading,
  progress,
}: {
  readonly hasProfile: boolean;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly progress: NominationProgress | null;
}) {
  if (isLoading) {
    return (
      <RepStatusCard>
        <span className="tw-flex tw-items-center tw-gap-2">
          <CircleLoader size={CircleLoaderSize.SMALL} />
          <span>Loading...</span>
        </span>
      </RepStatusCard>
    );
  }

  if (isError) {
    return (
      <RepStatusCard title="MemesNominee REP">
        Could not load MemesNominee REP right now.
      </RepStatusCard>
    );
  }

  if (!hasProfile || !progress) {
    return (
      <RepStatusCard title="MemesNominee REP">
        Connect a profile to see your progress toward eligibility.
      </RepStatusCard>
    );
  }

  const currentRep = Math.floor(progress.currentRep);
  const requiredRep = MEMES_NOMINEE_REQUIRED_REP;
  const cappedCurrentRep = Math.min(Math.max(currentRep, 0), requiredRep);
  const formattedCurrentRep = formatNumberWithCommas(currentRep);
  const formattedRequiredRep = formatNumberWithCommas(requiredRep);
  const progressLabel =
    progress.remainingRep > 0
      ? `${formatNumberWithCommas(Math.ceil(progress.remainingRep))} REP to go`
      : "REP requirement met";

  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-gradient-to-b tw-from-iron-800/65 tw-to-iron-900/80 tw-p-4 tw-shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.035),0_8px_18px_rgba(0,0,0,0.18)]">
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_86%_0%,rgba(64,106,254,0.14),transparent_44%)]" />
      <div className="tw-relative tw-z-10 tw-mb-3 tw-flex tw-items-end tw-justify-between tw-gap-4">
        <span className="tw-text-xs tw-font-semibold tw-tracking-wider tw-text-iron-400">
          MemesNominee REP
        </span>
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-200">
          {formattedCurrentRep}
          <span className="tw-text-xs tw-font-medium tw-text-iron-600">
            {" / "}
            {formattedRequiredRep}
          </span>
        </span>
      </div>
      <AnimatedProgressBar
        label="MemesNominee REP progress"
        percent={progress.percent}
        valueMax={requiredRep}
        valueNow={cappedCurrentRep}
        valueText={`${formattedCurrentRep} of ${formattedRequiredRep} MemesNominee REP`}
      />
      <p className="tw-relative tw-z-10 tw-mb-0 tw-mt-2.5 tw-text-right tw-text-xs tw-font-medium tw-text-iron-500">
        {progressLabel}
      </p>
    </div>
  );
}

function MainStageNominationPopoverContent() {
  const { hasProfile, isError, isLoading, progress } =
    useMemesNomineeProgress();

  return (
    <div className="tw-w-[min(88vw,20rem)]">
      <div className="tw-mb-5 tw-flex tw-flex-col tw-items-start">
        <div className="tw-mb-2 tw-flex tw-items-center tw-gap-2">
          <PermissionIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400" />
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100">
            Unlock submissions
          </p>
        </div>
        <div className="tw-min-w-0">
          <p className="tw-mb-0 tw-text-xs tw-font-medium tw-leading-relaxed tw-text-iron-400">
            Reach {formatNumberWithCommas(MEMES_NOMINEE_REQUIRED_REP)}{" "}
            MemesNominee REP to become eligible to submit work.
          </p>
        </div>
      </div>

      <div className="tw-mb-5">
        <RepProgressSection
          hasProfile={hasProfile}
          isError={isError}
          isLoading={isLoading}
          progress={progress}
        />
      </div>

      <Link
        href={SEEKING_NOMINATION_ROUTE}
        className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-xs tw-font-semibold tw-text-white tw-no-underline tw-shadow-sm tw-ring-1 tw-ring-primary-500 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 desktop-hover:hover:tw-border-primary-600 desktop-hover:hover:tw-bg-primary-600 desktop-hover:hover:tw-text-white desktop-hover:hover:tw-ring-primary-600"
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
  return (
    <HoverCard
      content={<MainStageNominationPopoverContent />}
      ariaLabel="Main Stage submission eligibility"
      placement="auto"
      delayShow={150}
      delayHide={0}
      offset={12}
      openOnClick={true}
      triggerDisplay="inline-flex"
    >
      {children}
    </HoverCard>
  );
}
