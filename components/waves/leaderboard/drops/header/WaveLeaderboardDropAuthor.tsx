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

interface WaveLeaderboardDropAuthorProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropAuthor: React.FC<
  WaveLeaderboardDropAuthorProps
> = ({ drop }) => {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <Link
        href={`/${drop.author.handle}`}
        onClick={(e) => e.stopPropagation()}
        className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline group"
      >
        <div className="tw-h-11 tw-w-11 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
          {drop.author.pfp ? (
            <div className="tw-rounded-lg tw-h-full tw-w-full">
              <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                  <Image
                    src={resolveIpfsUrlSync(drop.author.pfp)}
                    alt="Profile picture"
                    width={44}
                    height={44}
                    className="tw-rounded-lg tw-object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-rounded-lg"></div>
          )}
        </div>
      </Link>
      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <UserCICAndLevel
            level={drop.author.level}
            size={UserCICAndLevelSize.SMALL}
          />
          <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
            <Link
              href={`/${drop.author.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-no-underline"
            >
              <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                {drop.author.handle}
              </span>
            </Link>
          </UserProfileTooltipWrapper>

          <div className="tw-size-[3px] tw-bg-iron-900 tw-rounded-full tw-flex-shrink-0"></div>

          <WaveDropTime timestamp={drop.created_at} />
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <WinnerDropBadge
            rank={drop.rank}
            decisionTime={drop.winning_context?.decision_time || null}
          />
        </div>
      </div>
    </div>
  );
};
