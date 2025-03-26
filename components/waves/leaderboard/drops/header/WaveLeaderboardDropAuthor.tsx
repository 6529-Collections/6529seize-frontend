import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { cicToType, getTimeAgoShort } from "../../../../../helpers/Helpers";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../../user/utils/UserCICAndLevel";
import WinnerDropBadge from "../../../../waves/drops/winner/WinnerDropBadge";

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
        <div className="tw-h-10 tw-w-10 tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
          {drop.author.pfp ? (
            <div className="tw-rounded-lg tw-h-full tw-w-full">
              <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10">
                <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
                  <img
                    src={drop.author.pfp}
                    alt="Profile picture"
                    className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-rounded-lg"></div>
          )}
        </div>
      </Link>
      <div className="tw-flex tw-items-center tw-gap-x-4">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <UserCICAndLevel
            level={drop.author.level}
            cicType={cicToType(drop.author.cic)}
            size={UserCICAndLevelSize.SMALL}
          />
          <Link
            href={`/${drop.author.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-no-underline"
          >
            <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
              {drop.author.handle}
            </span>
          </Link>

          <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>

          <span className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
            {getTimeAgoShort(drop.created_at)}
          </span>
        </div>
        <WinnerDropBadge
          rank={drop.rank}
          decisionTime={drop.winning_context?.decision_time || null}
        />
      </div>
    </div>
  );
};
