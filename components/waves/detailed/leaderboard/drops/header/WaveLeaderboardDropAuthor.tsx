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
      className="tw-flex tw-items-center tw-gap-3 tw-no-underline"
    >
      <div className="tw-relative">
        {drop.author.pfp ? (
          <img
            className="tw-size-8 tw-rounded-lg tw-ring-2 tw-ring-[#E8D48A]/20 tw-object-cover"
            src={drop.author.pfp}
            alt="User avatar"
          />
        ) : (
          <div className="tw-size-8 tw-rounded-lg tw-ring-2 tw-ring-[#E8D48A]/20 tw-bg-iron-800" />
        )}
      </div>
      <div>
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <span className="tw-text-md tw-font-semibold tw-text-iron-100">
            {drop.author.handle}
          </span>
          <UserCICAndLevel
            level={drop.author.level}
            cicType={cicToType(drop.author.cic)}
            size={UserCICAndLevelSize.MEDIUM}
          />
        </div>
      </div>
    </Link>
  );
};
