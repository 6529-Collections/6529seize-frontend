import React from "react";
import { ApiWaveLog } from "../../../../generated/models/ApiWaveLog";
import {
  formatNumberWithCommas,
  getTimeAgoShort,
} from "../../../../helpers/Helpers";
import Link from "next/link";

interface WaveDropLogProps {
  readonly log: ApiWaveLog;
}

export const WaveDropLog: React.FC<WaveDropLogProps> = ({ log }) => {
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
          <span className="tw-text-sm tw-text-iron-400">voted</span>
          <div className="tw-flex tw-items-center tw-gap-x-0.5 tw-whitespace-nowrap">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`tw-w-3.5 tw-h-3.5 tw-flex-shrink-0 ${
                log.contents.newVote >= log.contents.oldVote
                  ? "tw-text-green"
                  : "tw-text-red tw-rotate-180"
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 6.75 12 3m0 0 3.75 3.75M12 3v18"
              />
            </svg>
            <span
              className={`tw-text-xs tw-font-medium ${
                log.contents.newVote >= log.contents.oldVote
                  ? "tw-text-green"
                  : "tw-text-red"
              }`}
            >
              {formatNumberWithCommas(
                Math.abs(log.contents.newVote - log.contents.oldVote)
              )}{" "}
              TDH
            </span>
          </div>
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
