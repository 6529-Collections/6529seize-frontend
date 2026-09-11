import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

import Link from "next/link";
import Image from "next/image";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import { isOfficiallyApprovedDrop } from "@/helpers/waves/approve-wave.helpers";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";

interface WaveLeaderboardDropAuthorProps {
  readonly drop: ExtendedDrop;
  readonly showAvatar?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
}

interface WaveLeaderboardDropAuthorAvatarProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropAuthorAvatar: React.FC<
  WaveLeaderboardDropAuthorAvatarProps
> = ({ drop }) => {
  const authorLabel = drop.author.handle ?? drop.author.primary_address;

  return (
    <Link
      href={`/${authorLabel}`}
      onClick={(e) => e.stopPropagation()}
      className="group tw-flex tw-items-center tw-gap-x-2 tw-no-underline"
    >
      <div className="tw-relative tw-h-10 tw-w-10 tw-flex-shrink-0 tw-rounded-lg tw-bg-iron-900">
        {drop.author.pfp ? (
          <div className="tw-h-full tw-w-full tw-rounded-lg">
            <div className="tw-h-full tw-w-full tw-max-w-full tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
              <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-text-center">
                <Image
                  src={resolveIpfsUrlSync(drop.author.pfp)}
                  alt="Profile picture"
                  width={40}
                  height={40}
                  className="tw-rounded-lg tw-object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="tw-h-full tw-w-full tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10"></div>
        )}
      </div>
    </Link>
  );
};

export const WaveLeaderboardDropAuthor: React.FC<
  WaveLeaderboardDropAuthorProps
> = ({ drop, showAvatar = true, winningThreshold }) => {
  const authorLabel = drop.author.handle ?? drop.author.primary_address;
  const isApproveDrop =
    typeof winningThreshold === "number" && winningThreshold > 0;
  const isApprovedDrop = isApproveDrop && isOfficiallyApprovedDrop(drop);
  let authorStatusBadge: React.ReactNode = null;

  if (isApprovedDrop) {
    authorStatusBadge = (
      <ApprovalStatusBadge
        approvedAt={drop.winning_context?.decision_time ?? null}
      />
    );
  } else if (!isApproveDrop) {
    authorStatusBadge = (
      <WinnerDropBadge
        rank={drop.rank}
        decisionTime={drop.winning_context?.decision_time ?? null}
      />
    );
  }

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-3">
      {showAvatar && <WaveLeaderboardDropAuthorAvatar drop={drop} />}
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
        <UserProfileTooltipWrapper user={authorLabel}>
          <Link
            href={`/${authorLabel}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-no-underline"
          >
            <span className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
              {authorLabel}
            </span>
          </Link>
        </UserProfileTooltipWrapper>
        <UserCICAndLevel
          level={drop.author.level}
          size={UserCICAndLevelSize.SMALL}
        />
        <DropAuthorBadges
          profile={drop.author}
          wave={drop.wave}
          tooltipIdPrefix={`leaderboard-author-badges-${drop.id}`}
        />
        {authorStatusBadge}
        <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700"></div>
        <WaveDropTime timestamp={drop.created_at} />
      </div>
    </div>
  );
};
