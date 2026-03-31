"use client";

import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { parseIpfsUrl } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  GroupedReactionsItem,
  INotificationDropReacted,
} from "@/types/feed.types";
import { Fragment, useEffect, useRef } from "react";
import NotificationsFollowAllBtn from "../NotificationsFollowAllBtn";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationDrop from "../subcomponents/NotificationDrop";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import {
  getIsDirectMessage,
  useWaveNavigation,
} from "../utils/navigationUtils";
import ReactionEmojiPreview from "./ReactionEmojiPreview";

function getIdentityKey(profile: ApiProfileMin): string {
  return (
    profile.id ??
    profile.handle ??
    profile.primary_address ??
    `unknown-profile`
  );
}

function mergeProfiles(
  preferred: ApiProfileMin,
  fallback: ApiProfileMin
): ApiProfileMin {
  return {
    ...fallback,
    ...preferred,
    handle: preferred.handle ?? fallback.handle,
    // Keep an explicit empty handle, but treat blank avatar/address strings as
    // missing so older identity data survives grouped merges.
    pfp: preferred.pfp || fallback.pfp,
    primary_address: preferred.primary_address || fallback.primary_address,
  };
}

function notificationsLatestPerUser(
  notifications: GroupedReactionsItem["notifications"]
): INotificationDropReacted[] {
  const byUser = new Map<
    string,
    {
      latest: INotificationDropReacted;
      identity: ApiProfileMin;
    }
  >();
  for (const n of notifications) {
    const key = getIdentityKey(n.related_identity);
    if (!key) continue;
    const existing = byUser.get(key);
    if (!existing) {
      byUser.set(key, {
        latest: n,
        identity: n.related_identity,
      });
      continue;
    }
    const isNewer =
      n.created_at > existing.latest.created_at ||
      (n.created_at === existing.latest.created_at && n.id > existing.latest.id);
    const latest = isNewer ? n : existing.latest;
    const fallbackIdentity = isNewer
      ? existing.identity
      : n.related_identity;
    byUser.set(key, {
      latest,
      identity: mergeProfiles(latest.related_identity, fallbackIdentity),
    });
  }
  const list = Array.from(byUser.values())
    .map(({ latest, identity }) => ({
      ...latest,
      related_identity: identity,
    }))
    .sort((a, b) => a.created_at - b.created_at || a.id - b.id);
  return list;
}

type ReactionGroup = {
  readonly reaction: string;
  readonly rawId: string;
  readonly notifications: INotificationDropReacted[];
};

function groupLatestByReaction(
  latestPerUser: INotificationDropReacted[]
): ReactionGroup[] {
  const byReaction = new Map<string, INotificationDropReacted[]>();
  for (const n of latestPerUser) {
    const reaction = n.additional_context.reaction;
    const list = byReaction.get(reaction) ?? [];
    list.push(n);
    byReaction.set(reaction, list);
  }
  return Array.from(byReaction.entries())
    .map(([reaction, list]) => ({
      reaction,
      rawId: reaction.replaceAll(":", ""),
      notifications: list,
    }))
    .sort((a, b) => {
      const aLatest = Math.max(...a.notifications.map((n) => n.created_at));
      const bLatest = Math.max(...b.notifications.map((n) => n.created_at));
      return bLatest - aLatest;
    });
}

interface NotificationDropReactedGroupProps {
  readonly group: GroupedReactionsItem;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly onMarkAsRead?: ((notificationIds: number[]) => void) | undefined;
}

export default function NotificationDropReactedGroup({
  group,
  activeDrop,
  onReply,
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
  const reactionGroups = groupLatestByReaction(latestPerUser);
  const singleReactor = fullReactors[0];
  const isSingleVisibleReactor =
    fullReactors.length === 1 && reactionGroups.length === 1 && !!singleReactor;

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
      {isSingleVisibleReactor ? (
        <NotificationHeader
          author={singleReactor}
          actions={
            <NotificationsFollowBtn
              profile={singleReactor}
              size={UserFollowBtnSize.SMALL}
            />
          }
        >
          <span className="tw-text-sm tw-font-normal tw-text-iron-400">
            reacted
          </span>
          <ReactionEmojiPreview rawId={reactionGroups[0]!.rawId} />
          <NotificationTimestamp createdAt={createdAt} />
        </NotificationHeader>
      ) : (
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-gap-y-2 min-[390px]:tw-flex-row min-[390px]:tw-items-center min-[390px]:tw-justify-between min-[390px]:tw-gap-x-2">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1">
              <span className="tw-mr-1 tw-text-sm tw-font-normal tw-text-iron-400">
                New reactions
              </span>
              {reactionGroups.map((rg, index) => {
                const profiles = rg.notifications.map((n) => n.related_identity);
                const avatarItems = profiles.map((profile) => {
                  const key = getIdentityKey(profile);
                  const href = profile.handle ? `/${profile.handle}` : undefined;
                  const displayName =
                    profile.handle ??
                    (profile.id === null || profile.id === undefined
                      ? undefined
                      : String(profile.id));
                  const title =
                    displayName !== undefined && displayName !== ""
                      ? displayName
                      : undefined;
                  return {
                    key,
                    pfpUrl: profile.pfp ? parseIpfsUrl(profile.pfp) : null,
                    ariaLabel: profile.handle
                      ? `View @${profile.handle}`
                      : "View profile",
                    fallback: profile.handle?.slice(0, 2).toUpperCase() ?? "?",
                    ...(href !== undefined && { href }),
                    ...(title !== undefined && { title }),
                  };
                });
                return (
                  <Fragment key={rg.reaction}>
                    {index > 0 && (
                      <span className="tw-mx-0.5 tw-flex-shrink-0 tw-text-xs tw-font-bold tw-text-iron-400">
                        &#8226;
                      </span>
                    )}
                    <div className="tw-flex tw-h-7 tw-flex-shrink-0 tw-items-center tw-gap-x-0.5 tw-overflow-visible">
                      <OverlappingAvatars
                        items={avatarItems}
                        size="md"
                        overlapClass="-tw-space-x-1"
                      />
                      <div className="tw-relative tw-flex-shrink-0 tw-overflow-visible tw-transition-transform tw-duration-200 tw-ease-out hover:!tw-z-[100] hover:tw-scale-110">
                        <ReactionEmojiPreview rawId={rg.rawId} />
                      </div>
                    </div>
                  </Fragment>
                );
              })}
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
      )}

      <NotificationDrop
        drop={drop}
        activeDrop={activeDrop}
        onReply={onReply}
        onReplyClick={createReplyClickHandler(drop.wave.id, isDirectMessage)}
        onQuoteClick={createQuoteClickHandler(isDirectMessage)}
        onDropContentClick={handleDropContentClick}
      />
    </div>
  );
}
