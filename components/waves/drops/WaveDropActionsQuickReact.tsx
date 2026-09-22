"use client";

import {
  useEmoji,
  type Emoji,
  type NativeEmoji,
} from "@/contexts/EmojiContext";
import {
  getReactionSnapshot,
  getReactionSnapshotServer,
  getTopReactions,
  subscribeToReactionStore,
} from "@/helpers/reactions/reactionHistory";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropReaction } from "@/hooks/drops/useDropReaction";
import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import DropActionTooltip from "./DropActionTooltip";

const MAX_QUICK_REACTIONS = 3;
const DEFAULT_QUICK_REACTION_ID = "+1";
const DEFAULT_QUICK_REACTION: NativeEmoji = {
  id: DEFAULT_QUICK_REACTION_ID,
  name: "Thumbs up",
  keywords: "thumbs up",
  skins: [{ native: "👍" }],
};

const WaveDropActionsQuickReact: React.FC<{
  readonly drop: ExtendedDrop;
  readonly isMobile?: boolean;
  readonly onReactionStarted?: () => void;
}> = ({ drop, isMobile = false, onReactionStarted }) => {
  const { react, canReact } = useDropReaction(drop, { source: "quick-react" });

  const handleReaction = useCallback(
    (reactionCode: string) => {
      if (!canReact) {
        return;
      }

      void react(reactionCode);
      onReactionStarted?.();
    },
    [canReact, onReactionStarted, react]
  );

  // Subscribe to localStorage changes (hydration-safe)
  const snapshot = useSyncExternalStore(
    subscribeToReactionStore,
    getReactionSnapshot,
    getReactionSnapshotServer
  );

  const { findCustomEmoji, findNativeEmoji, loadEmojiData } = useEmoji();
  const topReactionCodes = useMemo(
    () => getTopReactions(Number.MAX_SAFE_INTEGER, snapshot),
    [snapshot]
  );

  useEffect(() => {
    if (topReactionCodes.some((code) => code !== ":+1:")) {
      void loadEmojiData();
    }
  }, [topReactionCodes, loadEmojiData]);

  const topEmojis = topReactionCodes
    .flatMap((code) => {
      const id = code.replaceAll(":", "");
      const emoji = findCustomEmoji(id) ?? findNativeEmoji(id);
      if (
        emoji?.skins[0] &&
        ("src" in emoji.skins[0] ? emoji.skins[0].src : emoji.skins[0].native)
      ) {
        return [emoji];
      }
      return id === DEFAULT_QUICK_REACTION_ID ? [DEFAULT_QUICK_REACTION] : [];
    })
    .slice(0, MAX_QUICK_REACTIONS);
  // Only use a fallback when nothing can be rendered. It must send the emoji
  // it displays, rather than disguising an unavailable saved reaction as 👍.
  const visibleEmojis = topEmojis.length ? topEmojis : [DEFAULT_QUICK_REACTION];
  const buttons = visibleEmojis.map((emoji) => (
    <QuickReactButton
      key={emoji.id}
      emoji={emoji}
      canReact={canReact}
      onReact={handleReaction}
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
  readonly emoji: Emoji | NativeEmoji;
  readonly canReact: boolean;
  readonly onReact: (code: string) => void;
  readonly isMobile?: boolean;
}> = ({ emoji, canReact, onReact, isMobile = false }) => {
  const emojiSize = isMobile ? "tw-size-7" : "tw-size-5";
  const textSize = isMobile ? "tw-text-[1.625rem]" : "tw-text-[1.25rem]";
  const skin = emoji.skins[0];
  const emojiNode =
    skin && "src" in skin ? (
      <div className={`tw-relative ${emojiSize}`}>
        <Image
          src={skin.src}
          alt={emoji.name}
          fill
          sizes={isMobile ? "28px" : "20px"}
          unoptimized
          className="tw-object-contain"
        />
      </div>
    ) : (
      <span
        className={`tw-flex tw-items-center tw-justify-center ${textSize} tw-leading-none`}
      >
        {skin?.native ?? "👍"}
      </span>
    );

  const handleClick = useCallback(() => {
    onReact(`:${emoji.id}:`);
  }, [onReact, emoji.id]);

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
    <DropActionTooltip
      content={<span className="tw-text-xs">Click to react</span>}
      disabled={!canReact}
    >
      <button
        className={`tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-[#FFCC22] ${
          canReact ? "tw-cursor-pointer" : "tw-cursor-default tw-opacity-50"
        }`}
        onClick={handleClick}
        disabled={!canReact}
        aria-label="Click to react"
      >
        <div
          className={`tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-transition tw-duration-300 tw-ease-out ${
            canReact ? "" : "tw-opacity-50"
          }`}
        >
          {emojiNode}
        </div>
      </button>
    </DropActionTooltip>
  );
};

export default WaveDropActionsQuickReact;
