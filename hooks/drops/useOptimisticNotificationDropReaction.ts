"use client";

import type { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  applyProfileReactionToEntries,
  cloneReactionEntries,
  toProfileMin,
} from "@/components/waves/drops/reaction-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type {
  TypedNotification,
  TypedNotificationsResponse,
} from "@/types/feed.types";
import type { InfiniteData } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

type NotificationsCacheData = InfiniteData<TypedNotificationsResponse>;
type OptimisticRollback = (() => void) | null;

type NotificationUpdate = {
  readonly notification: TypedNotification;
  readonly changed: boolean;
};

type PageUpdate = {
  readonly page: TypedNotificationsResponse;
  readonly changed: boolean;
};

const EMPTY_CONTEXT_PROFILE_CONTEXT: ApiDropContextProfileContext = {
  rating: 0,
  min_rating: 0,
  max_rating: 0,
  reaction: null,
  boosted: false,
  bookmarked: false,
  curatable: false,
  curated: false,
};

const isIdentityNotificationsQueryKey = (
  queryKey: readonly unknown[]
): boolean => queryKey[0] === QueryKey.IDENTITY_NOTIFICATIONS;

const hasNotificationDrops = (
  notification: TypedNotification
): notification is TypedNotification & { readonly related_drops: ApiDrop[] } =>
  "related_drops" in notification && Array.isArray(notification.related_drops);

const isNotificationsCacheData = (
  data: unknown
): data is NotificationsCacheData => {
  if (data === null || typeof data !== "object") {
    return false;
  }

  const pages = (data as { readonly pages?: unknown }).pages;
  if (!Array.isArray(pages)) {
    return false;
  }

  return pages.every((page) => {
    if (page === null || typeof page !== "object") {
      return false;
    }

    return Array.isArray(
      (page as { readonly notifications?: unknown }).notifications
    );
  });
};

const applyReactionToNotificationDrop = ({
  baseContext,
  drop,
  profileMin,
  reactionCode,
}: {
  readonly baseContext: ApiDropContextProfileContext | null | undefined;
  readonly drop: ApiDrop;
  readonly profileMin: ApiProfileMin;
  readonly reactionCode: string | null;
}): ApiDrop => {
  const previousReaction =
    drop.context_profile_context?.reaction ?? baseContext?.reaction ?? null;
  const reactions = applyProfileReactionToEntries({
    entries: cloneReactionEntries(drop.reactions),
    nextReaction: reactionCode,
    previousReaction,
    profileMin,
  });

  return {
    ...drop,
    reactions,
    context_profile_context: {
      ...(drop.context_profile_context ??
        baseContext ??
        EMPTY_CONTEXT_PROFILE_CONTEXT),
      reaction: reactionCode,
    },
  };
};

const updateNotificationWithDropReaction = ({
  baseContext,
  dropId,
  notification,
  profileMin,
  reactionCode,
}: {
  readonly baseContext: ApiDropContextProfileContext | null | undefined;
  readonly dropId: string;
  readonly notification: TypedNotification;
  readonly profileMin: ApiProfileMin;
  readonly reactionCode: string | null;
}): NotificationUpdate => {
  if (!hasNotificationDrops(notification)) {
    return { notification, changed: false };
  }

  const matchingIndex = notification.related_drops.findIndex(
    (relatedDrop) => relatedDrop.id === dropId
  );

  if (matchingIndex < 0) {
    return { notification, changed: false };
  }

  const relatedDrops = notification.related_drops.map((relatedDrop) =>
    relatedDrop.id === dropId
      ? applyReactionToNotificationDrop({
          baseContext,
          drop: relatedDrop,
          profileMin,
          reactionCode,
        })
      : relatedDrop
  );

  return {
    notification: {
      ...notification,
      related_drops: relatedDrops,
    } as TypedNotification,
    changed: true,
  };
};

const updateNotificationsPage = ({
  baseContext,
  dropId,
  page,
  profileMin,
  reactionCode,
}: {
  readonly baseContext: ApiDropContextProfileContext | null | undefined;
  readonly dropId: string;
  readonly page: TypedNotificationsResponse;
  readonly profileMin: ApiProfileMin;
  readonly reactionCode: string | null;
}): PageUpdate => {
  const updates = page.notifications.map((notification) =>
    updateNotificationWithDropReaction({
      baseContext,
      dropId,
      notification,
      profileMin,
      reactionCode,
    })
  );
  const pageChanged = updates.some((update) => update.changed);

  if (!pageChanged) {
    return { page, changed: false };
  }

  return {
    page: {
      ...page,
      notifications: updates.map((update) => update.notification),
    },
    changed: true,
  };
};

const updateNotificationsCacheData = ({
  baseContext,
  data,
  dropId,
  profileMin,
  reactionCode,
}: {
  readonly baseContext: ApiDropContextProfileContext | null | undefined;
  readonly data: unknown;
  readonly dropId: string;
  readonly profileMin: ApiProfileMin;
  readonly reactionCode: string | null;
}): unknown => {
  if (!isNotificationsCacheData(data)) {
    return data;
  }

  const pageUpdates = data.pages.map((page) =>
    updateNotificationsPage({
      baseContext,
      dropId,
      page,
      profileMin,
      reactionCode,
    })
  );
  const changed = pageUpdates.some((pageUpdate) => pageUpdate.changed);

  return changed
    ? { ...data, pages: pageUpdates.map((pageUpdate) => pageUpdate.page) }
    : data;
};

export const useOptimisticNotificationDropReaction = ({
  connectedProfile,
  contextProfileContext,
  dropId,
}: {
  readonly connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  readonly contextProfileContext:
    | ApiDropContextProfileContext
    | null
    | undefined;
  readonly dropId: string;
}) => {
  const queryClient = useQueryClient();

  return useCallback(
    (reactionCode: string | null): OptimisticRollback => {
      const profileMin = toProfileMin(connectedProfile);
      if (!profileMin) {
        return null;
      }

      const matchingQueries = queryClient.getQueryCache().findAll({
        predicate: (query) => isIdentityNotificationsQueryKey(query.queryKey),
      });

      if (matchingQueries.length === 0) {
        return null;
      }

      const snapshots: Array<{
        readonly queryKey: (typeof matchingQueries)[number]["queryKey"];
        readonly data: unknown;
      }> = [];

      for (const query of matchingQueries) {
        const currentData = query.state.data;
        const nextData = updateNotificationsCacheData({
          baseContext: contextProfileContext,
          data: currentData,
          dropId,
          profileMin,
          reactionCode,
        });

        if (nextData === currentData) {
          continue;
        }

        snapshots.push({
          queryKey: query.queryKey,
          data: currentData,
        });
        queryClient.setQueryData(query.queryKey, nextData);
      }

      if (snapshots.length === 0) {
        return null;
      }

      return () => {
        for (const snapshot of snapshots) {
          queryClient.setQueryData(snapshot.queryKey, snapshot.data);
        }
      };
    },
    [connectedProfile, contextProfileContext, dropId, queryClient]
  );
};
