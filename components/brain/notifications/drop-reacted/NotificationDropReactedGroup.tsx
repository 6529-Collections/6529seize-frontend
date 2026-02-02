"use client";

import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { parseIpfsUrl } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  GroupedReactionsItem,
  INotificationDropReacted,
} from "@/types/feed.types";
import { useEffect, useRef } from "react";
import NotificationsFollowAllBtn from "../NotificationsFollowAllBtn";
import NotificationDrop from "../subcomponents/NotificationDrop";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import {
  getIsDirectMessage,
  useWaveNavigation,
} from "../utils/navigationUtils";
import ReactionEmojiPreview from "./ReactionEmojiPreview";

const MAX_OVERLAP_AVATARS = 5;
const MAX_OVERLAP_EMOJIS = 5;

function notificationsLatestPerUser(
  notifications: GroupedReactionsItem["notifications"]
): INotificationDropReacted[] {
  const byUser = new Map<string, INotificationDropReacted>();
  for (const n of notifications) {
    const key = n.related_identity?.id ?? n.related_identity?.handle ?? "";
    if (!key) continue;
    const existing = byUser.get(key);
    if (!existing || n.id > existing.id) {
      byUser.set(key, n);
    }
  }
  const list = Array.from(byUser.values());
  list.sort((a, b) => a.id - b.id);
  return list;
}

interface NotificationDropReactedGroupProps {
  readonly group: GroupedReactionsItem;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onMarkAsRead?: ((notificationIds: number[]) => void) | undefined;
}

export default function NotificationDropReactedGroup({
  group,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
  onMarkAsRead,
}: NotificationDropReactedGroupProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasMarkedRef = useRef(false);
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const { drop, notifications, createdAt } = group;
  const isDirectMessage = getIsDirectMessage(drop.wave);
  const ids = notifications.map((n) => n.id);
  const idsKey = ids.join(",");
  const latestPerUser = notificationsLatestPerUser(notifications);
  const fullReactors = latestPerUser.map((n) => n.related_identity);
  const reactors = fullReactors.slice(0, MAX_OVERLAP_AVATARS);
  const emojiItems = latestPerUser.slice(0, MAX_OVERLAP_EMOJIS);

  useEffect(() => {
    hasMarkedRef.current = false;
  }, [idsKey]);

  const handleDropContentClick = (clickedDrop: ExtendedDrop) => {
    if (!hasMarkedRef.current && onMarkAsRead) {
      hasMarkedRef.current = true;
      onMarkAsRead(ids);
    }
    onDropContentClick?.(clickedDrop);
  };

  return (
    <div ref={rootRef} className="tw-flex tw-w-full tw-flex-col tw-gap-y-2">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-h-7 tw-min-w-0 tw-flex-shrink-0 tw-items-center tw-justify-start tw-overflow-visible">
          <OverlappingAvatars
            items={reactors.map((profile) => {
              const key =
                profile.id ?? profile.handle ?? profile.primary_address ?? "";
              const item: {
                key: string;
                pfpUrl: string | null;
                ariaLabel: string;
                fallback: string;
                href?: string;
              } = {
                key,
                pfpUrl: profile.pfp ? parseIpfsUrl(profile.pfp) : null,
                ariaLabel: profile.handle
                  ? `View @${profile.handle}`
                  : "View profile",
                fallback: profile.handle?.slice(0, 2).toUpperCase() ?? "?",
              };
              if (profile.handle) item.href = `/${profile.handle}`;
              return item;
            })}
            maxCount={MAX_OVERLAP_AVATARS}
            size="md"
          />
        </div>
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-gap-y-2 min-[390px]:tw-flex-row min-[390px]:tw-items-center min-[390px]:tw-justify-between min-[390px]:tw-gap-x-2">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1">
            <span className="tw-text-sm tw-font-normal tw-text-iron-400">
              New reactions
            </span>
            {emojiItems.length > 0 && (
              <div className="tw-flex tw-items-center -tw-space-x-2 tw-overflow-visible">
                {emojiItems.map((n, index) => {
                  const rawId = n.additional_context.reaction.replaceAll(
                    ":",
                    ""
                  );
                  let transformOrigin: string;
                  if (index === 0) transformOrigin = "left center";
                  else if (index === emojiItems.length - 1)
                    transformOrigin = "right center";
                  else transformOrigin = "center center";
                  return (
                    <div
                      key={n.id}
                      className="tw-relative tw-flex-shrink-0 tw-overflow-visible tw-transition-transform tw-duration-200 tw-ease-out hover:!tw-z-[100] hover:tw-scale-110"
                      style={{
                        zIndex: emojiItems.length - index,
                        transformOrigin,
                      }}
                    >
                      <ReactionEmojiPreview rawId={rawId} />
                    </div>
                  );
                })}
              </div>
            )}
            <NotificationTimestamp createdAt={createdAt} />
          </div>
          {fullReactors.length > 0 && (
            <div className="tw-flex-shrink-0">
              <NotificationsFollowAllBtn
                profiles={fullReactors}
                size={UserFollowBtnSize.SMALL}
              />
            </div>
          )}
        </div>
      </div>

      <NotificationDrop
        drop={drop}
        activeDrop={activeDrop}
        onReply={onReply}
        onQuote={onQuote}
        onReplyClick={createReplyClickHandler(drop.wave.id, isDirectMessage)}
        onQuoteClick={createQuoteClickHandler(isDirectMessage)}
        onDropContentClick={handleDropContentClick}
      />
    </div>
  );
}
