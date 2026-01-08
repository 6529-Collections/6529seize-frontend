"use client";

import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { INotificationDropReplied } from "@/types/feed.types";
import NotificationWithDrop from "../subcomponents/NotificationWithDrop";

export default function NotificationDropReplied({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationDropReplied;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}) {
  const replyDrop = notification.related_drops?.[1];

  if (!replyDrop) {
    return null;
  }

  return (
    <NotificationWithDrop
      drop={replyDrop}
      actionText="replied"
      createdAt={notification.created_at}
      activeDrop={activeDrop}
      onReply={onReply}
      onQuote={onQuote}
      onDropContentClick={onDropContentClick}
    />
  );
}
