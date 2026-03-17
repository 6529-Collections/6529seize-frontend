"use client";

import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";

interface MemesLeaderboardDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

const MemesLeaderboardDropArtistInfo = ({
  drop,
}: MemesLeaderboardDropArtistInfoProps) => {
  return (
    <div className="tw-flex tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-h-12 tw-flex-col tw-justify-between">
        <div className="-tw-mt-0.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
          {drop.author.handle ? (
            <UserProfileTooltipWrapper user={drop.author.handle}>
              <Link
                href={`/${drop.author.handle}`}
                onClick={(e) => e.stopPropagation()}
                className="tw-no-underline desktop-hover:hover:tw-underline"
              >
                <span className="tw-text-sm tw-font-bold tw-text-white">
                  {drop.author.handle}
                </span>
              </Link>
            </UserProfileTooltipWrapper>
          ) : (
            <Link
              href={`/${drop.author.handle ?? drop.author.primary_address}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-no-underline desktop-hover:hover:tw-underline"
            >
              <span className="tw-text-sm tw-font-bold tw-text-white">
                {drop.author.handle}
              </span>
            </Link>
          )}

          {!!drop.author.level && (
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
          )}

          <DropAuthorBadges
            profile={drop.author}
            tooltipIdPrefix={`leaderboard-author-badges-${drop.id}`}
          />

          <span className="tw-text-sm tw-text-iron-500">•</span>

          <WaveDropTime timestamp={drop.created_at} />
        </div>

        {/* Bottom row: Winner badge */}
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <WinnerDropBadge
            rank={drop.rank}
            decisionTime={drop.winning_context?.decision_time ?? null}
          />
        </div>
      </div>
    </div>
  );
};

export default MemesLeaderboardDropArtistInfo;
