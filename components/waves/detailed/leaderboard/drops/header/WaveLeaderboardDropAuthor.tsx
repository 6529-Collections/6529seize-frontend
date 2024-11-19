import React from "react";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../../../user/utils/UserCICAndLevel";
import { cicToType } from "../../../../../../helpers/Helpers";
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
      className="tw-flex tw-items-center tw-gap-x-3 tw-no-underline"
    >
      <div className="tw-relative">
        {drop.author.pfp ? (
          <img
            className="tw-size-8 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-object-contain tw-flex-shrink-0"
            src={drop.author.pfp}
            alt="User avatar"
          />
        ) : (
          <div className="tw-size-8 tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0" />
        )}
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <UserCICAndLevel
          level={drop.author.level}
          cicType={cicToType(drop.author.cic)}
          size={UserCICAndLevelSize.MEDIUM}
        />
        <span className="tw-text-md tw-font-semibold tw-text-iron-100">
          {drop.author.handle}
        </span>
      </div>
    </Link>
  );
};
