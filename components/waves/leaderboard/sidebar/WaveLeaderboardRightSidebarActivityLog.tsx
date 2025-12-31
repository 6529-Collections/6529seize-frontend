import { ApiWaveLog } from "@/generated/models/ApiWaveLog";
import {
  formatNumberWithCommas,
  getTimeAgoShort,
} from "@/helpers/Helpers";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { WaveLeaderboardRightSidebarActivityLogDrop } from "./WaveLeaderboardRightSidebarActivityLogDrop";

import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SystemAdjustmentPill } from "@/components/common/SystemAdjustmentPill";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

interface WaveLeaderboardRightSidebarActivityLogProps {
  readonly log: ApiWaveLog;
  readonly creditType: ApiWaveCreditType;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardRightSidebarActivityLog: React.FC<
  WaveLeaderboardRightSidebarActivityLogProps
> = ({ log, creditType, onDropClick }) => {
  return (
    <div className="tw-relative">
      <div className="tw-p-3 tw-rounded-lg tw-bg-iron-900">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-1.5">
            <FontAwesomeIcon
              icon={faClock}
              className="tw-w-3.5 tw-h-3.5 tw-text-iron-400 tw-flex-shrink-0"
            />
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
              <Image
                src={resolveIpfsUrlSync(log.invoker.pfp)}
                alt=""
                width={20}
                height={20}
                className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
              />
            ) : (
              <div className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800" />
            )}
            <UserProfileTooltipWrapper user={log.invoker.handle ?? log.invoker.id}>
              <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300">
                {log.invoker.handle}
              </span>
            </UserProfileTooltipWrapper>
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
              className={`tw-text-sm tw-font-semibold tw-whitespace-nowrap ${log.contents.newVote > 0 ? "tw-text-green" : "tw-text-red"
                }`}
            >
              {formatNumberWithCommas(log.contents.newVote)} {WAVE_VOTING_LABELS[creditType]}
            </span>
            {log.contents?.reason === "CREDIT_OVERSPENT" && <SystemAdjustmentPill />}
          </div>

          <Link
            href={`/${log.drop_author?.handle}`}
            className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group desktop-hover:hover:tw-opacity-80 tw-transition-all tw-duration-300"
            title={`Drop creator: ${log.drop_author?.handle}`}
          >
            {log.drop_author?.pfp ? (
              <Image
                src={resolveIpfsUrlSync(log.drop_author.pfp)}
                alt=""
                width={20}
                height={20}
                className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0"
              />
            ) : (
              <div className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0" />
            )}
            {log.drop_author?.handle ? (
              <UserProfileTooltipWrapper user={log.drop_author.handle ?? log.drop_author.id}>
                <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300">
                  {log.drop_author.handle}
                </span>
              </UserProfileTooltipWrapper>
            ) : (
              <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300">
                {log.drop_author?.handle}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};
