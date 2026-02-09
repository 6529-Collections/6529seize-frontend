"use client";

import { useAuth } from "@/components/auth/Auth";
import { useEmoji } from "@/contexts/EmojiContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import {
  getReactionSnapshot,
  getReactionSnapshotServer,
  getTopReactions,
  recordReaction,
  subscribeToReactionStore,
} from "@/helpers/reactions/reactionHistory";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPost } from "@/services/api/common-api";
import Image from "next/image";
import React, {
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { Tooltip } from "react-tooltip";
import {
  cloneReactionEntries,
  findReactionIndex,
  removeUserFromReactions,
  toProfileMin,
} from "./reaction-utils";

const MAX_QUICK_REACTIONS = 3;

const WaveDropActionsQuickReact: React.FC<{
  readonly drop: ExtendedDrop;
  readonly isMobile?: boolean;
  readonly onReacted?: () => void;
}> = ({ drop, isMobile = false, onReacted }) => {
  const isTemporaryDrop = drop.id.startsWith("temp-");
  const canReact = !isTemporaryDrop;
  const { setToast, connectedProfile } = useAuth();
  const { applyOptimisticDropUpdate } = useMyStream();
  const rollbackRef = useRef<(() => void) | null>(null);

  const waveId = drop.wave.id;
  const dropId = drop.id;
  const contextProfileContext = drop.context_profile_context;

  // Subscribe to localStorage changes (hydration-safe)
  const reactionSnapshot = useSyncExternalStore(
    subscribeToReactionStore,
    getReactionSnapshot,
    getReactionSnapshotServer
  );

  // Derive top reactions; re-computes when the store changes
  const topReactionCodes = useMemo(
    () => getTopReactions(MAX_QUICK_REACTIONS),
    [reactionSnapshot]
  );

  const applyOptimisticReaction = useCallback(
    (reactionCode: string) => {
      const profileMin = toProfileMin(connectedProfile);
      if (!profileMin) {
        return null;
      }

      const userId = profileMin.id;

      const handle = applyOptimisticDropUpdate({
        waveId: waveId,
        dropId: dropId,
        update: (draft) => {
          if (draft.type !== DropSize.FULL) {
            return draft;
          }

          const reactions = cloneReactionEntries(draft.reactions);
          const reactionsWithoutUser = removeUserFromReactions(
            reactions,
            userId
          );

          const targetIndex = findReactionIndex(
            reactionsWithoutUser,
            reactionCode
          );

          if (targetIndex >= 0) {
            const profiles = reactionsWithoutUser[targetIndex]?.profiles ?? [];
            reactionsWithoutUser[targetIndex] = {
              ...reactionsWithoutUser[targetIndex]!,
              profiles: [...profiles, profileMin],
            };
          } else {
            reactionsWithoutUser.push({
              reaction: reactionCode,
              profiles: [profileMin],
            });
          }

          draft.reactions = reactionsWithoutUser;

          const baseContext: ApiDropContextProfileContext =
            draft.context_profile_context ??
              contextProfileContext ?? {
                rating: 0,
                min_rating: 0,
                max_rating: 0,
                reaction: null,
                boosted: false,
                bookmarked: false,
              };

          draft.context_profile_context = {
            ...baseContext,
            reaction: reactionCode,
          };

          return draft;
        },
      });

      return handle?.rollback ?? null;
    },
    [
      applyOptimisticDropUpdate,
      connectedProfile,
      contextProfileContext,
      dropId,
      waveId,
    ]
  );

  const handleReact = useCallback(
    async (reactionCode: string) => {
      if (!canReact) return;

      rollbackRef.current?.();
      rollbackRef.current = applyOptimisticReaction(reactionCode);
      recordReaction(reactionCode);

      try {
        await commonApiPost<ApiAddReactionToDropRequest, ApiDrop>({
          endpoint: `drops/${drop.id}/reaction`,
          body: { reaction: reactionCode },
        });
        rollbackRef.current = null;
        onReacted?.();
      } catch (error) {
        let errorMessage = "Error adding reaction";
        if (typeof error === "string") {
          errorMessage = error;
        }
        setToast({ message: errorMessage, type: "error" });
        rollbackRef.current?.();
        rollbackRef.current = null;
      }
    },
    [canReact, applyOptimisticReaction, drop.id, setToast, onReacted]
  );

  const buttons = topReactionCodes.map((code) => (
    <QuickReactButton
      key={code}
      reactionCode={code}
      dropId={drop.id}
      canReact={canReact}
      onReact={handleReact}
      isMobile={isMobile}
    />
  ));

  if (isMobile) {
    return (
      <div className="tw-flex tw-items-center tw-justify-start tw-gap-x-2 tw-rounded-xl tw-bg-iron-950 tw-p-3">
        {buttons}
      </div>
    );
  }

  return <>{buttons}</>;
};

const QuickReactButton: React.FC<{
  readonly reactionCode: string;
  readonly dropId: string;
  readonly canReact: boolean;
  readonly onReact: (code: string) => void;
  readonly isMobile?: boolean;
}> = ({ reactionCode, dropId, canReact, onReact, isMobile = false }) => {
  const { emojiMap, findNativeEmoji } = useEmoji();

  const emojiId = useMemo(
    () => reactionCode.replaceAll(":", ""),
    [reactionCode]
  );

  const emojiSize = isMobile ? "tw-size-7" : "tw-size-5";
  const textSize = isMobile ? "tw-text-[1.625rem]" : "tw-text-[1.25rem]";

  const emojiNode = useMemo(() => {
    const fallback = (
      <span
        className={`tw-flex tw-items-center tw-justify-center ${textSize} tw-leading-none`}
      >
        👍
      </span>
    );

    if (!emojiMap.length) return fallback;

    const custom = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === emojiId);

    const customSrc = custom?.skins[0]?.src;
    if (customSrc) {
      return (
        <div className={`tw-relative ${emojiSize}`}>
          <Image
            src={customSrc}
            alt={emojiId}
            fill
            className="tw-object-contain"
          />
        </div>
      );
    }

    const native = findNativeEmoji(emojiId);
    if (native?.skins[0]?.native) {
      return (
        <span
          className={`tw-flex tw-items-center tw-justify-center ${textSize} tw-leading-none`}
        >
          {native.skins[0].native}
        </span>
      );
    }

    return fallback;
  }, [emojiId, emojiMap, findNativeEmoji, emojiSize, textSize]);

  const handleClick = useCallback(() => {
    onReact(reactionCode);
  }, [onReact, reactionCode]);

  const tooltipId = `quick-react-${dropId}-${emojiId}`;

  if (isMobile) {
    return (
      <button
        className={`tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-transition-colors tw-duration-200 ${
          canReact ? "active:tw-bg-iron-700" : "tw-cursor-default tw-opacity-50"
        }`}
        onClick={handleClick}
        disabled={!canReact}
        aria-label="Click to react"
      >
        {emojiNode}
      </button>
    );
  }

  return (
    <>
      <button
        className={`tw-group tw-flex tw-h-full tw-items-center tw-gap-x-1.5 tw-rounded-full tw-border-0 tw-bg-transparent tw-text-xs tw-px-1 tw-font-medium tw-leading-5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out ${
          canReact ? "tw-cursor-pointer" : "tw-cursor-default tw-opacity-50"
        } hover:tw-text-[#FFCC22]`}
        onClick={handleClick}
        disabled={!canReact}
        aria-label="Click to react"
        {...(canReact ? { "data-tooltip-id": tooltipId } : {})}
      >
        <div
          className={`tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-transition tw-duration-300 tw-ease-out ${
            !canReact && "tw-opacity-50"
          }`}
        >
          {emojiNode}
        </div>
      </button>
      {canReact && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={{
            padding: "4px 8px",
            background: "#37373E",
            color: "white",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 99999,
            pointerEvents: "none",
          }}
        >
          <span className="tw-text-xs">Click to react</span>
        </Tooltip>
      )}
    </>
  );
};

export default WaveDropActionsQuickReact;
