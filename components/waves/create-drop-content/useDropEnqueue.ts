import { useCallback } from "react";
import type { useUnreadDividerOptional } from "@/contexts/wave/UnreadDividerContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { DropMutationBody } from "./drop-submission.types";

/**
 * Sends a drop the composer accepted. The move to the 6529 Network refuses
 * it first when it pauses it; an entry then goes to the 6529 Network once
 * entries do, and anything else joins 6529.io's send queue. Once it is
 * accepted the composer clears the unread divider, marks a chat post sent
 * and closes the keyboard after a drop.
 */
export function useDropEnqueue({
  refusePausedDrop,
  sendChainEntry,
  queueDrop,
  onDropAddedToQueue,
  markChatSubmitted,
  unreadDividerContext,
}: {
  readonly refusePausedDrop: (dropRequest: DropMutationBody) => boolean;
  readonly sendChainEntry:
    | ((dropRequest: DropMutationBody) => false | Promise<boolean>)
    | null;
  readonly queueDrop: (dropRequest: DropMutationBody) => boolean;
  readonly onDropAddedToQueue: () => void;
  readonly markChatSubmitted: () => void;
  readonly unreadDividerContext: ReturnType<typeof useUnreadDividerOptional>;
}) {
  const onDropEnqueued = useCallback(
    (dropRequest: DropMutationBody) => {
      unreadDividerContext?.setUnreadDividerSerialNo(null);
      onDropAddedToQueue();
      if (dropRequest.drop.drop_type === ApiDropType.Chat) {
        markChatSubmitted();
      } else if (document.activeElement instanceof HTMLElement) {
        // Close the keyboard after a drop.
        document.activeElement.blur();
      }
    },
    [markChatSubmitted, onDropAddedToQueue, unreadDividerContext]
  );

  return useCallback(
    (dropRequest: DropMutationBody): boolean | Promise<boolean> => {
      if (refusePausedDrop(dropRequest)) return false;
      const isEntry = dropRequest.drop.drop_type !== ApiDropType.Chat;
      // The answer says when an entry went out to the 6529 Network.
      const accepted =
        sendChainEntry && isEntry
          ? sendChainEntry(dropRequest)
          : queueDrop(dropRequest);
      if (accepted === false) {
        return false;
      }
      onDropEnqueued(dropRequest);
      return accepted;
    },
    [onDropEnqueued, queueDrop, refusePausedDrop, sendChainEntry]
  );
}
