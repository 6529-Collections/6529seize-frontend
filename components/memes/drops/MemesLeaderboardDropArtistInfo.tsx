import React from "react";
import Link from "next/link";
import { cicToType } from "../../../helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "../../waves/drops/WaveDropAuthorPfp";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";
import WaveDropTime from "../../waves/drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "../../utils/tooltip/UserProfileTooltipWrapper";

interface MemesLeaderboardDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

const MemesLeaderboardDropArtistInfo: React.FC<
  MemesLeaderboardDropArtistInfoProps
> = ({ drop }) => {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <Link
        href={`/${drop.author?.handle}`}
        onClick={(e) => e.stopPropagation()}
        className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline group"
      >
        <WaveDropAuthorPfp drop={drop} />
      </Link>
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicToType(drop.author.cic)}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          {drop.author?.handle ? (
            <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
              <Link
                href={`/${drop.author?.handle}`}
                onClick={(e) => e.stopPropagation()}
                className="tw-no-underline desktop-hover:hover:tw-underline"
              >
                <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                  {drop.author?.handle}
                </span>
              </Link>
            </UserProfileTooltipWrapper>
          ) : (
            <Link
              href={`/${drop.author?.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-no-underline desktop-hover:hover:tw-underline"
            >
              <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                {drop.author?.handle}
              </span>
            </Link>
          )}

          {/* Divider followed by WaveDropTime component */}
          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <WaveDropTime 
            timestamp={drop.created_at}
          />
        </div>
        <WinnerDropBadge
          rank={drop.rank}
          decisionTime={drop.winning_context?.decision_time || null}
        />
      </div>
    </div>
  );
};

export default MemesLeaderboardDropArtistInfo;
