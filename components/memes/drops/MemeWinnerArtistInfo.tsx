import React from "react";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "../../waves/drops/WaveDropAuthorPfp";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { cicToType, getTimeAgoShort } from "../../../helpers/Helpers";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";

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
  const cicType = cicToType(drop.author?.cic);

  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {!!drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicType}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
            <Link
              onClick={(e) => e.stopPropagation()}
              href={`/${drop.author?.handle}`}
              className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
            >
              {drop.author?.handle}
            </Link>
          </p>

          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
            {getTimeAgoShort(drop.created_at)}
          </p>
          <div className="tw-ml-2">
            <WinnerDropBadge rank={1} decisionTime={decisionTime ?? null} />
          </div>
        </div>

        {showWaveInfo && drop.wave && (
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`/my-stream?wave=${drop.wave.id}`}
            className="tw-mb-0 tw-text-[11px] tw-leading-0 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
          >
            {drop.wave.name}
          </Link>
        )}
      </div>
    </div>
  );
}
