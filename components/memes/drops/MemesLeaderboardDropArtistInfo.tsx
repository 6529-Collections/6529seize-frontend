"use client";

import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import MemesLeaderboardDropRank from "./MemesLeaderboardDropRank";

interface MemesLeaderboardDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

const MemesLeaderboardDropArtistInfo = ({
  drop,
}: MemesLeaderboardDropArtistInfoProps) => {
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-3">
      <MemesLeaderboardDropRank rank={drop.rank} />
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
        {drop.author.handle ? (
          <UserProfileTooltipWrapper user={drop.author.handle}>
            <Link
              href={`/${drop.author.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-no-underline desktop-hover:hover:tw-underline"
            >
              <span className="tw-text-sm tw-font-bold tw-leading-none tw-tracking-identity tw-text-white">
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
            <span className="tw-text-sm tw-font-bold tw-leading-none tw-tracking-identity tw-text-white">
              {drop.author.primary_address}
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

        <span className="tw-inline-flex tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap">
          <span className="tw-text-sm tw-text-iron-500">•</span>
          <WaveDropTime timestamp={drop.created_at} />
        </span>
      </div>
    </div>
  );
};

export default MemesLeaderboardDropArtistInfo;
