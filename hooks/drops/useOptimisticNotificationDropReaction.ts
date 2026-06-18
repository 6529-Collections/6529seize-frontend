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
import {
  applyOptimisticReactionQueryCacheUpdate,
  EMPTY_DROP_CONTEXT_PROFILE_CONTEXT,
} from "@/hooks/drops/optimisticReactionQueryCache";
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

const getProfileNotificationsIdentity = (
  connectedProfile: ReturnType<typeof useAuth>["connectedProfile"]
): string | null => {
  return connectedProfile?.handle?.trim().toLowerCase() ?? null;
};

const getQueryKeyNotificationsIdentity = (
  queryKey: readonly unknown[]
): string | null => {
  if (queryKey[0] !== QueryKey.IDENTITY_NOTIFICATIONS) {
    return null;
  }

  const params = queryKey[1];
  if (params === null || typeof params !== "object") {
    return null;
  }

  const identity = (params as { readonly identity?: unknown }).identity;
  if (typeof identity !== "string") {
    return null;
  }

  const normalizedIdentity = identity.trim().toLowerCase();
  return normalizedIdentity ? normalizedIdentity : null;
};

const isIdentityNotificationsQueryKeyForIdentity = (
  queryKey: readonly unknown[],
  identity: string
): boolean => getQueryKeyNotificationsIdentity(queryKey) === identity;

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
        EMPTY_DROP_CONTEXT_PROFILE_CONTEXT),
      reaction: reactionCode,
    },
  };
};

const updateNotificationDrop = ({
  dropId,
  notification,
  updateDrop,
}: {
  readonly dropId: string;
  readonly notification: TypedNotification;
  readonly updateDrop: (drop: ApiDrop) => ApiDrop;
}): NotificationUpdate => {
  if (!hasNotificationDrops(notification)) {
    return { notification, changed: false };
  }

  let changed = false;
  const relatedDrops: ApiDrop[] = [];

  for (const relatedDrop of notification.related_drops) {
    if (relatedDrop.id !== dropId) {
      relatedDrops.push(relatedDrop);
      continue;
    }

    changed = true;
    relatedDrops.push(updateDrop(relatedDrop));
  }

  if (!changed) {
    return { notification, changed: false };
  }

  return {
    notification: {
      ...notification,
      related_drops: relatedDrops,
    } as TypedNotification,
    changed: true,
  };
};

const updateNotificationsPageDrop = ({
  dropId,
  page,
  updateDrop,
}: {
  readonly dropId: string;
  readonly page: TypedNotificationsResponse;
  readonly updateDrop: (drop: ApiDrop) => ApiDrop;
}): PageUpdate => {
  const updates = page.notifications.map((notification) =>
    updateNotificationDrop({
      dropId,
      notification,
      updateDrop,
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

const updateNotificationsCacheDataDrop = ({
  data,
  dropId,
  updateDrop,
}: {
  readonly data: unknown;
  readonly dropId: string;
  readonly updateDrop: (drop: ApiDrop) => ApiDrop;
}): unknown => {
  if (!isNotificationsCacheData(data)) {
    return data;
  }

  const pageUpdates = data.pages.map((page) =>
    updateNotificationsPageDrop({
      dropId,
      page,
      updateDrop,
    })
  );
  const changed = pageUpdates.some((pageUpdate) => pageUpdate.changed);

  return changed
    ? { ...data, pages: pageUpdates.map((pageUpdate) => pageUpdate.page) }
    : data;
};

const updateNotificationsCacheDataWithReaction = ({
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
}): unknown =>
  updateNotificationsCacheDataDrop({
    data,
    dropId,
    updateDrop: (drop) =>
      applyReactionToNotificationDrop({
        baseContext,
        drop,
        profileMin,
        reactionCode,
      }),
  });

const updateNotificationsCacheDataWithCanonicalDrop = ({
  data,
  drop,
  dropId,
}: {
  readonly data: unknown;
  readonly drop: ApiDrop;
  readonly dropId: string;
}): unknown =>
  updateNotificationsCacheDataDrop({
    data,
    dropId,
    updateDrop: () => drop,
  });

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
      const notificationsIdentity =
        getProfileNotificationsIdentity(connectedProfile);
      if (!notificationsIdentity) {
        return null;
      }

      const profileMin = toProfileMin(connectedProfile);
      if (!profileMin) {
        return null;
      }

      return applyOptimisticReactionQueryCacheUpdate({
        isTargetQueryKey: (queryKey) =>
          isIdentityNotificationsQueryKeyForIdentity(
            queryKey,
            notificationsIdentity
          ),
        queryClient,
        updateData: (currentData) =>
          updateNotificationsCacheDataWithReaction({
            baseContext: contextProfileContext,
            data: currentData,
            dropId,
            profileMin,
            reactionCode,
          }),
      });
    },
    [connectedProfile, contextProfileContext, dropId, queryClient]
  );
};

export const useCanonicalNotificationDropUpdate = ({
  connectedProfile,
  dropId,
}: {
  readonly connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  readonly dropId: string;
}) => {
  const queryClient = useQueryClient();

  return useCallback(
    (drop: ApiDrop): void => {
      const notificationsIdentity =
        getProfileNotificationsIdentity(connectedProfile);
      if (!notificationsIdentity) {
        return;
      }

      applyOptimisticReactionQueryCacheUpdate({
        isTargetQueryKey: (queryKey) =>
          isIdentityNotificationsQueryKeyForIdentity(
            queryKey,
            notificationsIdentity
          ),
        queryClient,
        updateData: (currentData) =>
          updateNotificationsCacheDataWithCanonicalDrop({
            data: currentData,
            drop,
            dropId,
          }),
      });
    },
    [connectedProfile, dropId, queryClient]
  );
};
