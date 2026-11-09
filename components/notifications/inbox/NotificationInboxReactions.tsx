"use client";

import { useEffect } from "react";
import ReactionEmojiPreview from "@/components/brain/notifications/drop-reacted/ReactionEmojiPreview";
import { useEmoji } from "@/contexts/EmojiContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";

const MAX_PREVIEW_REACTIONS = 6;

export default function NotificationInboxReactions({
  reactions,
}: {
  readonly reactions: readonly string[];
}) {
  const locale = useBrowserLocale();
  const { loadEmojiData, findCustomEmoji, findNativeEmoji } = useEmoji();

  useEffect(() => {
    void loadEmojiData();
  }, [loadEmojiData]);

  const reactionById = new Map<string, string>();
  for (const reaction of reactions) {
    if (typeof reaction !== "string" || !reaction.trim()) continue;
    const rawId = reaction.replaceAll(":", "");
    if (rawId) reactionById.set(rawId, reaction);
  }
  const visibleReactions = [...reactionById.entries()].slice(
    0,
    MAX_PREVIEW_REACTIONS
  );
  const remainingCount = reactionById.size - visibleReactions.length;

  return (
    <div className="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-1">
      {visibleReactions.map(([rawId, reaction]) => {
        const emoji = findCustomEmoji(rawId) ?? findNativeEmoji(rawId);
        if (!emoji) {
          return (
            <span
              key={rawId}
              className="tw-break-all tw-text-sm tw-text-iron-300"
            >
              {t(locale, "notifications.inbox.reactionCode", {
                code: reaction,
              })}
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
      {remainingCount > 0 && (
        <span className="tw-text-xs tw-text-iron-300">
          {t(locale, "notifications.inbox.moreReactions", {
            count: formatNumber(locale, remainingCount),
          })}
        </span>
      )}
    </div>
  );
}
