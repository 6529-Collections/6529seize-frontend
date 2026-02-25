"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";

import NotificationsFollowBtn from "../NotificationsFollowBtn";
import {
  getIsDirectMessage,
  useWaveNavigation,
} from "../utils/navigationUtils";

import NotificationDrop from "./NotificationDrop";
import NotificationHeader from "./NotificationHeader";
import NotificationTimestamp from "./NotificationTimestamp";

interface NotificationWithDropProps {
  readonly drop: ApiDrop;
  readonly actionText: string;
  readonly createdAt: number;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}

export default function NotificationWithDrop({
  drop,
  actionText,
  createdAt,
  activeDrop,
  onReply,
  onDropContentClick,
}: NotificationWithDropProps) {
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const isDirectMessage = getIsDirectMessage(drop.wave);

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-space-y-2">
      <NotificationHeader
        author={drop.author}
        actions={
          <NotificationsFollowBtn
            profile={drop.author}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          {actionText}
        </span>
        <NotificationTimestamp createdAt={createdAt} />
      </NotificationHeader>

      <NotificationDrop
        drop={drop}
        activeDrop={activeDrop}
        onReply={onReply}
        onReplyClick={createReplyClickHandler(drop.wave.id, isDirectMessage)}
        onQuoteClick={createQuoteClickHandler(isDirectMessage)}
        onDropContentClick={onDropContentClick}
      />
    </div>
  );
}
