"use client";

import BoostIcon from "@/components/common/icons/BoostIcon";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import Image from "next/image";
import { memo } from "react";

interface BoostedDropCardProps {
  readonly drop: ApiDrop;
  readonly onClick: () => void;
  readonly rank: number;
}

const BoostedDropCard = memo(
  ({ drop, onClick, rank }: BoostedDropCardProps) => {
    const resolvedPfp = drop.author.pfp
      ? resolveIpfsUrlSync(drop.author.pfp)
      : null;

    const contentPreview =
      drop.parts[0]?.content?.slice(0, 100) ?? "View drop...";
    const truncatedContent =
      contentPreview.length >= 100 ? `${contentPreview}...` : contentPreview;

    return (
      <div
        className="tw-group tw-cursor-pointer tw-rounded-xl tw-bg-gradient-to-r tw-from-amber-950/30 tw-to-iron-900/50 tw-px-3 tw-py-2.5 tw-ring-1 tw-ring-inset tw-ring-amber-700/30 tw-transition-all tw-duration-200 hover:tw-ring-amber-600/50"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="tw-flex tw-items-center tw-gap-x-3">
          {/* Rank badge */}
          <div className="tw-flex tw-size-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-amber-600/20 tw-ring-1 tw-ring-amber-500/40">
            <span className="tw-text-xs tw-font-bold tw-text-amber-400">
              {rank}
            </span>
          </div>

          {/* Author avatar */}
          <div className="tw-relative tw-size-8 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-900">
            {resolvedPfp ? (
              <Image
                src={resolvedPfp}
                alt={`${drop.author.handle ?? drop.author.primary_address}'s profile picture`}
                fill
                sizes="32px"
                className="tw-rounded-lg tw-bg-transparent tw-object-contain"
              />
            ) : (
              <div className="tw-size-full tw-rounded-lg tw-bg-iron-800" />
            )}
          </div>

          {/* Content */}
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <UserCICAndLevel
                level={drop.author.level}
                size={UserCICAndLevelSize.SMALL}
              />
              <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-200">
                {drop.author.handle}
              </span>
            </div>
            <p className="tw-mb-0 tw-mt-0.5 tw-truncate tw-text-xs tw-text-iron-400">
              {truncatedContent}
            </p>
          </div>

          {/* Boost count */}
          <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-1.5 tw-rounded-lg tw-bg-amber-600/10 tw-px-2 tw-py-1">
            <BoostIcon className="tw-size-3.5 tw-text-amber-500" />
            <span className="tw-text-xs tw-font-semibold tw-text-amber-400">
              {drop.boosts}
            </span>
          </div>

          {/* Arrow indicator */}
          <svg
            className="tw-size-4 tw-flex-shrink-0 tw-text-iron-500 tw-transition-colors group-hover:tw-text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    );
  }
);

BoostedDropCard.displayName = "BoostedDropCard";

export default BoostedDropCard;
