"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type Query } from "@tanstack/react-query";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  isInfiniteQueryData,
  refreshInfiniteQueryHead,
  type InfinitePageAdapter,
} from "@/components/react-query-wrapper/utils/refreshInfiniteQueryHead";
import { scheduleStaggered } from "@/helpers/jitter.helpers";
import { WsMessageType } from "@/helpers/Types";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  getConnectedWalletAccounts,
  isAuthJwtUsable,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { setNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";
import type {
  TypedNotification,
  TypedNotificationsResponse,
} from "@/types/feed.types";
import { useWebSocket } from "./useWebSocket";
import { useWebSocketMessage } from "./useWebSocketMessage";
import {
  WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS,
  WebSocketStatus,
} from "./WebSocketTypes";

const INVALIDATION_COALESCE_MS = 150;

const notificationsPageAdapter: InfinitePageAdapter<
  TypedNotificationsResponse,
  TypedNotification
> = {
  getItems: (page) => page.notifications,
  withItems: (page, notifications) => ({ ...page, notifications }),
  getKey: (notification) => notification.id,
};

const isMountedNotificationList = (query: Query): boolean =>
  query.isActive() && isInfiniteQueryData(query.state.data);

interface NotificationIdentitiesSyncedData {
  readonly profile_ids: readonly string[];
}

interface IdentityNotificationsChangedData {
  readonly profile_id: string;
}

const isNotificationIdentitiesSyncedData = (
  value: unknown
): value is NotificationIdentitiesSyncedData => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const profileIds = (value as { readonly profile_ids?: unknown }).profile_ids;
  return (
    Array.isArray(profileIds) &&
    profileIds.every((profileId) => typeof profileId === "string")
  );
};

const isIdentityNotificationsChangedData = (
  value: unknown
): value is IdentityNotificationsChangedData =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  typeof (value as { readonly profile_id?: unknown }).profile_id === "string";

export function NotificationWebSocketSync() {
  const queryClient = useQueryClient();
  const { connectedAccounts } = useSeizeConnectContext();
  const { send, status } = useWebSocket();
  const [authRevision, setAuthRevision] = useState(0);
  const previousStatusRef = useRef(status);
  const hasConnectedRef = useRef(false);
  const pendingProfileIdsRef = useRef(new Set<string>());
  const invalidationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const headRefreshControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    headRefreshControllerRef.current = controller;
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onAuthUpdated = () => setAuthRevision((revision) => revision + 1);
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onAuthUpdated);
    window.addEventListener(WALLET_ACCOUNTS_UPDATED_EVENT, onAuthUpdated);
    return () => {
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onAuthUpdated);
      window.removeEventListener(WALLET_ACCOUNTS_UPDATED_EVENT, onAuthUpdated);
    };
  }, []);

  const connectedAccountsRevision = connectedAccounts
    .map(
      (account) =>
        `${account.address}:${account.profileId ?? ""}:${account.isActive}`
    )
    .join("|");

  useEffect(() => {
    const wasConnected =
      previousStatusRef.current === WebSocketStatus.CONNECTED;
    previousStatusRef.current = status;
    if (status !== WebSocketStatus.CONNECTED) {
      setNotificationRealtimeState(false);
      return;
    }
    if (!wasConnected) {
      setNotificationRealtimeState(true);
    }

    const syncIdentities = () => {
      // Read tokens at send time so reconnects never reuse a memoized JWT.
      const tokens = getConnectedWalletAccounts()
        .map((account) => account.jwt)
        .filter((jwt): jwt is string => isAuthJwtUsable(jwt));
      const primaryJwt = getAuthJwt();
      if (typeof primaryJwt === "string" && isAuthJwtUsable(primaryJwt)) {
        tokens.unshift(primaryJwt);
      }
      send(WsMessageType.SYNC_NOTIFICATION_IDENTITIES, {
        access_tokens: Array.from(new Set(tokens)).slice(0, 5),
      });
    };

    const isReconnect = !wasConnected && hasConnectedRef.current;
    hasConnectedRef.current = true;
    if (!isReconnect) {
      syncIdentities();
      return;
    }
    // Every client reconnects together after a deploy, and the sync ack makes
    // each one refetch notifications. Stagger the sync; the effect cleanup
    // cancels it on disconnect, unmount, or a newer immediate sync.
    return scheduleStaggered(
      syncIdentities,
      WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS
    );
  }, [authRevision, connectedAccountsRevision, send, status]);

  // A notification event only adds recent entries, so a mounted list reloads
  // its first page instead of replaying every page the user has scrolled
  // through. Anything else under the key (counters, lists that are not mounted)
  // is invalidated as before, and a list whose first page cannot be merged
  // safely falls back to the same full invalidation.
  const refreshIdentityNotifications = useCallback(() => {
    const signal = headRefreshControllerRef.current?.signal;
    if (!signal || signal.aborted) {
      return;
    }

    const mountedLists = queryClient.getQueryCache().findAll({
      queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
      predicate: isMountedNotificationList,
    });
    queryClient
      .invalidateQueries(
        {
          queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
          predicate: (query) => !isMountedNotificationList(query),
        },
        {
          cancelRefetch: false,
        }
      )
      .catch(() => undefined);
    for (const { queryKey } of mountedLists) {
      refreshInfiniteQueryHead({
        queryClient,
        queryKey,
        strategy: "cursor",
        adapter: notificationsPageAdapter,
        signal,
      })
        .then((refreshed) =>
          refreshed
            ? undefined
            : queryClient.invalidateQueries(
                { queryKey, exact: true },
                { cancelRefetch: false }
              )
        )
        .catch(() => undefined);
    }
  }, [queryClient]);

  const invalidateProfiles = useCallback(
    (profileIds: readonly string[], forceActiveRefresh = false) => {
      const profileIdSet = new Set(profileIds);
      const activeProfileId = connectedAccounts.find(
        (account) => account.isActive
      )?.profileId;
      const shouldRefreshActive =
        forceActiveRefresh ||
        !profileIdSet.size ||
        !activeProfileId ||
        profileIdSet.has(activeProfileId);
      const shouldRefreshConnectedAccounts =
        !profileIdSet.size ||
        connectedAccounts.some(
          (account) =>
            !account.isActive &&
            !!account.profileId &&
            profileIdSet.has(account.profileId)
        );

      if (shouldRefreshActive) {
        refreshIdentityNotifications();
      }
      if (shouldRefreshConnectedAccounts) {
        queryClient
          .invalidateQueries(
            {
              queryKey: [QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS],
            },
            {
              cancelRefetch: false,
            }
          )
          .catch(() => undefined);
      }
    },
    [connectedAccounts, queryClient, refreshIdentityNotifications]
  );

  const flushInvalidations = useCallback(() => {
    invalidationTimerRef.current = null;
    const profileIds = Array.from(pendingProfileIdsRef.current);
    pendingProfileIdsRef.current.clear();
    invalidateProfiles(profileIds);
  }, [invalidateProfiles]);

  const onNotificationsChanged = useCallback(
    (value: unknown) => {
      if (!isIdentityNotificationsChangedData(value)) {
        return;
      }
      pendingProfileIdsRef.current.add(value.profile_id);
      invalidationTimerRef.current ??= setTimeout(
        flushInvalidations,
        INVALIDATION_COALESCE_MS
      );
    },
    [flushInvalidations]
  );

  const onNotificationIdentitiesSynced = useCallback(
    (value: unknown) => {
      if (!isNotificationIdentitiesSyncedData(value)) {
        return;
      }
      setNotificationRealtimeState(true, value.profile_ids);
      invalidateProfiles(value.profile_ids, true);
    },
    [invalidateProfiles]
  );

  useWebSocketMessage<unknown>(
    WsMessageType.IDENTITY_NOTIFICATIONS_CHANGED,
    onNotificationsChanged
  );
  useWebSocketMessage<unknown>(
    WsMessageType.NOTIFICATION_IDENTITIES_SYNCED,
    onNotificationIdentitiesSynced
  );

  useEffect(
    () => () => {
      if (invalidationTimerRef.current) {
        clearTimeout(invalidationTimerRef.current);
      }
      setNotificationRealtimeState(false);
    },
    []
  );

  return null;
}
