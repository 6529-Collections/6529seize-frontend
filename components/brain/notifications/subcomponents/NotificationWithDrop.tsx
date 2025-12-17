"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationDrop from "./NotificationDrop";
import NotificationHeader from "./NotificationHeader";
import NotificationTimestamp from "./NotificationTimestamp";
import {
  getIsDirectMessage,
  useWaveNavigation,
} from "../utils/navigationUtils";

interface NotificationWithDropProps {
  readonly drop: ApiDrop;
  readonly actionText: string;
  readonly createdAt: number;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function NotificationWithDrop({
  drop,
  actionText,
  createdAt,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: NotificationWithDropProps) {
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const isDirectMessage = getIsDirectMessage(drop.wave);

  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
      <NotificationHeader
        author={drop.author}
        actions={
          <NotificationsFollowBtn
            profile={drop.author}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          {actionText}
        </span>
        <NotificationTimestamp createdAt={createdAt} />
      </NotificationHeader>

      <NotificationDrop
        drop={drop}
        activeDrop={activeDrop}
        onReply={onReply}
        onQuote={onQuote}
        onReplyClick={createReplyClickHandler(drop.wave.id, isDirectMessage)}
        onQuoteClick={createQuoteClickHandler(isDirectMessage)}
        onDropContentClick={onDropContentClick}
      />
    </div>
  );
}

