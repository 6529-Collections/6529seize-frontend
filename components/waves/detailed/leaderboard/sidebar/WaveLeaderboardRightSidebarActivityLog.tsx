import React from "react";
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
  console.log(log);
  return (
    <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900/30 hover:tw-bg-iron-900/50 tw-transition-colors tw-duration-200">
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          {getTimeAgoShort(new Date(log.created_at).getTime())}
        </span>
        <span className="tw-size-1 tw-rounded-full tw-bg-iron-700"></span>
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          {formatNumberWithCommas(log.contents.newVote - log.contents.oldVote)}{" "}
          TDH
        </span>
      </div>
      <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-1.5">
        <Link
          href={`/${log.invoker.handle}`}
          className="tw-flex tw-items-center tw-gap-2 tw-no-underline"
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
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            {log.invoker.handle}
          </span>
        </Link>
        <span className="tw-text-sm tw-text-iron-400">voted</span>
        <Link
          href={`/${log.drop_author?.handle}`}
          className="tw-flex tw-items-center tw-gap-2 tw-no-underline"
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
          <span className="tw-text-sm tw-font-medium tw-text-iron-50">
            {log.drop_author?.handle}
          </span>
        </Link>
      </div>
    </div>
  );
};
