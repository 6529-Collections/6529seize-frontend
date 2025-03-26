import React from "react";
import Link from "next/link";
import { getTimeAgoShort, cicToType } from "../../../../helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../user/utils/UserCICAndLevel";
import WaveDropAuthorPfp from "../../../waves/drops/WaveDropAuthorPfp";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import WinnerDropBadge from "../../../waves/drops/winner/WinnerDropBadge";

interface MemeDropArtistInfoProps {
  readonly drop: ExtendedDrop;
}

export default function MemeDropArtistInfo({ drop }: MemeDropArtistInfoProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <Link
        href={`/${drop.author?.handle}`}
        onClick={(e) => e.stopPropagation()}
        className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline group"
      >
        <WaveDropAuthorPfp drop={drop} />
      </Link>
      <div className="tw-flex tw-flex-col tw-gap-y-1.5">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {!!drop.author?.level && (
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicToType(drop.author.cic)}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          <Link
            href={`/${drop.author?.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-no-underline"
          >
            <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
              {drop.author?.handle}
            </span>
          </Link>
          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <span className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
            {getTimeAgoShort(drop.created_at)}
          </span>
          <div className="tw-ml-2">
            <WinnerDropBadge
              rank={drop.rank}
              decisionTime={drop.winning_context?.decision_time ?? null}
            />
          </div>
        </div>
        {drop.wave && (
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
