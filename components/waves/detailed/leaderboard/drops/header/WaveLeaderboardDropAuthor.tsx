import React from "react";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../../../user/utils/UserCICAndLevel";
import { cicToType, getTimeAgoShort } from "../../../../../../helpers/Helpers";
import Link from "next/link";

interface WaveLeaderboardDropAuthorProps {
  readonly drop: ExtendedDrop;
}

export const WaveLeaderboardDropAuthor: React.FC<
  WaveLeaderboardDropAuthorProps
> = ({ drop }) => {
  return (
    <Link
      href={`/${drop.author.handle}`}
      onClick={(e) => e.stopPropagation()}
      className="tw-flex tw-items-center tw-gap-x-3.5 tw-no-underline group"
    >
      <div className="tw-relative">
        {drop.author.pfp ? (
          <img
            className="tw-size-9 md:tw-size-11 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-object-contain tw-flex-shrink-0"
            src={drop.author.pfp}
            alt="User avatar"
          />
        ) : (
          <div className="tw-size-9 md:tw-size-11 tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0" />
        )}
        <div className="tw-absolute -tw-bottom-1 -tw-right-1">
          <UserCICAndLevel
            level={drop.author.level}
            cicType={cicToType(drop.author.cic)}
            size={UserCICAndLevelSize.SMALL}
          />
        </div>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-y-1.5 sm:tw-gap-y-0">
        <span className="tw-text-base md:tw-text-lg tw-font-semibold tw-text-iron-100 tw-leading-none group-hover:tw-text-iron-50 tw-transition-colors">
          {drop.author.handle}
        </span>
        <span className="tw-whitespace-nowrap tw-text-xs md:tw-text-sm tw-font-medium tw-text-iron-400 tw-leading-none">
          {getTimeAgoShort(drop.created_at)}
        </span>
      </div>
    </Link>
  );
};
