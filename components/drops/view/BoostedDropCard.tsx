"use client";

import { AuthContext } from "@/components/auth/Auth";
import BoostIcon from "@/components/common/icons/BoostIcon";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import { buildProcessedContent } from "@/components/waves/drops/media-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropBoostMutation } from "@/hooks/drops/useDropBoostMutation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { memo, useCallback, useContext, useMemo } from "react";

interface BoostedDropCardProps {
  readonly drop: ApiDrop;
  readonly onClick: () => void;
  readonly rank: number;
  readonly highlightTopOnly?: boolean;
}

const BoostedDropCard = memo(
  ({ drop, onClick, rank, highlightTopOnly = false }: BoostedDropCardProps) => {
    const { connectedProfile } = useContext(AuthContext);
    const { toggleBoost, isPending } = useDropBoostMutation();

    const extendedDrop = useMemo(
      () => convertApiDropToExtendedDrop(drop),
      [drop]
    );

    const resolvedPfp = drop.author.pfp
      ? getScaledImageUri(drop.author.pfp, ImageScale.W_AUTO_H_50)
      : null;

    const previewContent = useMemo(() => {
      const part = drop.parts[0];
      return buildProcessedContent(part?.content, part?.media, "View drop...");
    }, [drop.parts]);

    const rankClasses =
      {
        1: "tw-text-yellow-400",
        2: "tw-text-iron-400",
        3: "tw-text-iron-400",
      }[rank] ?? "tw-text-iron-400";

    const isBoosted = drop.context_profile_context?.boosted ?? false;
    const canBoost = !!connectedProfile && !drop.id.startsWith("temp-");

    const handleBoostClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (canBoost && !isPending) {
          toggleBoost(extendedDrop);
        }
      },
      [canBoost, isPending, toggleBoost, extendedDrop]
    );

    const isTopRank = rank === 1;
    const cardThemeClasses =
      highlightTopOnly && !isTopRank
        ? "tw-bg-iron-900/65 tw-ring-iron-800/80 hover:tw-bg-iron-900/85 hover:tw-ring-iron-700/90"
        : "tw-bg-amber-950/10 tw-ring-amber-700/30 hover:tw-bg-amber-950/15 hover:tw-ring-amber-600/40";

    return (
      <div
        className={`tw-group tw-cursor-pointer tw-rounded-xl tw-px-3 tw-py-3 tw-ring-1 tw-ring-inset tw-transition-all tw-duration-200 tw-@container ${cardThemeClasses}`}
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
        <div className="tw-flex tw-items-start tw-gap-x-3">
          <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2">
            <div
              className={`tw-flex tw-h-4 tw-min-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-xs tw-font-semibold ${rankClasses}`}
            >
              <span className="tw-leading-none">#{rank}</span>
            </div>

            <div className="tw-relative tw-size-8 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 @[360px]:tw-size-10">
              {resolvedPfp ? (
                <Image
                  src={resolvedPfp}
                  alt={`${drop.author.handle ?? drop.author.primary_address}'s profile picture`}
                  fill
                  sizes="(min-width: 360px) 40px, 32px"
                  className="tw-rounded-lg tw-bg-transparent tw-object-contain"
                />
              ) : (
                <div className="tw-size-full tw-rounded-lg tw-bg-iron-800" />
              )}
            </div>
          </div>

          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-2">
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-1.5">
                <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-200">
                  {drop.author.handle}
                </span>
                <UserCICAndLevel
                  level={drop.author.level}
                  size={UserCICAndLevelSize.COMPACT}
                />
              </div>

              <button
                type="button"
                onClick={handleBoostClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                  }
                }}
                disabled={!canBoost || isPending}
                className={`tw-flex tw-h-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-x-1 tw-rounded-full tw-border-0 tw-px-2 tw-leading-none tw-transition-colors tw-duration-200 ${
                  canBoost
                    ? "tw-cursor-pointer tw-ring-1 tw-ring-amber-500/20 hover:tw-bg-amber-600/20"
                    : "tw-cursor-default"
                } ${isBoosted ? "tw-bg-amber-600/20" : "tw-bg-amber-600/10"}`}
                aria-label={isBoosted ? "Remove boost" : "Boost"}
              >
                <span className="tw-font-mono tw-text-[11px] tw-font-bold tw-leading-none tw-text-amber-400">
                  {drop.boosts}
                </span>
                <BoostIcon
                  className="tw-size-2.5 tw-flex-shrink-0 tw-text-amber-500"
                  variant={isBoosted ? "filled" : "outlined"}
                />
              </button>
            </div>
            <ContentDisplay
              content={previewContent}
              className="tw-mt-1.5 tw-w-full tw-pr-0 tw-text-xs tw-text-white/60 @[360px]:tw-pr-12"
              linkClassName="tw-text-white/60 tw-underline tw-decoration-white/15 tw-underline-offset-2 tw-transition-colors tw-duration-300 hover:tw-text-white/75 hover:tw-decoration-white/30"
              shouldClamp={false}
              textClassName="tw-line-clamp-2 @[360px]:tw-line-clamp-1"
            />
          </div>

          <ChevronRightIcon className="tw-mt-1 tw-size-3 tw-flex-shrink-0 tw-text-iron-500 tw-transition-colors group-hover:tw-text-white" />
        </div>
      </div>
    );
  }
);

BoostedDropCard.displayName = "BoostedDropCard";

export default BoostedDropCard;
