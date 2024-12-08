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
        <div className="tw-mt-1.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-2">
          <Link
            href={`/${log.invoker.handle}`}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group desktop-hover:hover:tw-opacity-80 tw-transition-all tw-duration-300 tw-whitespace-nowrap"
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
          <span className="tw-text-sm tw-text-iron-400">voted</span>
          <div className="tw-flex tw-items-center tw-gap-x-0.5 tw-whitespace-nowrap">
            <svg
              className={`tw-w-3.5 tw-h-3.5 ${
                log.contents.newVote >= log.contents.oldVote
                  ? "tw-text-green"
                  : "tw-text-red tw-rotate-180"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
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
          <Link
            href={`/${log.drop_author?.handle}`}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group desktop-hover:hover:tw-opacity-80 tw-transition-all tw-duration-300 tw-whitespace-nowrap"
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
