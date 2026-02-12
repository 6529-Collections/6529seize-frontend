"use client";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import WaveDropPartContentMarkdown from "@/components/waves/drops/WaveDropPartContentMarkdown";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import { ImageScale } from "@/helpers/image.helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";
import Link from "next/link";
import React, {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import WaveLeaderboardGalleryItemVotes from "../gallery/WaveLeaderboardGalleryItemVotes";
import type { WaveLeaderboardGridMode } from "./WaveLeaderboardGrid";

interface WaveLeaderboardGridItemProps {
  readonly drop: ExtendedDrop;
  readonly mode: WaveLeaderboardGridMode;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MANIFOLD_LISTING_PATH_PATTERN = /^\/@[^/]+\/id\/[^/?#]+\/?$/i;
const SUPER_RARE_ARTWORK_PATH_PATTERN =
  /^\/artwork\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const SUPER_RARE_ARTWORK_V2_PATH_PATTERN = /^\/artwork-v2\/[^/?#]+\/?$/i;
const FOUNDATION_MINT_PATH_PATTERN =
  /^\/mint\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const OPENSEA_ITEM_PATH_PATTERN =
  /^\/item\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const OPENSEA_ASSET_PATH_PATTERN =
  /^\/assets\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const TRANSIENT_NFT_PATH_PATTERN =
  /^\/nfts\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;

const getStandaloneHttpUrl = (content: string | null | undefined): string => {
  if (!content) {
    return "";
  }

  const trimmed = content.trim();
  const match = trimmed.match(/^<?(https?:\/\/[^\s<>]+)>?$/i);
  return match?.[1] ?? "";
};

const isMarketplaceLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    if (matchesDomainOrSubdomain(hostname, "manifold.xyz")) {
      return MANIFOLD_LISTING_PATH_PATTERN.test(pathname);
    }

    if (matchesDomainOrSubdomain(hostname, "superrare.com")) {
      return (
        SUPER_RARE_ARTWORK_PATH_PATTERN.test(pathname) ||
        SUPER_RARE_ARTWORK_V2_PATH_PATTERN.test(pathname)
      );
    }

    if (matchesDomainOrSubdomain(hostname, "foundation.app")) {
      return FOUNDATION_MINT_PATH_PATTERN.test(pathname);
    }

    if (matchesDomainOrSubdomain(hostname, "opensea.io")) {
      return (
        OPENSEA_ITEM_PATH_PATTERN.test(pathname) ||
        OPENSEA_ASSET_PATH_PATTERN.test(pathname)
      );
    }

    if (matchesDomainOrSubdomain(hostname, "transient.xyz")) {
      return TRANSIENT_NFT_PATH_PATTERN.test(pathname);
    }

    return false;
  } catch {
    return false;
  }
};

export const WaveLeaderboardGridItem: React.FC<
  WaveLeaderboardGridItemProps
> = ({ drop, mode, onDropClick }) => {
  const isCompactMode = mode === "compact";
  const activePart = drop.parts[0];
  const primaryMedia = activePart?.media[0];
  const isMarketplaceImageOnlyCard = useMemo(() => {
    if (mode !== "content_only" || !!primaryMedia) {
      return false;
    }

    const standaloneUrl = getStandaloneHttpUrl(activePart?.content);
    if (!standaloneUrl) {
      return false;
    }

    return isMarketplaceLink(standaloneUrl);
  }, [activePart?.content, mode, primaryMedia]);
  const cardClassName = (() => {
    if (isCompactMode) {
      return "tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-transition desktop-hover:hover:tw-border-iron-700 tw-h-[26rem]";
    }

    if (isMarketplaceImageOnlyCard) {
      return "tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-0 tw-transition desktop-hover:hover:tw-border-iron-700";
    }

    return "tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-2 tw-transition desktop-hover:hover:tw-border-iron-700";
  })();
  const viewportClassName = isCompactMode
    ? "tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/50 tw-p-3 tw-h-[15rem]"
    : "tw-relative tw-overflow-hidden tw-max-h-[20rem]";
  const contentSpacingClass = isCompactMode ? "tw-space-y-3" : "tw-space-y-1";
  const mediaWrapperClass = isCompactMode
    ? "tw-overflow-hidden tw-rounded-lg tw-bg-iron-900"
    : "tw-overflow-hidden";
  const isMobileScreen = useIsMobileScreen();
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const { canShowVote } = useDropInteractionRules(drop);
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const [innerEl, setInnerEl] = useState<HTMLDivElement | null>(null);

  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );

  const mediaUrl = primaryMedia?.url ?? previewImageUrl ?? null;
  const mediaMimeType = primaryMedia?.mime_type ?? "image/jpeg";

  const getOverflowSnapshot = useCallback(() => {
    if (!viewportEl || !innerEl) {
      return false;
    }

    return innerEl.scrollHeight > viewportEl.clientHeight + 1;
  }, [innerEl, viewportEl]);

  const subscribeToOverflow = useCallback(
    (onStoreChange: () => void) => {
      if (!viewportEl || !innerEl) {
        return () => {};
      }

      if (typeof ResizeObserver === "undefined") {
        window.addEventListener("resize", onStoreChange);
        return () => {
          window.removeEventListener("resize", onStoreChange);
        };
      }

      const observer = new ResizeObserver(() => {
        onStoreChange();
      });
      observer.observe(viewportEl);
      observer.observe(innerEl);

      return () => {
        observer.disconnect();
      };
    },
    [innerEl, viewportEl]
  );

  const showGradient = useSyncExternalStore(
    subscribeToOverflow,
    getOverflowSnapshot,
    () => false
  );

  const hasUserVoted = drop.context_profile_context?.rating !== undefined;
  const userVote = drop.context_profile_context?.rating ?? 0;
  const isNegativeVote = userVote < 0;
  const isZeroVote = userVote === 0;
  const voteStyle = isZeroVote
    ? "tw-text-iron-400"
    : isNegativeVote
      ? "tw-text-iron-400"
      : "tw-text-iron-300";
  const votingCreditType = drop.wave.voting_credit_type;
  const votingCreditLabel =
    WAVE_VOTING_LABELS[votingCreditType] ?? votingCreditType;

  const handleVoteButtonClick = () => {
    setIsVotingModalOpen(true);
  };

  const openDrop = () => {
    startDropOpen({
      dropId: drop.id,
      waveId: drop.wave.id,
      source: "leaderboard_grid",
      isMobile: isMobileScreen,
    });
    onDropClick(drop);
  };

  const onCardClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) {
      return;
    }
    openDrop();
  };

  const onCardKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDrop();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`wave-leaderboard-grid-item-${drop.id}`}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      className={cardClassName}
    >
      <div ref={setViewportEl} className={viewportClassName}>
        <div ref={setInnerEl} className={contentSpacingClass}>
          {mediaUrl && (
            <div className={mediaWrapperClass}>
              <MediaDisplay
                media_mime_type={mediaMimeType}
                media_url={mediaUrl}
                disableMediaInteraction={true}
                imageScale={ImageScale.AUTOx450}
                previewImageUrl={previewImageUrl}
              />
            </div>
          )}
          {activePart && (
            <WaveDropPartContentMarkdown
              mentionedUsers={drop.mentioned_users}
              mentionedWaves={drop.mentioned_waves}
              referencedNfts={drop.referenced_nfts}
              part={activePart}
              wave={drop.wave}
              onQuoteClick={() => {}}
              marketplaceImageOnly={mode === "content_only"}
            />
          )}
        </div>
        {showGradient && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-14 tw-bg-gradient-to-t tw-from-iron-900 tw-via-iron-900/90 tw-to-transparent" />
        )}
      </div>

      {isCompactMode && (
        <div
          data-testid={`wave-leaderboard-grid-item-footer-${drop.id}`}
          className="tw-mt-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3"
        >
          <div className="tw-mb-3 tw-flex tw-items-start tw-justify-between">
            <div className="tw-mr-2 tw-min-w-0 tw-flex-1">
              {drop.title && (
                <h3 className="tw-mb-0 tw-truncate tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-200">
                  {drop.title}
                </h3>
              )}
              {drop.author?.handle && (
                <UserProfileTooltipWrapper
                  user={drop.author.handle ?? drop.author.id}
                >
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/${drop.author?.handle}`}
                    className="tw-mt-0.5 tw-text-xs tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-150 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-underline"
                  >
                    {drop.author?.handle}
                  </Link>
                </UserProfileTooltipWrapper>
              )}
            </div>
            {drop.rank !== undefined ? (
              <WinnerDropBadge
                rank={drop.rank}
                decisionTime={drop.winning_context?.decision_time ?? null}
              />
            ) : (
              <div className="tw-flex tw-h-6 tw-min-w-6 tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-800 tw-px-2 tw-text-xs tw-font-semibold tw-text-iron-400">
                -
              </div>
            )}
          </div>
          <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-text-xs">
            <WaveLeaderboardGalleryItemVotes drop={drop} variant="subtle" />
            <div className="tw-ml-4 tw-flex tw-items-center tw-gap-1 tw-text-iron-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                className="tw-size-3 tw-flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
              <span className="tw-font-medium">
                {formatNumberWithCommas(drop.raters_count)}
              </span>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-2">
            {hasUserVoted && (
              <span className="tw-font-mono tw-text-[11px] tw-text-iron-500">
                {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
                <span className={voteStyle}>
                  {isNegativeVote && "-"}
                  {formatNumberWithCommas(Math.abs(userVote))}{" "}
                  {votingCreditLabel}
                </span>
              </span>
            )}
            {canShowVote && (
              <div className="tw-flex tw-flex-1 tw-justify-end">
                <VotingModalButton
                  drop={drop}
                  onClick={handleVoteButtonClick}
                  variant="subtle"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {isCompactMode &&
        (isMobileScreen ? (
          <MobileVotingModal
            drop={drop}
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
          />
        ) : (
          <VotingModal
            drop={drop}
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
          />
        ))}
    </div>
  );
};
