import type { ApiWave } from "@/generated/models/ApiWave";
import { type Drop, DropSize } from "@/helpers/waves/drop.helpers";

// Some callers pass partial wave payloads, so every level is optional here.
export const isWaveRepliesCollapsed = (
  wave: Partial<Pick<ApiWave, "chat">> | null | undefined
): boolean => wave?.chat?.replies?.collapsed === true;

export const isReplyDrop = (drop: Drop): boolean =>
  drop.type === DropSize.FULL
    ? Boolean(drop.reply_to)
    : drop.is_reply_drop === true;

/**
 * Collapsed-reply waves show replies under the drop they answer. The API
 * already leaves them out of feed pages; this also catches realtime and
 * optimistic inserts. Returns the same object when nothing was removed.
 */
export const withoutCollapsedReplies = <T extends { readonly drops: Drop[] }>(
  messages: T
): T => {
  const drops = messages.drops.filter((drop) => !isReplyDrop(drop));
  return drops.length === messages.drops.length
    ? messages
    : { ...messages, drops };
};
