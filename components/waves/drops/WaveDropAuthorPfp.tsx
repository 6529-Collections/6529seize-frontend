"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { useCompactMode } from "@/contexts/CompactModeContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";

interface WaveDropAuthorPfpProps {
  readonly drop: ApiDrop;
}

const WaveDropAuthorPfp: React.FC<WaveDropAuthorPfpProps> = ({ drop }) => {
  const compact = useCompactMode();
  const resolvedPfp = drop.author.pfp
    ? resolveIpfsUrlSync(drop.author.pfp)
    : null;

  const authorHandle = drop.author.handle;
  const profileHref = authorHandle ? `/${authorHandle}` : null;
  const tooltipUser = authorHandle ?? drop.author.id;

  const sizeClasses = compact ? "tw-h-8 tw-w-8" : "tw-h-10 tw-w-10";
  const containerClasses = `tw-relative tw-flex-shrink-0 ${sizeClasses} tw-rounded-lg tw-bg-iron-900 tw-overflow-hidden`;

  const avatarContent = resolvedPfp ? (
    <Image
      src={resolvedPfp}
      alt={authorHandle ? `${authorHandle}'s profile picture` : "Profile picture"}
      fill
      sizes={compact ? "32px" : "40px"}
      className="tw-object-contain tw-rounded-lg tw-bg-transparent"
    />
  ) : (
    <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-rounded-lg" />
  );

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  if (!profileHref) {
    return <div className={containerClasses}>{avatarContent}</div>;
  }

  return (
    <UserProfileTooltipWrapper user={tooltipUser}>
      <Link
        href={profileHref}
        prefetch={false}
        aria-label={`View ${tooltipUser}'s profile`}
        onClick={handleClick}
        className={`${containerClasses} tw-block`}
      >
        {avatarContent}
      </Link>
    </UserProfileTooltipWrapper>
  );
};

export default WaveDropAuthorPfp;
