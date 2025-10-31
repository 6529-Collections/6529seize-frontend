 "use client";

import React from "react";
import Image from "next/image";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

interface WaveDropAuthorPfpProps {
  readonly drop: ApiDrop;
}

const WaveDropAuthorPfp: React.FC<WaveDropAuthorPfpProps> = ({ drop }) => {
  // Check if this drop author has any main stage winner drop IDs
  const isFirstPlace = drop.author.winner_main_stage_drop_ids && 
                       drop.author.winner_main_stage_drop_ids.length > 0;
  const shadowClass = isFirstPlace ? "tw-shadow-[0_1px_4px_rgba(251,191,36,0.15)]" : "";
  const resolvedPfp = drop.author.pfp
    ? resolveIpfsUrlSync(drop.author.pfp)
    : null;

  return (
    <div
      className={`tw-relative tw-flex-shrink-0 tw-h-10 tw-w-10 tw-rounded-lg tw-bg-iron-900 tw-overflow-hidden ${shadowClass}`}>
      {resolvedPfp ? (
        <Image
          src={resolvedPfp}
          alt="Profile picture"
          fill
          sizes="40px"
          className="tw-object-contain tw-rounded-lg tw-bg-transparent"
        />
      ) : (
        <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-rounded-lg" />
      )}
    </div>
  );
};

export default WaveDropAuthorPfp;
