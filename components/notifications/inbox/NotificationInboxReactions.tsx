"use client";

import { useEffect } from "react";
import ReactionEmojiPreview from "@/components/brain/notifications/drop-reacted/ReactionEmojiPreview";
import { useEmoji } from "@/contexts/EmojiContext";

export default function NotificationInboxReactions({
  reactions,
}: {
  readonly reactions: readonly string[];
}) {
  const { loadEmojiData, findCustomEmoji, findNativeEmoji } = useEmoji();

  useEffect(() => {
    void loadEmojiData();
  }, [loadEmojiData]);

  const rawIds = [
    ...new Set(reactions.map((reaction) => reaction.replaceAll(":", ""))),
  ];

  return (
    <div className="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-1">
      {rawIds.map((rawId) => {
        const emoji = findCustomEmoji(rawId) ?? findNativeEmoji(rawId);
        if (!emoji) {
          return (
            <span
              key={rawId}
              className="tw-break-all tw-text-sm tw-text-iron-300"
            >
              :{rawId}:
            </span>
          );
        }
        return (
          <div key={rawId} role="img" aria-label={emoji.name}>
            <div aria-hidden="true">
              <ReactionEmojiPreview rawId={rawId} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
