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
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";

export function ActiveWaveVoteRow({
  vote,
  onClick,
  compact = false,
}: {
  readonly compact?: boolean;
  readonly vote: ApiActiveWaveVote;
  readonly onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();
  const { wave, voting_ends_at: end, next_decision_at: decision } = vote;
  const hasScore = hasWaveTrustSummaryScore(wave.wave_score);
  const deadline =
    end !== null && (decision === null || end <= decision) ? end : decision;
  const deadlineMessage =
    deadline === end
      ? "waves.discovery.votingEnds"
      : "waves.discovery.nextDecision";
  const deadlineLabel =
    deadline === null
      ? t(locale, "waves.discovery.votingOpen")
      : t(locale, deadlineMessage, {
          date: formatDate(locale, deadline, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        });
  return (
    <div
      className={`${compact ? "tw-h-14" : ""} tw-relative tw-flex tw-min-w-0 tw-items-center tw-rounded-lg tw-p-2 hover:tw-bg-iron-900`}
    >
      <Link
        href={getWaveRoute({ waveId: wave.id, isDirectMessage: false, isApp })}
        {...(onClick ? { onClick } : {})}
        prefetch={false}
        className={`${compact ? "tw-gap-2" : "tw-gap-3"} tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-text-iron-100 tw-no-underline before:tw-absolute before:tw-inset-0 before:tw-rounded-lg before:tw-content-[''] focus-visible:tw-outline-none focus-visible:before:tw-ring-2 focus-visible:before:tw-ring-primary-400`}
      >
        <span className={`${compact ? "tw-size-8" : "tw-size-10"} tw-shrink-0`}>
          <WavePicture
            name={wave.name}
            picture={wave.pfp ?? null}
            contributors={[]}
          />
        </span>
        <span className="tw-min-w-0 tw-flex-1">
          <span
            title={compact ? wave.name : undefined}
            className={`${compact ? "tw-block tw-truncate tw-text-xs" : "tw-line-clamp-2 tw-text-sm"} ${hasScore ? "tw-pr-12" : ""} tw-font-medium`}
          >
            {wave.name}
          </span>
          <span
            title={compact ? deadlineLabel : undefined}
            className={`${compact ? "tw-mt-0.5 tw-truncate tw-text-[11px] tw-leading-4" : "tw-mt-1 tw-text-xs"} tw-block tw-text-primary-300`}
          >
            {deadlineLabel}
          </span>
        </span>
      </Link>
      <WaveTrustSignals
        className="tw-absolute tw-right-2 tw-top-3 tw-z-10"
        waveRep={wave.wave_rep}
        waveScore={wave.wave_score}
        variant="sidebar-inline"
        mode="summary"
      />
    </div>
  );
}
