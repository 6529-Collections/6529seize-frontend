"use client";

import { useAuth } from "@/components/auth/Auth";
import { useEmoji } from "@/contexts/EmojiContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import { formatLargeNumber } from "@/helpers/Helpers";
import { buildTooltipId } from "@/helpers/tooltip.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Tooltip } from "react-tooltip";
import {
  cloneReactionEntries,
  findReactionIndex,
  removeUserFromReactions,
  toProfileMin,
} from "./reaction-utils";
import styles from "./WaveDropReactions.module.scss";
import WaveDropReactionsDetailDialog from "./WaveDropReactionsDetailDialog";

interface WaveDropReactionsProps {
  readonly drop: ApiDrop;
}

const WaveDropReactions: React.FC<WaveDropReactionsProps> = ({ drop }) => {
  const [dialogReaction, setDialogReaction] = useState<string | null>(null);
  const isTouchDevice = useIsTouchDevice();

  const handleOpenDialog = useCallback((reactionKey: string) => {
    setDialogReaction(reactionKey);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogReaction(null);
  }, []);

  return (
    <>
      {drop.reactions.map((reaction) => (
        <WaveDropReaction
          key={`${reaction.reaction}-${reaction.profiles.length}`}
          drop={drop}
          reaction={reaction}
          onOpenDetailDialog={handleOpenDialog}
          isTouchDevice={isTouchDevice}
        />
      ))}
      <WaveDropReactionsDetailDialog
        isOpen={dialogReaction !== null}
        onClose={handleCloseDialog}
        reactions={drop.reactions}
        initialReaction={dialogReaction ?? undefined}
      />
    </>
  );
};

function WaveDropReaction({
  drop,
  reaction,
  onOpenDetailDialog,
  isTouchDevice,
}: {
  readonly drop: ApiDrop;
  readonly reaction: ApiDropReaction;
  readonly onOpenDetailDialog: (reactionKey: string) => void;
  readonly isTouchDevice: boolean;
}) {
  const { setToast, connectedProfile } = useAuth();
  const { emojiMap, findNativeEmoji } = useEmoji();
  const { applyOptimisticDropUpdate } = useMyStream();
  const rollbackRef = useRef<(() => void) | null>(null);

  const handleLongPressStart = useCallback(() => {
    onOpenDetailDialog(reaction.reaction);
  }, [onOpenDetailDialog, reaction.reaction]);

  const { longPressTriggered, touchHandlers } = useLongPressInteraction({
    hasTouchScreen: isTouchDevice,
    onInteractionStart: handleLongPressStart,
    longPressDuration: 400,
  });

  const wrappedTouchHandlers = useMemo(
    () => ({
      onTouchStart: (e: React.TouchEvent) => {
        e.stopPropagation();
        touchHandlers.onTouchStart(e);
      },
      onTouchMove: (e: React.TouchEvent) => {
        e.stopPropagation();
        touchHandlers.onTouchMove(e);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.stopPropagation();
        touchHandlers.onTouchEnd();
      },
      onTouchCancel: (e: React.TouchEvent) => {
        e.stopPropagation();
        touchHandlers.onTouchCancel();
      },
    }),
    [touchHandlers]
  );

  const [total, setTotal] = useState(reaction.profiles.length);
  const [selected, setSelected] = useState(
    reaction.reaction === drop.context_profile_context?.reaction
  );
  const [animate, setAnimate] = useState(false);

  // Refs to track previous values for change detection
  const prevTotalRef = useRef(total);
  const prevContextReactionRef = useRef(drop.context_profile_context?.reaction);
  const prevProfilesRef = useRef(reaction.profiles);

  // Sync selected when context reaction changes from server
  useEffect(() => {
    if (
      drop.context_profile_context?.reaction === prevContextReactionRef.current
    ) {
      return;
    }

    prevContextReactionRef.current = drop.context_profile_context?.reaction;
    const isSelected =
      reaction.reaction === drop.context_profile_context?.reaction;
    const timeoutId = setTimeout(() => {
      setSelected((current) => (current === isSelected ? current : isSelected));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [drop.context_profile_context?.reaction, reaction.reaction]);

  useEffect(() => {
    if (reaction.profiles === prevProfilesRef.current) {
      return;
    }
    prevProfilesRef.current = reaction.profiles;

    const nextTotal = reaction.profiles.length;

    const timeoutId = setTimeout(() => {
      setTotal((current) => (current === nextTotal ? current : nextTotal));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [reaction.profiles]);

  // Trigger animation when total changes
  useEffect(() => {
    if (total === prevTotalRef.current) {
      return;
    }
    prevTotalRef.current = total;
    // Defer to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => setAnimate(true), 0);
    return () => clearTimeout(timeoutId);
  }, [total]);

  useEffect(() => {
    if (!animate) return;
    const timeout = setTimeout(() => setAnimate(false), 100);
    return () => clearTimeout(timeout);
  }, [animate]);

  // derive emoji ID
  const emojiId = useMemo(
    () => reaction.reaction.replaceAll(":", ""),
    [reaction.reaction]
  );
  const tooltipId = useMemo(
    () => buildTooltipId("reaction", drop.id, emojiId),
    [drop.id, emojiId]
  );

  // small + tooltip emoji nodes
  const waveId = drop.wave.id;

  const { emojiNode, emojiNodeTooltip } = useMemo(() => {
    const custom = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === emojiId);

    const customSrc = custom?.skins[0]?.src;
    if (customSrc) {
      return {
        emojiNode: (
          <div className="tw-relative tw-size-4">
            <Image
              src={customSrc}
              alt={emojiId}
              fill
              className="tw-object-contain"
            />
          </div>
        ),
        emojiNodeTooltip: (
          <div className="tw-relative tw-size-8">
            <Image
              src={customSrc}
              alt={emojiId}
              fill
              className="tw-rounded-sm tw-object-contain"
            />
          </div>
        ),
      };
    }

    const native = findNativeEmoji(emojiId);
    if (native) {
      return {
        emojiNode: (
          <span className="tw-flex tw-items-center tw-justify-center tw-text-[1rem]">
            {native.skins[0]?.native}
          </span>
        ),
        emojiNodeTooltip: (
          <span className="tw-flex tw-items-center tw-justify-center tw-text-2xl">
            {native.skins[0]?.native}
          </span>
        ),
      };
    }

    return { emojiNode: null, emojiNodeTooltip: null };
  }, [emojiId, emojiMap, findNativeEmoji]);

  const applyOptimisticReactionChange = useCallback(
    (willSelect: boolean) => {
      if (!waveId) {
        return;
      }

      const userProfileMin = toProfileMin(connectedProfile);

      rollbackRef.current =
        applyOptimisticDropUpdate({
          waveId,
          dropId: drop.id,
          update: (draft) => {
            if (draft.type !== DropSize.FULL) {
              return draft;
            }

            const reactions = cloneReactionEntries(draft.reactions);
            const userId = connectedProfile?.id ?? null;
            const reactionsWithoutUser = removeUserFromReactions(
              reactions,
              userId
            );

            if (willSelect && userProfileMin) {
              const existingIndex = findReactionIndex(
                reactionsWithoutUser,
                reaction.reaction
              );

              if (existingIndex >= 0) {
                const target = reactionsWithoutUser[existingIndex]!;
                reactionsWithoutUser[existingIndex] = {
                  ...target,
                  profiles: [...target.profiles, userProfileMin],
                };
              } else {
                reactionsWithoutUser.push({
                  reaction: reaction.reaction,
                  profiles: [userProfileMin],
                });
              }
            }

            draft.reactions = reactionsWithoutUser;
            const existingContext: ApiDropContextProfileContext =
              draft.context_profile_context ??
                drop.context_profile_context ?? {
                  rating: 0,
                  min_rating: 0,
                  max_rating: 0,
                  reaction: null,
                  boosted: false,
                };

            draft.context_profile_context = {
              ...existingContext,
              reaction: willSelect ? reaction.reaction : null,
            };

            return draft;
          },
        })?.rollback ?? null;
    },
    [
      applyOptimisticDropUpdate,
      connectedProfile,
      drop.id,
      waveId,
      drop.context_profile_context,
      reaction.reaction,
    ]
  );

  const handleClick = useCallback(async () => {
    if (longPressTriggered) {
      return;
    }

    setSelected((s) => !s);
    setTotal((n) => Math.max(0, n + (selected ? -1 : 1)));

    applyOptimisticReactionChange(!selected);

    try {
      const body = { reaction: reaction.reaction };
      const endpoint = `drops/${drop.id}/reaction`;
      if (selected) {
        await commonApiDelete({
          endpoint,
        });
      } else {
        await commonApiPost<ApiAddReactionToDropRequest, ApiDrop>({
          endpoint,
          body,
        });
      }
    } catch (error) {
      let msg = selected ? "Error removing reaction" : "Error adding reaction";
      if (typeof error === "string") msg = error;
      setToast({ message: msg, type: "error" });

      setSelected((s) => !s);
      setTotal((n) => Math.max(0, n + (selected ? 1 : -1)));
      rollbackRef.current?.();
      rollbackRef.current = null;
    }
    rollbackRef.current = null;
  }, [
    applyOptimisticReactionChange,
    drop.id,
    longPressTriggered,
    reaction.reaction,
    selected,
    setToast,
  ]);

  const tooltipProfiles = useMemo(() => {
    const displayProfiles = reaction.profiles.slice(0, 3);
    const moreCount = total > 3 ? total - 3 : 0;
    return { displayProfiles, moreCount };
  }, [reaction.profiles, total]);

  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenDetailDialog(reaction.reaction);
    },
    [onOpenDetailDialog, reaction.reaction]
  );

  // styles
  const borderStyle = selected ? "tw-border-primary-500" : "tw-border-iron-700";
  const bgStyle = selected ? "tw-bg-primary-500/10" : "tw-bg-iron-900/40";
  const hoverStyle = selected
    ? "hover:tw-border-primary-500 hover:tw-bg-primary-500/10"
    : "hover:tw-border-iron-500 hover:tw-bg-iron-900/40";
  let animationStyle = "";
  if (animate) {
    if (selected) {
      animationStyle = styles["reactionSlideUp"]!;
    } else {
      animationStyle = styles["reactionSlideDown"]!;
    }
  }

  if (!emojiNode || total === 0) return null;
  return (
    <>
      <button
        onClick={handleClick}
        {...(!isTouchDevice && { "data-tooltip-id": tooltipId })}
        data-text-selection-exclude="true"
        className={clsx(
          "tw-mt-1 tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-py-1 tw-shadow-sm hover:tw-text-iron-100",
          borderStyle,
          bgStyle,
          hoverStyle
        )}
        {...wrappedTouchHandlers}
      >
        <div className="tw-flex tw-h-full tw-items-center tw-gap-x-1">
          <div className="tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center">
            {emojiNode}
          </div>
          <span
            className={clsx(
              "tw-min-w-[2ch] tw-text-xs tw-font-normal",
              animationStyle
            )}
          >
            {formatLargeNumber(total)}
          </span>
        </div>
      </button>
      {!isTouchDevice && (
        <Tooltip
          id={tooltipId}
          delayShow={250}
          place="bottom"
          opacity={1}
          clickable
          style={{ backgroundColor: "#37373E", color: "white", zIndex: 50 }}
        >
          <div className="tw-flex tw-items-center tw-gap-2">
            {emojiNodeTooltip}
            <span className="tw-whitespace-nowrap">
              by{" "}
              {tooltipProfiles.displayProfiles.map((profile, index) => {
                const displayName = profile.handle ?? profile.id;
                const isLast =
                  index === tooltipProfiles.displayProfiles.length - 1;
                const showComma = !isLast;

                return (
                  <span key={profile.id}>
                    {profile.handle ? (
                      <Link
                        href={`/${profile.handle}`}
                        className="tw-text-primary-400 tw-no-underline hover:tw-text-primary-300 hover:tw-underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <span>{displayName}</span>
                    )}
                    {showComma && ", "}
                  </span>
                );
              })}
              {tooltipProfiles.moreCount > 0 && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={handleMoreClick}
                    className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-primary-400 tw-underline hover:tw-text-primary-300"
                  >
                    and {tooltipProfiles.moreCount}{" "}
                    {tooltipProfiles.moreCount === 1 ? "other" : "others"}
                  </button>
                </>
              )}
            </span>
          </div>
        </Tooltip>
      )}
    </>
  );
}

export default WaveDropReactions;
