import React from "react";
import { ApiDrop } from "../../../../generated/models/ObjectSerializer";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../user/utils/UserCICAndLevel";
import { cicToType } from "../../../../helpers/Helpers";

interface WaveDropAuthorProps {
  readonly drop: ApiDrop;
}

export const WaveDropAuthor: React.FC<WaveDropAuthorProps> = ({ drop }) => {
  return (
    <Link
      href={`/${drop.author.handle}`}
      className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline"
    >
      {drop.author.pfp ? (
        <img
          className="tw-size-6 tw-rounded-lg tw-ring-2 tw-ring-[#E8D48A]/20 tw-object-cover"
          src={drop.author.pfp}
          alt="User avatar"
        />
      ) : (
        <div className="tw-size-6 tw-rounded-lg tw-ring-2 tw-ring-[#E8D48A]/20 tw-bg-iron-800" />
      )}
      <span className="tw-text-sm tw-font-medium tw-text-iron-100">
        {drop.author.handle}
      </span>
      <UserCICAndLevel
        level={drop.author.level}
        cicType={cicToType(drop.author.cic)}
        size={UserCICAndLevelSize.MEDIUM}
      />
    </Link>
  );
};
