"use client";

import React from "react";
import type { ApiDrop } from "@/generated/models/ObjectSerializer";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import Link from "next/link";
import Image from "next/image";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";

interface SingleWaveDropAuthorProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropAuthor: React.FC<SingleWaveDropAuthorProps> = ({
  drop,
}) => {
  const resolvedPfp = drop.author.pfp
    ? resolveIpfsUrlSync(drop.author.pfp)
    : null;
  const avatarAlt = drop.author.handle
    ? `${drop.author.handle}'s profile picture`
    : "Profile picture";

  return (
    <div className="tw-flex tw-items-start tw-gap-x-2.5">
      <Link
        href={`/${drop.author.handle ?? drop.author.primary_address}`}
        className="tw-flex tw-items-center tw-gap-x-2.5 tw-no-underline"
      >
        {resolvedPfp ? (
          <div className="tw-relative tw-h-10 tw-w-10 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
            <Image
              src={resolvedPfp}
              alt={avatarAlt}
              fill
              sizes="40px"
              className="tw-size-full tw-object-contain tw-opacity-90"
            />
          </div>
        ) : (
          <div className="tw-h-10 tw-w-10 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900" />
        )}
        <div className="tw-inline-flex tw-items-center tw-gap-x-2">
          <div className="tw-inline-flex tw-items-center tw-gap-x-1">
            <UserProfileTooltipWrapper
              user={drop.author.handle ?? drop.author.id}
            >
              <span className="tw-text-md tw-font-semibold tw-text-white desktop-hover:hover:tw-text-opacity-80">
                {drop.author.handle}
              </span>
            </UserProfileTooltipWrapper>
            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />
          </div>
          <div className="tw-inline-flex tw-items-center tw-gap-x-1">
            <DropAuthorBadges
              profile={drop.author}
              tooltipIdPrefix={`single-drop-author-badges-${drop.id}`}
            />
          </div>
        </div>
      </Link>
    </div>
  );
};
