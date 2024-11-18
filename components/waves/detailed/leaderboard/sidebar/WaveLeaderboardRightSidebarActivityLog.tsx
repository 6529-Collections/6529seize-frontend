import React, { useState } from "react";
import { ApiWaveLog } from "../../../../../generated/models/ApiWaveLog";
import {
  formatNumberWithCommas,
  getTimeAgoShort,
} from "../../../../../helpers/Helpers";
import Link from "next/link";

interface WaveLeaderboardRightSidebarActivityLogProps {
  readonly log: ApiWaveLog;
}

export const WaveLeaderboardRightSidebarActivityLog: React.FC<
  WaveLeaderboardRightSidebarActivityLogProps
> = ({ log }) => {
  const [showDrop, setShowDrop] = useState(false);

  return (
    <div className="tw-relative">
      <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <div className="tw-flex tw-items-center tw-gap-1.5">
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
            <div className="tw-size-1 tw-rounded-full tw-bg-iron-600"></div>
            <div className="tw-flex tw-items-center tw-gap-1">
              <svg
                className={`tw-w-3.5 tw-h-3.5 ${
                  log.contents.newVote >= log.contents.oldVote
                    ? "tw-text-emerald-400"
                    : "tw-text-red tw-rotate-180"
                }`}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 4v16m0-16l4 4m-4-4l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className={`tw-text-xs tw-font-medium ${
                  log.contents.newVote >= log.contents.oldVote
                    ? "tw-text-emerald-400"
                    : "tw-text-red"
                }`}
              >
                {log.contents.newVote >= log.contents.oldVote ? "+" : "-"}
                {formatNumberWithCommas(
                  Math.abs(log.contents.newVote - log.contents.oldVote)
                )}{" "}
                TDH
              </span>
            </div>
          </div>

          <button
            onMouseEnter={() => setShowDrop(true)}
            onMouseLeave={() => setShowDrop(false)}
            className="tw-ml-auto tw-size-6 tw-text-iron-400 hover:tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-rounded-md tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
              className="tw-size-3.5 tw-flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </button>
        </div>
        <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-1.5">
          <Link
            href={`/${log.invoker.handle}`}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group hover:tw-opacity-80 tw-transition-all tw-duration-300"
          >
            {log.invoker.pfp ? (
              <img
                src={log.invoker.pfp}
                alt=""
                className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
              />
            ) : (
              <div className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800" />
            )}
            <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 group-hover:tw-text-iron-300">
              {log.invoker.handle}
            </span>
          </Link>
          <span className="tw-text-sm tw-text-iron-400">voted</span>
          <Link
            href={`/${log.drop_author?.handle}`}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group hover:tw-opacity-80 tw-transition-all tw-duration-300"
          >
            {log.drop_author?.pfp ? (
              <img
                src={log.drop_author.pfp}
                alt=""
                className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
              />
            ) : (
              <div className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800" />
            )}
            <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 group-hover:tw-text-iron-300">
              {log.drop_author?.handle}
            </span>
          </Link>
        </div>
      </div>
      {showDrop && (
        <div className="tw-absolute tw-right-0 tw-top-full tw-mt-2 tw-w-72 tw-p-3 tw-rounded-lg tw-bg-iron-800 tw-shadow-lg tw-z-10">
          <div className="tw-text-sm tw-text-iron-200 tw-line-clamp-3">
            {log.contents.content}
          </div>
        </div>
      )}
    </div>
  );
};
