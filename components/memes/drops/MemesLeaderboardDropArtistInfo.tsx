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
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface MemesLeaderboardDropArtistInfoProps {
  readonly drop: ExtendedDrop;
  readonly isNativeTouch?: boolean;
}

const MemesLeaderboardDropArtistInfo = ({
  drop,
  isNativeTouch = false,
}: MemesLeaderboardDropArtistInfoProps) => {
  const locale = useBrowserLocale();
  const profileLabel = t(locale, "waves.leaderboard.grid.authorProfile", {
    author: drop.author.handle ?? drop.author.primary_address,
  });
  const authorName = (
    <span className="tw-text-sm tw-font-bold tw-leading-none tw-tracking-identity tw-text-white">
      {drop.author.handle ?? drop.author.primary_address}
    </span>
  );
  const authorLink = (
    <Link
      href={`/${drop.author.handle ?? drop.author.primary_address}`}
      aria-label={profileLabel}
      onClick={(event) => event.stopPropagation()}
      className={`tw-no-underline desktop-hover:hover:tw-underline ${isNativeTouch ? "tw-inline-flex tw-min-h-10 tw-items-center" : ""}`}
    >
      {authorName}
    </Link>
  );
  const authorIdentity = drop.author.handle ? (
    <UserProfileTooltipWrapper user={drop.author.handle}>
      {authorLink}
    </UserProfileTooltipWrapper>
  ) : (
    authorLink
  );
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-3">
      <MemesLeaderboardDropRank rank={drop.rank} />
      <WaveDropAuthorPfp drop={drop} disableNavigation={isNativeTouch} />
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
        {authorIdentity}

        {!!drop.author.level && (
          <UserCICAndLevel
            level={drop.author.level}
            size={UserCICAndLevelSize.SMALL}
          />
        )}

        <span inert={isNativeTouch} className="tw-contents">
          <DropAuthorBadges
            profile={drop.author}
            tooltipIdPrefix={`leaderboard-author-badges-${drop.id}`}
          />
        </span>

        <span className="tw-inline-flex tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap">
          <span className="tw-text-sm tw-text-iron-500">•</span>
          <WaveDropTime timestamp={drop.created_at} />
        </span>
      </div>
    </div>
  );
};

export default MemesLeaderboardDropArtistInfo;
