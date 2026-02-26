"use client";

import Link from "next/link";
import React, {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import DropCurationButton from "@/components/waves/drops/DropCurationButton";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import WaveDropPartContentMarkdown from "@/components/waves/drops/WaveDropPartContentMarkdown";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useDropCurationMutation } from "@/hooks/drops/useDropCurationMutation";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";

import WaveLeaderboardGalleryItemVotes from "../gallery/WaveLeaderboardGalleryItemVotes";

import type { WaveLeaderboardGridMode } from "./WaveLeaderboardGrid";

interface WaveLeaderboardGridItemProps {
  readonly drop: ExtendedDrop;
  readonly mode: WaveLeaderboardGridMode;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardGridItem: React.FC<
  WaveLeaderboardGridItemProps
> = ({ drop, mode, onDropClick }) => {
  const isCompactMode = mode === "compact";
  const isContentOnlyMode = mode === "content_only";
  const activePart = drop.parts[0];
  const author = drop.author;
  const authorHandle = author.handle ?? null;
  const primaryMedia = activePart?.media[0];
  const isCuratable = drop.context_profile_context?.curatable ?? false;
  const isCurated = drop.context_profile_context?.curated ?? false;
  const canOpenDrop = drop.drop_type !== ApiDropType.Chat;

  const cardClassName =
    "tw-cursor-pointer tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-0 tw-transition desktop-hover:hover:tw-border-iron-700";
  const viewportClassName = isCompactMode
    ? "tw-relative tw-overflow-hidden tw-bg-iron-950"
    : "tw-relative tw-overflow-hidden tw-max-h-[20rem] tw-bg-iron-950";
  const contentSpacingClass = isCompactMode ? "tw-space-y-3" : "tw-space-y-1";
  const mediaWrapperClass = isCompactMode
    ? "tw-overflow-hidden tw-rounded-lg tw-bg-iron-900"
    : "tw-overflow-hidden tw-bg-iron-950";
  const isMobileScreen = useIsMobileScreen();
  const { hasTouchScreen } = useDeviceInfo();
  const { toggleCuration, isPending: isCurating } = useDropCurationMutation();
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
    preventDefault: false,
  });
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const { canShowVote } = useDropInteractionRules(drop);
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const [innerEl, setInnerEl] = useState<HTMLDivElement | null>(null);
  const hasContentOnlyActions = canOpenDrop || isCuratable || canShowVote;
  const showDesktopContentOnlyActions =
    isContentOnlyMode && !hasTouchScreen && hasContentOnlyActions;
  const showMobileContentOnlyActions =
    isContentOnlyMode && hasTouchScreen && hasContentOnlyActions;

  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );

  const mediaUrl = primaryMedia?.url ?? previewImageUrl ?? null;
  const mediaMimeType = primaryMedia?.mime_type ?? "image/jpeg";
  const shouldPadContentOnlyText = isContentOnlyMode && Boolean(mediaUrl);

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
  let voteStyle = "tw-text-iron-300";
  if (isZeroVote || isNegativeVote) {
    voteStyle = "tw-text-iron-400";
  }
  const votingCreditType = drop.wave.voting_credit_type;
  const votingCreditLabels = WAVE_VOTING_LABELS as Partial<
    Record<typeof votingCreditType, string>
  >;
  const votingCreditLabel =
    votingCreditLabels[votingCreditType] ?? votingCreditType;

  const handleVoteButtonClick = () => {
    setIsVotingModalOpen(true);
  };

  const handleMobileCurateClick = useCallback(() => {
    if (!isCuratable || drop.id.startsWith("temp-")) {
      return;
    }

    toggleCuration({
      dropId: drop.id,
      waveId: drop.wave.id,
      isCuratable,
      isCurated,
    });
    setIsActive(false);
  }, [
    drop.id,
    drop.wave.id,
    isCuratable,
    isCurated,
    setIsActive,
    toggleCuration,
  ]);

  const handleMobileVoteClick = useCallback(() => {
    setIsActive(false);
    setIsVotingModalOpen(true);
  }, [setIsActive]);

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
    if (showMobileContentOnlyActions && isActive) {
      return;
    }
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
      className={`${cardClassName} tw-group`}
      {...(showMobileContentOnlyActions ? touchHandlers : {})}
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
          {activePart &&
            (shouldPadContentOnlyText ? (
              <div className="tw-p-2">
                <LinkPreviewProvider variant="home">
                  <WaveDropPartContentMarkdown
                    mentionedUsers={drop.mentioned_users}
                    mentionedWaves={drop.mentioned_waves}
                    referencedNfts={drop.referenced_nfts}
                    part={activePart}
                    wave={drop.wave}
                    drop={drop}
                    onQuoteClick={() => {}}
                  />
                </LinkPreviewProvider>
              </div>
            ) : (
              <LinkPreviewProvider variant="home">
                <WaveDropPartContentMarkdown
                  mentionedUsers={drop.mentioned_users}
                  mentionedWaves={drop.mentioned_waves}
                  referencedNfts={drop.referenced_nfts}
                  part={activePart}
                  wave={drop.wave}
                  drop={drop}
                  onQuoteClick={() => {}}
                />
              </LinkPreviewProvider>
            ))}
        </div>
        {showGradient && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-14 tw-bg-gradient-to-t tw-from-iron-900 tw-via-iron-900/90 tw-to-transparent" />
        )}
        {showDesktopContentOnlyActions && (
          <div
            data-testid={`wave-leaderboard-grid-item-content-only-actions-${drop.id}`}
            className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-0 tw-bg-gradient-to-t tw-from-black/90 tw-via-black/65 tw-to-transparent tw-p-2 tw-opacity-0 tw-transition-opacity tw-duration-200 group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100"
          >
            <div className="tw-pointer-events-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
              {canOpenDrop && (
                <div className="tw-flex tw-h-8 tw-items-center">
                  <WaveDropActionsOpen drop={drop} />
                </div>
              )}
              {isCuratable && (
                <DropCurationButton
                  dropId={drop.id}
                  waveId={drop.wave.id}
                  isCuratable={isCuratable}
                  isCurated={isCurated}
                  className="tw-bg-iron-950/70"
                />
              )}
              {canShowVote && (
                <VotingModalButton
                  drop={drop}
                  onClick={handleVoteButtonClick}
                  variant="subtle"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {isCompactMode && (
        <div
          data-testid={`wave-leaderboard-grid-item-footer-${drop.id}`}
          className="tw-rounded-b-lg tw-bg-iron-950/50 tw-px-3 tw-pb-3 tw-pt-2"
        >
          <div className="tw-mb-1.5">
            {drop.title && (
              <h3 className="tw-mb-0 tw-truncate tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-200">
                {drop.title}
              </h3>
            )}
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-mr-2 tw-min-w-0 tw-flex-1">
                {authorHandle && (
                  <UserProfileTooltipWrapper user={authorHandle}>
                    <Link
                      onClick={(e) => e.stopPropagation()}
                      href={`/${authorHandle}`}
                      className="tw-text-xs tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-150 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-underline"
                    >
                      {authorHandle}
                    </Link>
                  </UserProfileTooltipWrapper>
                )}
              </div>
              {drop.rank !== null ? (
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
          <div className="tw-flex tw-items-center tw-justify-between tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-2">
            {hasUserVoted && (
              <span className="tw-font-mono tw-text-[11px] tw-text-iron-500">
                You:{" "}
                <span className={voteStyle}>
                  {isNegativeVote && "-"}
                  {formatNumberWithCommas(Math.abs(userVote))}{" "}
                  {votingCreditLabel}
                </span>
              </span>
            )}
            <div className="tw-ml-auto tw-flex tw-items-center tw-gap-1.5">
              <DropCurationButton
                dropId={drop.id}
                waveId={drop.wave.id}
                isCuratable={drop.context_profile_context?.curatable ?? false}
                isCurated={drop.context_profile_context?.curated ?? false}
              />
              {canShowVote && (
                <VotingModalButton
                  drop={drop}
                  onClick={handleVoteButtonClick}
                  variant="subtle"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {(isCompactMode || isContentOnlyMode) &&
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

      {showMobileContentOnlyActions &&
        createPortal(
          <CommonDropdownItemsMobileWrapper
            isOpen={isActive}
            setOpen={setIsActive}
          >
            <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
              {canOpenDrop && (
                <WaveDropMobileMenuOpen
                  drop={drop}
                  onOpenChange={() => setIsActive(false)}
                />
              )}

              {isCuratable && (
                <button
                  type="button"
                  onClick={handleMobileCurateClick}
                  disabled={isCurating || drop.id.startsWith("temp-")}
                  className={`tw-flex tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 ${
                    isCurating || drop.id.startsWith("temp-")
                      ? "tw-cursor-default tw-opacity-60"
                      : "active:tw-bg-iron-800"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 12H16M8 16H13M8.6 21H15.4C16.5201 21 17.0802 21 17.508 20.782C17.8843 20.5903 18.1903 20.2843 18.382 19.908C18.6 19.4802 18.6 18.9201 18.6 17.8V8.2C18.6 7.07989 18.6 6.51984 18.382 6.09202C18.1903 5.71569 17.8843 5.40973 17.508 5.21799C17.0802 5 16.5201 5 15.4 5H8.6C7.47989 5 6.91984 5 6.49202 5.21799C6.11569 5.40973 5.80973 5.71569 5.61799 6.09202C5.4 6.51984 5.4 7.07989 5.4 8.2V17.8C5.4 18.9201 5.4 19.4802 5.61799 19.908C5.80973 20.2843 6.11569 20.5903 6.49202 20.782C6.91984 21 7.47989 21 8.6 21ZM15.75 3V7.5M13.5 5.25H18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="tw-text-base tw-font-semibold tw-text-iron-300">
                    {isCurated ? "Uncurate drop" : "Curate drop"}
                  </span>
                </button>
              )}

              {canShowVote && (
                <button
                  type="button"
                  onClick={handleMobileVoteClick}
                  className="tw-flex tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2.75L14.8379 8.50092L21.1845 9.42395L16.5923 13.8991L17.6765 20.221L12 17.2379L6.32352 20.221L7.4077 13.8991L2.8155 9.42395L9.16215 8.50092L12 2.75Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="tw-text-base tw-font-semibold tw-text-iron-300">
                    Vote
                  </span>
                </button>
              )}
            </div>
          </CommonDropdownItemsMobileWrapper>,
          document.body
        )}
    </div>
  );
};
