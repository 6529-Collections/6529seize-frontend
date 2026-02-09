"use client";

import { useEmoji } from "@/contexts/EmojiContext";
import {
  getReactionSnapshot,
  getReactionSnapshotServer,
  getTopReactions,
  subscribeToReactionStore,
} from "@/helpers/reactions/reactionHistory";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropReaction } from "@/hooks/drops/useDropReaction";
import Image from "next/image";
import React, {
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import { Tooltip } from "react-tooltip";

const MAX_QUICK_REACTIONS = 3;

const WaveDropActionsQuickReact: React.FC<{
  readonly drop: ExtendedDrop;
  readonly isMobile?: boolean;
  readonly onReacted?: () => void;
}> = ({ drop, isMobile = false, onReacted }) => {
  const { react, canReact } = useDropReaction(drop, onReacted);

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

  const buttons = topReactionCodes.map((code) => (
    <QuickReactButton
      key={code}
      reactionCode={code}
      dropId={drop.id}
      canReact={canReact}
      onReact={react}
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
        className={`tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-[#FFCC22] ${
          canReact ? "tw-cursor-pointer" : "tw-cursor-default tw-opacity-50"
        }`}
        onClick={handleClick}
        disabled={!canReact}
        aria-label="Click to react"
        {...(canReact ? { "data-tooltip-id": tooltipId } : {})}
      >
        <div
          className={`tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-transition tw-duration-300 tw-ease-out ${
            !canReact ? "tw-opacity-50" : ""
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
          style={TOOLTIP_STYLES}
        >
          <span className="tw-text-xs">Click to react</span>
        </Tooltip>
      )}
    </>
  );
};

export default WaveDropActionsQuickReact;
