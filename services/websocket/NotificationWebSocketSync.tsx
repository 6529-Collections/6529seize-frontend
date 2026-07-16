"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WsMessageType } from "@/helpers/Types";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getAuthJwt,
  getConnectedWalletAccounts,
  isAuthJwtUsable,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { setNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";
import { useWebSocket } from "./useWebSocket";
import { useWebSocketMessage } from "./useWebSocketMessage";
import { WebSocketStatus } from "./WebSocketTypes";

const INVALIDATION_COALESCE_MS = 150;

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
  const pendingProfileIdsRef = useRef(new Set<string>());
  const invalidationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  const accessTokens = useMemo(() => {
    void authRevision;
    void connectedAccountsRevision;
    const tokens = getConnectedWalletAccounts()
      .map((account) => account.jwt)
      .filter((jwt): jwt is string => isAuthJwtUsable(jwt));
    const primaryJwt = getAuthJwt();
    if (typeof primaryJwt === "string" && isAuthJwtUsable(primaryJwt)) {
      tokens.unshift(primaryJwt);
    }
    return Array.from(new Set(tokens)).slice(0, 5);
  }, [authRevision, connectedAccountsRevision]);

  const invalidateProfiles = useCallback(
    (profileIds: readonly string[]) => {
      const profileIdSet = new Set(profileIds);
      const activeProfileId = connectedAccounts.find(
        (account) => account.isActive
      )?.profileId;
      const shouldRefreshActive =
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
        void queryClient.invalidateQueries({
          queryKey: [QueryKey.IDENTITY_NOTIFICATIONS],
        });
      }
      if (shouldRefreshConnectedAccounts) {
        void queryClient.invalidateQueries({
          queryKey: [QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS],
        });
      }
    },
    [connectedAccounts, queryClient]
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
      invalidateProfiles(value.profile_ids);
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

  useEffect(() => {
    if (status !== WebSocketStatus.CONNECTED) {
      setNotificationRealtimeState(false);
      return;
    }
    setNotificationRealtimeState(true);
    send(WsMessageType.SYNC_NOTIFICATION_IDENTITIES, {
      access_tokens: accessTokens,
    });
  }, [accessTokens, send, status]);

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
