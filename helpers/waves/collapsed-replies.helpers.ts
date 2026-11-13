import type { ApiDrop } from "@/generated/models/ApiDrop";
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

/** Locate the root from a reply or from the root itself. */
export const getIndividuallyCollapsedThread = (
  drop: Pick<
    ApiDrop,
    | "id"
    | "serial_no"
    | "reply_to"
    | "collapse_replies"
    | "collapsed_reply_thread"
  >
): ApiDrop["collapsed_reply_thread"] =>
  drop.collapsed_reply_thread ??
  (!drop.reply_to && drop.collapse_replies
    ? { id: drop.id, serial_no: drop.serial_no }
    : undefined);

/** Feed pages already exclude these replies. Filter realtime and pending inserts too. */
export const withoutCollapsedReplies = <T extends { readonly drops: Drop[] }>(
  messages: T,
  collapseAll = true
): T => {
  const drops = messages.drops.filter((drop) =>
    collapseAll
      ? !isReplyDrop(drop)
      : drop.type !== DropSize.FULL || !drop.collapsed_reply_thread
  );
  return drops.length === messages.drops.length
    ? messages
    : { ...messages, drops };
};
