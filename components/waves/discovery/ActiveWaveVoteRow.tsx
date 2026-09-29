"use client";
import useDeviceInfo from "@/hooks/useDeviceInfo";

import Link from "next/link";
import type { MouseEventHandler } from "react";
import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
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
    <Link
      href={getWaveRoute({ waveId: wave.id, isDirectMessage: false, isApp })}
      {...(onClick ? { onClick } : {})}
      prefetch={false}
      className={`${compact ? "tw-h-16" : ""} tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-rounded-lg tw-p-2 tw-text-iron-100 tw-no-underline hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400`}
    >
      <span className="tw-size-10 tw-shrink-0">
        <WavePicture
          name={wave.name}
          picture={wave.pfp ?? null}
          contributors={[]}
        />
      </span>
      <span className="tw-min-w-0">
        <span
          title={compact ? wave.name : undefined}
          className={`${compact ? "tw-block tw-truncate" : "tw-line-clamp-2"} tw-text-sm tw-font-medium`}
        >
          {wave.name}
        </span>
        <span
          title={compact ? deadlineLabel : undefined}
          className={`${compact ? "tw-truncate" : ""} tw-mt-1 tw-block tw-text-xs tw-text-primary-300`}
        >
          {deadlineLabel}
        </span>
      </span>
    </Link>
  );
}
