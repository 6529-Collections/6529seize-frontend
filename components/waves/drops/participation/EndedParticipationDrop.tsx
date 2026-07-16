"use client";

import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getTimeAgoShort } from "@/helpers/Helpers";
import type { ImageScale } from "@/helpers/image.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DropMinimalIdentityRow from "../DropMinimalIdentityRow";
import { DropAuthorBadges } from "../DropAuthorBadges";
import WaveDropActions from "../WaveDropActions";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import WaveDropContent from "../WaveDropContent";
import WaveDropMetadata from "../WaveDropMetadata";
import {
  useWaveDropMobileMenu,
  withWaveDropMobileMenuProvider,
} from "../WaveDropMobileMenuContext";
import { useWaveDropMobileMenuController } from "../useWaveDropMobileMenuController";
import WaveDropReactions from "../WaveDropReactions";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropTimestampLayout,
} from "../drop.types";
import { DropLocation, hasDropFooter } from "../drop.types";
import type { DropContentPresentation } from "../dropContentPresentation";
import ParticipationIdentityProfileCard from "./ParticipationIdentityProfileCard";
import {
  getParticipationIdentityProfile,
  getParticipationVisibleMetadata,
} from "./participationIdentityProfile.helpers";

interface EndedParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly footer?: React.ReactNode;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly timestampLayout?: DropTimestampLayout | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly inlineAuthorOnDesktop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

function EndedParticipationDropInner({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuoteClick,
  onDropContentClick,
  footer,
  identityMode = "default",
  timestampLayout = "inline",
  showInteractions = true,
  inlineAuthorOnDesktop = false,
  mediaImageScale,
  fullWidthMedia = false,
  fullWidthLinkPreviews = false,
  contentPresentation = "default",
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}: EndedParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const router = useRouter();
  const identityProfile = getParticipationIdentityProfile({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const visibleMetadata = getParticipationVisibleMetadata({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const isSelfNominee = identityProfile
    ? areSameProfileIdentity({
        left: drop.author,
        right: identityProfile,
      })
    : false;

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const { canUseDesktopHoverActions, canUseTouchActionSheet } =
    useDropActionInteractionMode();
  const mobileMenu = useWaveDropMobileMenu();
  const showIdentity = identityMode !== "hidden";
  const isStackedTimestamp = timestampLayout === "stacked";
  const shouldOffsetRows = showIdentity && !inlineAuthorOnDesktop;

  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(path);
  };

  const handleLongPress = useCallback(() => {
    if (!showInteractions || !canUseTouchActionSheet) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [canUseTouchActionSheet, showInteractions]);

  const handleMobileMenuOpenChange = useCallback((open: boolean) => {
    setIsSlideUp(open);
    if (!open) {
      setLongPressTriggered(false);
    }
  }, []);

  useEffect(() => {
    if (canUseTouchActionSheet) {
      return;
    }

    mobileMenu?.close();
  }, [canUseTouchActionSheet, mobileMenu]);

  const handleOnReply = useCallback(() => {
    mobileMenu?.close();
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]?.part_id! });
  }, [onReply, drop, activePartIndex, mobileMenu]);

  const handleOnAddReaction = useCallback(() => {
    mobileMenu?.close();
    setIsSlideUp(false);
  }, [mobileMenu]);

  const getDropLocationBackground = () => {
    return "tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800";
  };

  const dropBackgroundClass = isActiveDrop
    ? "tw-bg-[#3CCB7F]/10"
    : getDropLocationBackground();
  const identityHeader =
    identityMode === "minimal" ? (
      <DropMinimalIdentityRow drop={drop} timestampLayout={timestampLayout} />
    ) : (
      <div className="tw-flex tw-flex-col tw-gap-y-2">
        <div
          className={
            isStackedTimestamp
              ? "tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-y-1"
              : "tw-flex tw-items-center tw-gap-x-2"
          }
        >
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            <p className="tw-m-0 tw-inline-flex tw-h-5 tw-items-center tw-text-md tw-font-semibold tw-leading-5">
              <Link
                onClick={(e) =>
                  handleNavigation(
                    e,
                    `/${drop.author.handle ?? drop.author.primary_address}`
                  )
                }
                href={`/${drop.author.handle ?? drop.author.primary_address}`}
                className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
              >
                {drop.author.handle ?? drop.author.primary_address}
              </Link>
            </p>

            <UserCICAndLevel
              level={drop.author.level}
              size={UserCICAndLevelSize.SMALL}
            />

            <DropAuthorBadges
              profile={drop.author}
              wave={drop.wave}
              tooltipIdPrefix={`ended-participation-author-badges-${drop.id}`}
            />

            {!isStackedTimestamp && (
              <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700"></div>
            )}

            {!isStackedTimestamp && (
              <p className="tw-mb-0 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-leading-none tw-text-iron-500">
                {getTimeAgoShort(drop.created_at)}
              </p>
            )}
          </div>
          {isStackedTimestamp && (
            <p className="tw-mb-0 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-leading-none tw-text-iron-500">
              {getTimeAgoShort(drop.created_at)}
            </p>
          )}
        </div>
        <div className="tw-flex tw-w-fit tw-items-center tw-whitespace-nowrap tw-rounded-md tw-border tw-border-solid tw-border-iron-500/25 tw-bg-iron-600/10 tw-px-2 tw-py-0.5 tw-font-medium tw-text-iron-500">
          <span className="tw-text-xs">Participant</span>
        </div>
      </div>
    );
  const content = (
    <WaveDropContent
      drop={drop}
      activePartIndex={activePartIndex}
      setActivePartIndex={setActivePartIndex}
      onLongPress={handleLongPress}
      onDropContentClick={onDropContentClick}
      onQuoteClick={onQuoteClick}
      setLongPressTriggered={setLongPressTriggered}
      isCompetitionDrop={true}
      mediaImageScale={mediaImageScale}
      mediaContainerHeightClassName="tw-h-96"
      fullWidthMedia={fullWidthMedia}
      fullWidthLinkPreviews={fullWidthLinkPreviews}
      hasTouch={showInteractions && canUseTouchActionSheet}
      contentPresentation={contentPresentation}
      embedPath={embedPath}
      quotePath={quotePath}
      embedDepth={embedDepth}
      maxEmbedDepth={maxEmbedDepth}
    />
  );
  const effectiveIsSlideUp = isSlideUp && canUseTouchActionSheet;

  useWaveDropMobileMenuController({
    drop,
    enabled: showInteractions,
    isOpen: effectiveIsSlideUp,
    longPressTriggered,
    showReplyAndQuote,
    onOpenChange: handleMobileMenuOpenChange,
    onReply: handleOnReply,
    onAddReaction: handleOnAddReaction,
  });

  return (
    <div
      className={`${
        location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
      } tw-w-full`}
    >
      <div className="tw-group tw-relative tw-w-full">
        {canUseDesktopHoverActions && showInteractions && showReplyAndQuote && (
          <WaveDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            showVoting={false}
            onReply={handleOnReply}
          />
        )}

        <div
          className={`tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-px-4 tw-py-3 tw-transition-colors tw-duration-200 tw-ease-linear ${dropBackgroundClass}`}
        >
          <div
            className={`tw-flex tw-w-full tw-border-0 tw-bg-transparent tw-text-left ${
              inlineAuthorOnDesktop ? "tw-flex-col tw-gap-y-2" : "tw-gap-x-3"
            }`}
          >
            {inlineAuthorOnDesktop
              ? showIdentity && (
                  <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2">
                    <WaveDropAuthorPfp drop={drop} />
                    <div className="tw-min-w-0 tw-flex-1">{identityHeader}</div>
                  </div>
                )
              : showIdentity && <WaveDropAuthorPfp drop={drop} />}

            <div className="tw-flex tw-w-full tw-flex-col tw-gap-y-2">
              {showIdentity && !inlineAuthorOnDesktop && identityHeader}
              {identityMode === "default" &&
                showWaveInfo &&
                (() => {
                  const waveMeta = (
                    drop.wave as unknown as {
                      chat?:
                        | {
                            scope?:
                              | {
                                  group?:
                                    | {
                                        is_direct_message?: boolean | undefined;
                                      }
                                    | undefined;
                                }
                              | undefined;
                          }
                        | undefined;
                    }
                  ).chat;
                  const isDirectMessage =
                    waveMeta?.scope?.group?.is_direct_message ?? false;
                  const waveHref = getWaveRoute({
                    waveId: drop.wave.id,
                    isDirectMessage,
                    isApp: false,
                  });
                  return (
                    <Link
                      href={waveHref}
                      onClick={(e) => handleNavigation(e, waveHref)}
                      className="tw-leading-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
                    >
                      {drop.wave.name}
                    </Link>
                  );
                })()}

              {content}
            </div>
          </div>

          {identityProfile && (
            <div className={shouldOffsetRows ? "tw-ml-[3.25rem]" : ""}>
              <ParticipationIdentityProfileCard
                profile={identityProfile}
                contextId={drop.id}
                variant="chat"
                showIdentityHeader={!isSelfNominee}
              />
            </div>
          )}

          {visibleMetadata.length > 0 && (
            <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
              <WaveDropMetadata metadata={visibleMetadata} />
            </div>
          )}
          {showInteractions && (
            <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
              <WaveDropReactions drop={drop} />
            </div>
          )}
          {hasDropFooter(footer) && (
            <div
              className={`${shouldOffsetRows ? "tw-ml-[3.25rem]" : ""} tw-pb-1 tw-pt-2`}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withWaveDropMobileMenuProvider(EndedParticipationDropInner);
