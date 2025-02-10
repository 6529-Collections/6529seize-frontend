import React from "react";
import { ApiDrop } from "../../../generated/models/ObjectSerializer";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../user/utils/UserCICAndLevel";
import { cicToType } from "../../../helpers/Helpers";

interface SingleWaveDropAuthorProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropAuthor: React.FC<SingleWaveDropAuthorProps> = ({ drop }) => {
  return (
    <Link
      href={`/${drop.author.handle}`}
      className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline"
    >
      {drop.author.pfp ? (
        <img
          className="tw-size-6 tw-rounded-md tw-ring-1 tw-ring-inset tw-ring-white/10 tw-object-contain tw-bg-iron-900"
          src={drop.author.pfp}
          alt="User avatar"
        />
      ) : (
        <div className="tw-size-6 tw-rounded-md tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-800" />
      )}
      <UserCICAndLevel
        level={drop.author.level}
        cicType={cicToType(drop.author.cic)}
        size={UserCICAndLevelSize.SMALL}
      />
      <span className="tw-text-sm tw-font-medium tw-text-iron-100">
        {drop.author.handle}
      </span>
    </Link>
  );
}; 