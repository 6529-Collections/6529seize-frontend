"use client";

import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { useCompactMode } from "@/contexts/CompactModeContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

interface WaveDropAuthorPfpProps {
  readonly drop: ApiDrop;
}

type PfpLoadMode = "optimized" | "unoptimized" | "placeholder";

type PfpLoadState = {
  src: string | null;
  mode: PfpLoadMode;
};

const WaveDropAuthorPfp: React.FC<WaveDropAuthorPfpProps> = ({ drop }) => {
  const compact = useCompactMode();
  const resolvedPfp = drop.author.pfp
    ? resolveIpfsUrlSync(drop.author.pfp)
    : null;
  const [loadState, setLoadState] = useState<PfpLoadState>({
    src: null,
    mode: "optimized",
  });
  const loadMode: PfpLoadMode =
    loadState.src === resolvedPfp ? loadState.mode : "optimized";
  const setLoadMode = (mode: PfpLoadMode) => {
    setLoadState({ src: resolvedPfp, mode });
  };

  const authorHandle = drop.author.handle;
  const profileHref = authorHandle ? `/${authorHandle}` : null;
  const tooltipUser = authorHandle ?? drop.author.id;

  const sizeClasses = compact ? "tw-h-8 tw-w-8" : "tw-h-10 tw-w-10";
  const containerClasses = `tw-relative tw-flex-shrink-0 ${sizeClasses} tw-rounded-lg tw-bg-iron-900 tw-overflow-hidden`;

  const handleImageError = () => {
    if (loadMode === "optimized") {
      setLoadMode("unoptimized");
      return;
    }
    setLoadMode("placeholder");
  };

  const avatarContent =
    resolvedPfp === null || loadMode === "placeholder" ? (
      <div className="tw-h-full tw-w-full tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10" />
    ) : (
      <Image
        key={`${resolvedPfp}-${loadMode}`}
        src={getScaledImageUri(resolvedPfp, ImageScale.W_AUTO_H_50)}
        alt={
          authorHandle ? `${authorHandle}'s profile picture` : "Profile picture"
        }
        fill
        sizes={compact ? "32px" : "40px"}
        unoptimized={loadMode === "unoptimized"}
        onError={handleImageError}
        className="tw-rounded-lg tw-bg-transparent tw-object-contain"
      />
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
