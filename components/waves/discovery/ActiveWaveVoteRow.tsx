"use client";
import useDeviceInfo from "@/hooks/useDeviceInfo";

import Link from "next/link";
import type { MouseEventHandler } from "react";
import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
import {
  hasWaveTrustSummaryScore,
  WaveTrustSignals,
} from "@/components/waves/WaveTrustSignals";
import WavePicture from "@/components/waves/WavePicture";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { getActiveWaveVoteDeadlineLabel } from "./active-wave-vote.helpers";

export function ActiveWaveVoteRow({
  vote,
  onClick,
  compact = false,
  isActive = false,
}: {
  readonly compact?: boolean;
  readonly isActive?: boolean;
  readonly vote: ApiActiveWaveVote;
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();
  const { wave } = vote;
  const hasScore = hasWaveTrustSummaryScore(wave.wave_score);
  const deadlineLabel = getActiveWaveVoteDeadlineLabel(vote, locale);
  return (
    <div
      className={`${compact ? "tw-h-12 tw-px-2 tw-py-1" : "tw-p-2"} tw-relative tw-flex tw-min-w-0 tw-items-center tw-rounded-lg ${isActive ? "tw-bg-iron-700/50 desktop-hover:hover:tw-bg-iron-700/70" : "desktop-hover:hover:tw-bg-iron-900"}`}
    >
      <Link
        href={getWaveRoute({ waveId: wave.id, isDirectMessage: false, isApp })}
        {...(onClick ? { onClick } : {})}
        prefetch={false}
        aria-current={isActive ? "page" : undefined}
        className={`${compact ? "tw-gap-2" : "tw-gap-3"} tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-text-iron-100 tw-no-underline before:tw-absolute before:tw-inset-0 before:tw-rounded-lg before:tw-content-[''] focus-visible:tw-outline-none focus-visible:before:tw-ring-2 focus-visible:before:tw-ring-primary-400`}
      >
        <span className={`${compact ? "tw-size-8" : "tw-size-10"} tw-shrink-0`}>
          <WavePicture
            name={wave.name}
            picture={wave.pfp ?? null}
            contributors={[]}
          />
        </span>
        <span className={`tw-min-w-0 tw-flex-1 ${hasScore ? "tw-pr-12" : ""}`}>
          <span
            title={compact ? wave.name : undefined}
            className={`${compact ? "tw-block tw-truncate tw-text-xs" : "tw-line-clamp-2 tw-text-sm"} tw-font-medium`}
          >
            {wave.name}
          </span>
          <span
            title={compact ? deadlineLabel : undefined}
            className={`${compact ? "tw-mt-0.5 tw-truncate tw-text-[11px] tw-leading-4" : "tw-mt-1 tw-text-xs"} tw-block tw-text-iron-400`}
          >
            {deadlineLabel}
          </span>
        </span>
      </Link>
      <WaveTrustSignals
        className="tw-absolute tw-right-2 tw-top-1/2 tw-z-10 -tw-translate-y-1/2"
        waveRep={wave.wave_rep}
        waveScore={wave.wave_score}
        variant="sidebar-inline"
        mode="summary"
      />
    </div>
  );
}
