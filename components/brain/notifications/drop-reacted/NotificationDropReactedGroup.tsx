"use client";

import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  GroupedReactionsItem,
  INotificationDropReacted,
} from "@/types/feed.types";
import { Fragment, memo, useEffect, useRef } from "react";
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

function getNonEmptyIdentityValue(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

function getIdentityKey(profile: ApiProfileMin): string {
  return (
    getNonEmptyIdentityValue(profile.id) ??
    getNonEmptyIdentityValue(profile.handle) ??
    getNonEmptyIdentityValue(profile.primary_address) ??
    "unknown-profile"
  );
}

function getIdentityAliases(profile: ApiProfileMin): string[] {
  return [
    getNonEmptyIdentityValue(profile.id),
    getNonEmptyIdentityValue(profile.handle),
    getNonEmptyIdentityValue(profile.primary_address),
  ].filter((alias): alias is string => alias !== null);
}

function mergeProfiles(
  preferred: ApiProfileMin,
  fallback: ApiProfileMin
): ApiProfileMin {
  return {
    ...fallback,
    ...preferred,
    // Treat blank identity fields as missing so grouped notifications keep the
    // most recent usable handle/avatar/address data.
    handle:
      getNonEmptyIdentityValue(preferred.handle) ??
      getNonEmptyIdentityValue(fallback.handle),
    pfp: getNonEmptyIdentityValue(preferred.pfp) ?? fallback.pfp,
    primary_address:
      getNonEmptyIdentityValue(preferred.primary_address) ??
      fallback.primary_address,
  };
}

type LatestPerUserEntry = {
  latest: INotificationDropReacted;
  identity: ApiProfileMin;
};

function getFallbackIdentityKey(
  notification: INotificationDropReacted
): string {
  const identityKey = getIdentityKey(notification.related_identity);
  if (identityKey !== "unknown-profile") {
    return identityKey;
  }

  console.warn(
    "NotificationDropReactedGroup received a reaction without a usable identity key",
    {
      notificationId: notification.id,
      relatedIdentity: notification.related_identity,
    }
  );

  return `unknown-identity-${notification.id}`;
}

function resolveGroupedIdentityKey(
  notification: INotificationDropReacted,
  aliasToKey: Map<string, string>
): { canonicalKey: string; matchingKeys: string[] } {
  const fallbackKey = getFallbackIdentityKey(notification);
  const matchingKeys = [
    ...new Set(
      getIdentityAliases(notification.related_identity)
        .map((alias) => aliasToKey.get(alias))
        .filter((key): key is string => key !== undefined)
    ),
  ];

  return {
    canonicalKey: matchingKeys[0] ?? fallbackKey,
    matchingKeys,
  };
}

function cacheIdentityAliases(
  aliasToKey: Map<string, string>,
  identity: ApiProfileMin,
  key: string
): void {
  for (const alias of getIdentityAliases(identity)) {
    aliasToKey.set(alias, key);
  }
}

function getMergedEntry(
  existing: LatestPerUserEntry,
  notification: INotificationDropReacted
): LatestPerUserEntry {
  const isNewer =
    notification.created_at > existing.latest.created_at ||
    (notification.created_at === existing.latest.created_at &&
      notification.id > existing.latest.id);

  if (isNewer) {
    return {
      latest: notification,
      identity: mergeProfiles(notification.related_identity, existing.identity),
    };
  }

  return {
    latest: existing.latest,
    identity: mergeProfiles(existing.identity, notification.related_identity),
  };
}

function mergeLatestPerUserEntries(
  primary: LatestPerUserEntry,
  secondary: LatestPerUserEntry
): LatestPerUserEntry {
  const shouldUseSecondary =
    secondary.latest.created_at > primary.latest.created_at ||
    (secondary.latest.created_at === primary.latest.created_at &&
      secondary.latest.id > primary.latest.id);

  if (shouldUseSecondary) {
    return {
      latest: secondary.latest,
      identity: mergeProfiles(secondary.identity, primary.identity),
    };
  }

  return {
    latest: primary.latest,
    identity: mergeProfiles(primary.identity, secondary.identity),
  };
}

function notificationsLatestPerUser(
  notifications: GroupedReactionsItem["notifications"]
): INotificationDropReacted[] {
  const byUser = new Map<string, LatestPerUserEntry>();
  const aliasToKey = new Map<string, string>();

  for (const n of notifications) {
    const { canonicalKey, matchingKeys } = resolveGroupedIdentityKey(
      n,
      aliasToKey
    );
    const matchedEntries = matchingKeys
      .map((key) => ({
        key,
        entry: byUser.get(key),
      }))
      .filter(
        (value): value is { key: string; entry: LatestPerUserEntry } =>
          value.entry !== undefined
      );
    const mergedExisting = matchedEntries.reduce<LatestPerUserEntry | null>(
      (accumulator, { entry }) =>
        accumulator === null
          ? entry
          : mergeLatestPerUserEntries(accumulator, entry),
      null
    );

    if (!mergedExisting) {
      const entry = {
        latest: n,
        identity: n.related_identity,
      };
      byUser.set(canonicalKey, entry);
      cacheIdentityAliases(aliasToKey, entry.identity, canonicalKey);
      continue;
    }

    const entry = getMergedEntry(mergedExisting, n);
    byUser.set(canonicalKey, entry);
    cacheIdentityAliases(aliasToKey, entry.identity, canonicalKey);
    cacheIdentityAliases(aliasToKey, n.related_identity, canonicalKey);

    for (const { key, entry: matchedEntry } of matchedEntries) {
      cacheIdentityAliases(aliasToKey, matchedEntry.identity, canonicalKey);
      if (key !== canonicalKey) {
        byUser.delete(key);
      }
    }
  }

  return Array.from(byUser.values())
    .map(({ latest, identity }) => ({
      ...latest,
      related_identity: identity,
    }))
    .sort((a, b) => a.created_at - b.created_at || a.id - b.id);
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

function NotificationDropReactedGroupComponent({
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
  const ids = [...new Set(notifications.map((n) => n.id))];
  const idsKey = ids.join(",");
  const latestPerUser = notificationsLatestPerUser(notifications);
  const fullReactors = latestPerUser.map((n) => n.related_identity);
  const reactionGroups = groupLatestByReaction(latestPerUser);
  const singleReactor = fullReactors[0];
  const singleReactorHandle =
    singleReactor && getNonEmptyIdentityValue(singleReactor.handle);
  const singleReactorWithHandle =
    singleReactor && singleReactorHandle
      ? {
          ...singleReactor,
          handle: singleReactorHandle,
        }
      : null;
  const isSingleVisibleReactor =
    fullReactors.length === 1 &&
    reactionGroups.length === 1 &&
    !!singleReactorWithHandle;

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
          author={singleReactorWithHandle}
          actions={
            <NotificationsFollowBtn
              profile={singleReactorWithHandle}
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
                const avatarItems = rg.notifications.map((n) => {
                  const profile = n.related_identity;
                  const identityKey = getIdentityKey(profile);
                  const normalizedHandle = getNonEmptyIdentityValue(
                    profile.handle
                  );
                  const key =
                    identityKey === "unknown-profile"
                      ? `unknown-identity-${n.id}`
                      : identityKey;
                  const href = normalizedHandle
                    ? `/${normalizedHandle}`
                    : undefined;
                  const displayName = normalizedHandle ?? profile.id;
                  const title = displayName || undefined;
                  return {
                    key,
                    pfpUrl: profile.pfp ?? null,
                    ariaLabel: normalizedHandle
                      ? `View @${normalizedHandle}`
                      : "View profile",
                    fallback:
                      normalizedHandle?.slice(0, 2).toUpperCase() ?? "?",
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

const NotificationDropReactedGroup = memo(
  NotificationDropReactedGroupComponent
);

NotificationDropReactedGroup.displayName = "NotificationDropReactedGroup";

export default NotificationDropReactedGroup;
