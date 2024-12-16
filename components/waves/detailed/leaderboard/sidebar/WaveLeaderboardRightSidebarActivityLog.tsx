import { ApiWaveLog } from "../../../../../generated/models/ApiWaveLog";
import {
  formatNumberWithCommas,
  getTimeAgoShort,
} from "../../../../../helpers/Helpers";
import Link from "next/link";
import { WaveLeaderboardRightSidebarActivityLogDrop } from "./WaveLeaderboardRightSidebarActivityLogDrop";
import { ExtendedDrop } from "../../../../../helpers/waves/wave-drops.helpers";

interface WaveLeaderboardRightSidebarActivityLogProps {
  readonly log: ApiWaveLog;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardRightSidebarActivityLog: React.FC<
  WaveLeaderboardRightSidebarActivityLogProps
> = ({ log, onDropClick }) => {
  return (
    <div className="tw-relative">
      <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900">
        <div className="tw-flex tw-items-center tw-justify-between">
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

          <WaveLeaderboardRightSidebarActivityLogDrop
            log={log}
            onDropClick={onDropClick}
          />
        </div>

        <div className="tw-mt-1.5 tw-flex tw-items-center tw-flex-wrap tw-gap-2">
          <Link
            href={`/${log.invoker.handle}`}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group desktop-hover:hover:tw-opacity-80 tw-transition-all tw-duration-300"
            title={`Voter: ${log.invoker.handle}`}
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
            <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300">
              {log.invoker.handle}
            </span>
          </Link>

          <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-min-w-0 tw-overflow-hidden">
            {log.contents.oldVote === 0 ? (
              <span className="tw-text-sm tw-text-iron-400">voted</span>
            ) : (
              <span className="tw-text-sm tw-text-iron-500 tw-whitespace-nowrap">
                {formatNumberWithCommas(log.contents.oldVote)} →
              </span>
            )}
            <span
              className={`tw-text-sm tw-font-semibold tw-whitespace-nowrap ${
                log.contents.newVote > 0 ? "tw-text-green" : "tw-text-red"
              }`}
            >
              {formatNumberWithCommas(log.contents.newVote)} TDH
            </span>
          </div>

          <Link
            href={`/${log.drop_author?.handle}`}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group desktop-hover:hover:tw-opacity-80 tw-transition-all tw-duration-300"
            title={`Drop creator: ${log.drop_author?.handle}`}
          >
            {log.drop_author?.pfp ? (
              <img
                src={log.drop_author.pfp}
                alt=""
                className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0"
              />
            ) : (
              <div className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0" />
            )}
            <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300">
              {log.drop_author?.handle}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
