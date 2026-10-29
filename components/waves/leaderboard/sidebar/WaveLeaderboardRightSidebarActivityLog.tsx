import type { ApiWaveLog } from "@/generated/models/ApiWaveLog";
import { formatNumberWithCommas, getTimeAgoShort } from "@/helpers/Helpers";
import Link from "next/link";
import Image from "next/image";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { WaveLeaderboardRightSidebarActivityLogDrop } from "./WaveLeaderboardRightSidebarActivityLogDrop";

import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { SystemAdjustmentPill } from "@/components/common/SystemAdjustmentPill";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  AnonymousAuthorAvatar,
  AnonymousAuthorName,
} from "@/components/waves/drops/AnonymousDropAuthor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  ArrowRightIcon,
  ArrowTurnDownRightIcon,
} from "@heroicons/react/24/outline";
import {
  getWaveRightPanelProfileIdentifier,
  waveRightPanelText,
} from "@/helpers/waves/wave-right-panel.helpers";

interface WaveLeaderboardRightSidebarActivityLogProps {
  // Historical wire rows can retain SQL NULL despite the published Date model.
  readonly log: Omit<ApiWaveLog, "created_at"> & {
    readonly created_at: Date | null;
  };
  readonly creditType: ApiWaveCreditType;
  readonly onDropClick: (() => void) | null;
}

export const WaveLeaderboardRightSidebarActivityLog: React.FC<
  WaveLeaderboardRightSidebarActivityLogProps
> = ({ log, creditType, onDropClick }) => {
  const locale = useBrowserLocale();
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
  const isAnonymousCreator = log.drop_author?.is_anonymous === true;
  const dropCreatorLabel = isAnonymousCreator
    ? t(locale, "competitions.anonymousAuthor")
    : (dropCreatorProfile ?? unknownProfile);
  const oldVoteValue: unknown = log.contents["oldVote"];
  const newVoteValue: unknown = log.contents["newVote"];
  const oldVote = typeof oldVoteValue === "number" ? oldVoteValue : 0;
  const newVote = typeof newVoteValue === "number" ? newVoteValue : 0;
  const dropCreatorTitle = waveRightPanelText(
    "waves.sidebar.rightPanel.activity.dropCreatorTitle",
    { profile: dropCreatorLabel }
  );
  const dropCreatorContent = isAnonymousCreator ? (
    <>
      <AnonymousAuthorAvatar className="tw-h-5 tw-w-5" />
      <span className="tw-min-w-0 tw-text-sm tw-font-medium">
        <AnonymousAuthorName />
      </span>
    </>
  ) : (
    <>
      {log.drop_author?.pfp ? (
        <Image
          src={getScaledImageUri(log.drop_author.pfp, ImageScale.W_AUTO_H_50)}
          alt=""
          width={20}
          height={20}
          className="tw-size-5 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10"
        />
      ) : (
        <div className="tw-size-5 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
      )}
      <span className="tw-min-w-0">
        {dropCreatorHandle ? (
          <UserProfileTooltipWrapper user={dropCreatorHandle}>
            <span className="tw-block tw-truncate tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 tw-transition-colors tw-duration-200 desktop-hover:group-hover:tw-text-iron-200">
              {dropCreatorHandle}
            </span>
          </UserProfileTooltipWrapper>
        ) : (
          <span className="tw-block tw-truncate tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
            {dropCreatorLabel}
          </span>
        )}
      </span>
    </>
  );

  return (
    <div className="tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-3 tw-gap-y-1 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-900 tw-py-3 md:tw-grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:tw-gap-x-5">
      <Link
        href={`/${voterProfile}`}
        className="tw-group tw-col-start-1 tw-row-start-1 tw-flex tw-min-h-8 tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-sm tw-no-underline tw-transition-opacity tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-opacity-80"
        title={waveRightPanelText(
          "waves.sidebar.rightPanel.activity.voterTitle",
          { profile: voterProfile }
        )}
      >
        {log.invoker.pfp ? (
          <Image
            src={getScaledImageUri(log.invoker.pfp, ImageScale.W_200_H_200)}
            alt=""
            width={24}
            height={24}
            className="tw-size-6 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-object-cover tw-ring-1 tw-ring-white/10"
          />
        ) : (
          <div className="tw-size-6 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-ring-1 tw-ring-white/10" />
        )}
        <span className="tw-min-w-0">
          <UserProfileTooltipWrapper user={voterProfile}>
            <span className="tw-block tw-truncate tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
              {voterProfile}
            </span>
          </UserProfileTooltipWrapper>
        </span>
      </Link>

      <div className="tw-col-start-2 tw-row-start-1 tw-flex tw-items-center tw-justify-end tw-gap-1 md:tw-col-start-4">
        {log.created_at !== null && (
          <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-400">
            {getTimeAgoShort(new Date(log.created_at).getTime())}
          </span>
        )}
        {onDropClick && (
          <WaveLeaderboardRightSidebarActivityLogDrop
            onDropClick={onDropClick}
          />
        )}
      </div>

      <div className="tw-col-span-2 tw-row-start-2 tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-y-2 tw-pl-8 md:tw-contents">
        <div className="tw-flex tw-min-w-0 tw-max-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 md:tw-col-start-2 md:tw-row-start-1">
          {oldVote === 0 ? (
            <span className="tw-text-xs tw-text-iron-400 md:tw-text-sm">
              {waveRightPanelText("waves.sidebar.rightPanel.activity.voted")}
            </span>
          ) : (
            <span className="tw-break-all tw-text-xs tw-tabular-nums tw-text-iron-400 md:tw-text-sm">
              {formatNumberWithCommas(oldVote)} →
            </span>
          )}
          <span
            className={`tw-max-w-full tw-break-words tw-rounded-md tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-tabular-nums md:tw-text-sm ${
              newVote > 0
                ? "tw-bg-green/10 tw-text-green"
                : "tw-bg-red/10 tw-text-red"
            }`}
          >
            {formatNumberWithCommas(newVote)} {WAVE_VOTING_LABELS[creditType]}
          </span>
          {log.contents["reason"] === "CREDIT_OVERSPENT" && (
            <SystemAdjustmentPill />
          )}
        </div>

        <div className="tw-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 md:tw-col-start-3 md:tw-row-start-1">
          <ArrowTurnDownRightIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-flex-shrink-0 tw-text-iron-500 md:tw-hidden"
          />
          <ArrowRightIcon
            aria-hidden="true"
            className="tw-hidden tw-size-3.5 tw-flex-shrink-0 tw-text-iron-500 md:tw-block"
          />
          {dropCreatorProfile && !isAnonymousCreator ? (
            <Link
              href={`/${dropCreatorProfile}`}
              className="tw-group tw-flex tw-min-h-6 tw-min-w-0 tw-items-center tw-gap-2 tw-no-underline tw-transition-opacity tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-opacity-80"
              title={dropCreatorTitle}
            >
              {dropCreatorContent}
            </Link>
          ) : (
            <div
              className="tw-flex tw-min-h-6 tw-min-w-0 tw-items-center tw-gap-2"
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
