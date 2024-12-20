import React from "react";
import { ApiWaveLog } from "../../../../generated/models/ApiWaveLog";
import {
  formatNumberWithCommas,
  getTimeAgoShort,
} from "../../../../helpers/Helpers";
import Link from "next/link";
import { ApiWaveCreditType } from "../../../../generated/models/ApiWaveCreditType";

interface WaveDropLogProps {
  readonly log: ApiWaveLog;
  readonly creditType: ApiWaveCreditType;
}

export const WaveDropLog: React.FC<WaveDropLogProps> = ({ log, creditType }) => {
  return (
    <div className="tw-p-3 tw-bg-iron-900">
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1.5">
          <Link
            href={`/${log.invoker.handle}`}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group desktop-hover:hover:tw-opacity-80 tw-transition-all tw-duration-300 tw-whitespace-nowrap"
          >
            {log.invoker.pfp ? (
              <img
                src={log.invoker.pfp}
                alt=""
                className="tw-size-6 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0"
              />
            ) : (
              <div className="tw-size-6 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0" />
            )}
            <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300 tw-truncate tw-max-w-32">
              {log.invoker.handle}
            </span>
          </Link>
          <span className="tw-text-sm tw-text-iron-400">
            {log.contents.oldVote === 0 ? "voted" : "changed from"}
          </span>
          {log.contents.oldVote !== 0 && (
            <span className="tw-text-sm tw-text-iron-500 tw-whitespace-nowrap">
              {formatNumberWithCommas(log.contents.oldVote)} →
            </span>
          )}
          <span className={`tw-text-sm tw-font-semibold tw-whitespace-nowrap ${log.contents.newVote > 0 ? "tw-text-green" : "tw-text-red"}`}>
            {formatNumberWithCommas(log.contents.newVote)} {creditType}
          </span>
        </div>

        <div className="tw-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap">
          <svg
            className="tw-w-3.5 tw-h-3.5 tw-text-iron-400 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="tw-text-xs tw-font-medium tw-text-iron-400">
            {getTimeAgoShort(new Date(log.created_at).getTime())}
          </span>
        </div>
      </div>
    </div>
  );
};
