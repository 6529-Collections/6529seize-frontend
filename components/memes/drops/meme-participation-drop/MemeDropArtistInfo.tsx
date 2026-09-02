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
import { getWaveRoute } from "@/helpers/navigation.helpers";
import MemesLeaderboardDropRank from "../MemesLeaderboardDropRank";

interface MemeDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

export default function MemeDropArtistInfo({ drop }: MemeDropArtistInfoProps) {
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-3">
      <MemesLeaderboardDropRank rank={drop.rank} />
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-1.5">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <Link
            href={`/${drop.author.handle ?? drop.author.primary_address}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-no-underline"
          >
            {drop.author.handle ? (
              <UserProfileTooltipWrapper user={drop.author.handle}>
                <span className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-none tw-tracking-identity tw-text-white">
                  {drop.author.handle}
                </span>
              </UserProfileTooltipWrapper>
            ) : (
              <span className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-none tw-tracking-identity tw-text-white">
                {drop.author.primary_address}
              </span>
            )}
          </Link>
          {!!drop.author.level && (
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          <DropAuthorBadges
            profile={drop.author}
            tooltipIdPrefix={`meme-author-badges-${drop.id}`}
            className="tw-inline-flex tw-items-center tw-gap-x-2"
          />
          <span className="tw-inline-flex tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap">
            <span className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700" />
            <WaveDropTime timestamp={drop.created_at} />
          </span>
        </div>
        <Link
          onClick={(e) => e.stopPropagation()}
          href={getWaveRoute({
            waveId: drop.wave.id,
            isDirectMessage: false,
            isApp: false,
          })}
          className="tw-leading-0 tw-mb-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
        >
          {drop.wave.name}
        </Link>
      </div>
    </div>
  );
}
