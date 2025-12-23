import React from "react";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getTimeAgoShort } from "@/helpers/Helpers";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";

interface MemeWinnerArtistInfoProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo?: boolean;
}

export default function MemeWinnerArtistInfo({
  drop,
  showWaveInfo = true,
}: MemeWinnerArtistInfoProps) {
  // Get the decision time from the winning context
  const decisionTime = drop.winning_context?.decision_time;

  return (
    <div className="tw-flex tw-items-start tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-y-2">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {!!drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
            {drop.author?.handle ? (
              <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
                <Link
                  onClick={(e) => e.stopPropagation()}
                  href={`/${drop.author?.handle}`}
                  className="tw-no-underline desktop-hover:hover:tw-underline tw-text-iron-200 desktop-hover:hover:tw-text-opacity-80 tw-transition tw-duration-300 tw-ease-out"
                >
                  {drop.author?.handle}
                </Link>
              </UserProfileTooltipWrapper>
            ) : (
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/${drop.author?.handle ?? drop.author?.id}`}
                className="tw-no-underline desktop-hover:hover:tw-underline tw-text-iron-200 desktop-hover:hover:tw-text-opacity-80 tw-transition tw-duration-300 tw-ease-out"
              >
                {drop.author?.handle ?? drop.author?.id}
              </Link>
            )}
          </p>

          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <p className="tw-text-xs tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
            {getTimeAgoShort(drop.created_at)}
          </p>
        </div>
        <WinnerDropBadge rank={1} decisionTime={decisionTime ?? null} />

        {showWaveInfo && drop.wave && (
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`/waves?wave=${drop.wave.id}`}
            className="tw-mb-0 tw-text-[11px] tw-leading-0 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
          >
            {drop.wave.name}
          </Link>
        )}
      </div>
    </div>
  );
}
