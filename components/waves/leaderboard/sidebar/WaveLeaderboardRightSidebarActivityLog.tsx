import type { ApiWaveLog } from "@/generated/models/ApiWaveLog";
import { formatNumberWithCommas, getTimeAgoShort } from "@/helpers/Helpers";
import Link from "next/link";
import Image from "next/image";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { WaveLeaderboardRightSidebarActivityLogDrop } from "./WaveLeaderboardRightSidebarActivityLogDrop";

import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { SystemAdjustmentPill } from "@/components/common/SystemAdjustmentPill";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { ClockIcon } from "@heroicons/react/24/outline";
import {
  getWaveRightPanelProfileIdentifier,
  waveRightPanelText,
} from "@/helpers/waves/wave-right-panel.helpers";

interface WaveLeaderboardRightSidebarActivityLogProps {
  readonly log: ApiWaveLog;
  readonly creditType: ApiWaveCreditType;
  readonly onDropClick: (() => void) | null;
}

export const WaveLeaderboardRightSidebarActivityLog: React.FC<
  WaveLeaderboardRightSidebarActivityLogProps
> = ({ log, creditType, onDropClick }) => {
  const unknownProfile = waveRightPanelText(
    "waves.sidebar.rightPanel.activity.unknownProfile"
  );
  const voterHandle = getWaveRightPanelProfileIdentifier([log.invoker.handle]);
  const voterProfile =
    getWaveRightPanelProfileIdentifier([
      voterHandle,
      log.invoker.primary_address,
      log.invoker.id,
    ]) ?? unknownProfile;
  const dropCreatorHandle = getWaveRightPanelProfileIdentifier([
    log.drop_author?.handle,
  ]);
  const dropCreatorProfile = getWaveRightPanelProfileIdentifier([
    dropCreatorHandle,
    log.drop_author?.primary_address,
    log.drop_author?.id,
  ]);
  const dropCreatorLabel = dropCreatorProfile ?? unknownProfile;
  const oldVoteValue: unknown = log.contents["oldVote"];
  const newVoteValue: unknown = log.contents["newVote"];
  const oldVote = typeof oldVoteValue === "number" ? oldVoteValue : 0;
  const newVote = typeof newVoteValue === "number" ? newVoteValue : 0;
  const dropCreatorTitle = waveRightPanelText(
    "waves.sidebar.rightPanel.activity.dropCreatorTitle",
    { profile: dropCreatorLabel }
  );
  const dropCreatorContent = (
    <>
      {log.drop_author?.pfp ? (
        <Image
          src={resolveIpfsUrlSync(log.drop_author.pfp)}
          alt=""
          width={20}
          height={20}
          className="tw-size-5 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10"
        />
      ) : (
        <div className="tw-size-5 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
      )}
      {dropCreatorHandle ? (
        <UserProfileTooltipWrapper user={dropCreatorHandle}>
          <span className="tw-block tw-max-w-36 tw-truncate tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300">
            {dropCreatorHandle}
          </span>
        </UserProfileTooltipWrapper>
      ) : (
        <span className="tw-block tw-max-w-36 tw-truncate tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300">
          {dropCreatorLabel}
        </span>
      )}
    </>
  );

  return (
    <div className="tw-relative tw-min-w-0">
      <div className="tw-min-w-0 tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-1 tw-py-3">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <div className="tw-flex tw-items-center tw-gap-1.5">
            <ClockIcon
              aria-hidden="true"
              className="tw-size-3.5 tw-flex-shrink-0 tw-text-iron-400"
            />
            <span className="tw-text-xs tw-font-medium tw-text-iron-400">
              {getTimeAgoShort(new Date(log.created_at).getTime())}
            </span>
          </div>

          {onDropClick && (
            <WaveLeaderboardRightSidebarActivityLogDrop
              onDropClick={onDropClick}
            />
          )}
        </div>

        <div className="tw-mt-2.5 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-2.5">
          <Link
            href={`/${voterProfile}`}
            className="tw-group tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-no-underline tw-transition-all tw-duration-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-opacity-80"
            title={waveRightPanelText(
              "waves.sidebar.rightPanel.activity.voterTitle",
              { profile: voterProfile }
            )}
          >
            {log.invoker.pfp ? (
              <Image
                src={resolveIpfsUrlSync(log.invoker.pfp)}
                alt=""
                width={20}
                height={20}
                className="tw-size-5 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10"
              />
            ) : (
              <div className="tw-size-5 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
            )}
            <UserProfileTooltipWrapper user={voterProfile}>
              <span className="tw-block tw-max-w-36 tw-truncate tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-iron-300">
                {voterProfile}
              </span>
            </UserProfileTooltipWrapper>
          </Link>

          <div className="tw-flex tw-min-w-0 tw-max-w-full tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1">
            {oldVote === 0 ? (
              <span className="tw-text-sm tw-text-iron-400">
                {waveRightPanelText("waves.sidebar.rightPanel.activity.voted")}
              </span>
            ) : (
              <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-500">
                {formatNumberWithCommas(oldVote)} →
              </span>
            )}
            <span
              className={`tw-whitespace-nowrap tw-text-sm tw-font-semibold ${
                newVote > 0 ? "tw-text-green" : "tw-text-red"
              }`}
            >
              {formatNumberWithCommas(newVote)} {WAVE_VOTING_LABELS[creditType]}
            </span>
            {log.contents["reason"] === "CREDIT_OVERSPENT" && (
              <SystemAdjustmentPill />
            )}
          </div>

          {dropCreatorProfile ? (
            <Link
              href={`/${dropCreatorProfile}`}
              className="tw-group tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-no-underline tw-transition-all tw-duration-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-opacity-80"
              title={dropCreatorTitle}
            >
              {dropCreatorContent}
            </Link>
          ) : (
            <div
              className="tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2"
              title={dropCreatorTitle}
            >
              {dropCreatorContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
