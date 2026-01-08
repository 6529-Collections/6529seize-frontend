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
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import clsx from "clsx";
import Image from "next/image";
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

interface WaveDropReactionsProps {
  readonly drop: ApiDrop;
}

const WaveDropReactions: React.FC<WaveDropReactionsProps> = ({ drop }) => {
  return (
    <>
      {drop.reactions.map((reaction) => (
        <WaveDropReaction
          key={`${reaction.reaction}-${reaction.profiles.length}`}
          drop={drop}
          reaction={reaction}
        />
      ))}
    </>
  );
};

function WaveDropReaction({
  drop,
  reaction,
}: {
  readonly drop: ApiDrop;
  readonly reaction: ApiDropReaction;
}) {
  const { setToast, connectedProfile } = useAuth();
  const { emojiMap, findNativeEmoji } = useEmoji();
  const { applyOptimisticDropUpdate } = useMyStream();
  const rollbackRef = useRef<(() => void) | null>(null);

  const [total, setTotal] = useState(reaction.profiles.length);
  const [selected, setSelected] = useState(
    reaction.reaction === drop.context_profile_context?.reaction
  );
  const [handles, setHandles] = useState(
    reaction.profiles.map((p) => p.handle ?? p.id)
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

  // Sync total and handles when profiles change from server
  useEffect(() => {
    if (reaction.profiles === prevProfilesRef.current) {
      return;
    }
    prevProfilesRef.current = reaction.profiles;

    const nextTotal = reaction.profiles.length;
    const nextHandles = reaction.profiles.map((p) => p.handle ?? p.id);

    const timeoutId = setTimeout(() => {
      setTotal((current) => (current === nextTotal ? current : nextTotal));
      setHandles((current) => {
        const sameLength = current.length === nextHandles.length;
        const sameValues = sameLength
          ? current.every((value, index) => value === nextHandles[index])
          : false;
        return sameValues ? current : nextHandles;
      });
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
    const resolvedHandle =
      connectedProfile?.handle ?? connectedProfile?.id ?? "";

    // optimistic update
    setSelected((s) => !s);
    setTotal((n) => Math.max(0, n + (selected ? -1 : 1)));
    if (selected) {
      setHandles((h) =>
        resolvedHandle ? h.filter((value) => value !== resolvedHandle) : h
      );
    } else {
      setHandles((h) => {
        if (!resolvedHandle) {
          return h;
        }
        const nextHandles = [...h, resolvedHandle];
        return Array.from(new Set(nextHandles));
      });
    }

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

      // optimistic revert
      setSelected((s) => !s);
      setTotal((n) => Math.max(0, n + (selected ? 1 : -1)));
      if (selected) {
        setHandles((h) =>
          resolvedHandle ? Array.from(new Set([...h, resolvedHandle])) : h
        );
      } else {
        setHandles((h) =>
          resolvedHandle ? h.filter((value) => value !== resolvedHandle) : h
        );
      }
      rollbackRef.current?.();
      rollbackRef.current = null;
    }
    rollbackRef.current = null;
  }, [
    applyOptimisticReactionChange,
    connectedProfile?.handle,
    connectedProfile?.id,
    drop.id,
    reaction.reaction,
    selected,
    setToast,
  ]);

  // tooltip text
  const tooltipText = useMemo(() => {
    const limit = 12;
    const truncate = (handle: string) =>
      handle.length > limit ? handle.slice(0, limit) + "…" : handle;

    const truncatedHandles = handles.map(truncate);

    if (total <= 3) return truncatedHandles.join(", ");
    return `${truncatedHandles.slice(0, 3).join(", ")} and ${total - 3} more`;
  }, [handles, total]);

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
        data-tooltip-id={tooltipId}
        data-text-selection-exclude="true"
        className={clsx(
          "tw-mt-1 tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-py-1 tw-shadow-sm hover:tw-text-iron-100",
          borderStyle,
          bgStyle,
          hoverStyle
        )}
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
      <Tooltip
        id={tooltipId}
        delayShow={250}
        place="bottom"
        opacity={1}
        style={{ backgroundColor: "#37373E", color: "white", zIndex: 50 }}
      >
        <div className="tw-flex tw-items-center tw-gap-2">
          {emojiNodeTooltip}
          <span className="tw-whitespace-nowrap">by {tooltipText}</span>
        </div>
      </Tooltip>
    </>
  );
}

export default WaveDropReactions;
