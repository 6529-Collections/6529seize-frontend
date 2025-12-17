"use client";

import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { INotificationIdentityMentioned } from "@/types/feed.types";
import NotificationWithDrop from "../subcomponents/NotificationWithDrop";

export default function NotificationIdentityMentioned({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationIdentityMentioned;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  return (
    <NotificationWithDrop
      drop={notification.related_drops[0]}
      actionText="mentioned you"
      createdAt={notification.created_at}
      activeDrop={activeDrop}
      onReply={onReply}
      onQuote={onQuote}
      onDropContentClick={onDropContentClick}
    />
  );
}
