"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { isUnauthorizedQueryError } from "@/components/react-query-wrapper/utils/query-utils";
import { getAuthJwt, isAuthJwtUsable } from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";

interface UseUnreadNotificationsOptions {
  readonly enabled?: boolean | undefined;
}

type AuthPollingError = Error & {
  readonly status: 401;
  readonly authPollingKey: string;
  readonly cause?: unknown;
};

const createAuthPollingError = (
  authPollingKey: string,
  cause?: unknown
): AuthPollingError => {
  const error = new Error(
    "Unread notification polling requires valid auth"
  ) as AuthPollingError;
  Object.defineProperty(error, "status", {
    value: 401,
    enumerable: true,
  });
  Object.defineProperty(error, "authPollingKey", {
    value: authPollingKey,
    enumerable: true,
  });
  if (cause !== undefined) {
    Object.defineProperty(error, "cause", {
      value: cause,
      enumerable: false,
    });
  }
  return error;
};

const getAuthPollingKeyFromError = (error: unknown): string | null => {
  if (!isUnauthorizedQueryError(error)) {
    return null;
  }
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const authPollingKey = (error as { readonly authPollingKey?: unknown })
    .authPollingKey;
  return typeof authPollingKey === "string" ? authPollingKey : null;
};

export function useUnreadNotifications(
  handle: string | null,
  options: UseUnreadNotificationsOptions = {}
) {
  const { isCapacitor } = useCapacitor();
  const authJwt = getAuthJwt();
  const hasUsableAuthJwt = isAuthJwtUsable(authJwt);
  const authPollingKey = `${handle ?? ""}:${getAuthTokenFingerprint(authJwt)}`;
  const [blockedAuthPollingKey, setBlockedAuthPollingKey] = useState<
    string | null
  >(null);
  const isAuthPollingBlocked = blockedAuthPollingKey === authPollingKey;
  const isEnabled =
    !!handle &&
    options.enabled !== false &&
    hasUsableAuthJwt &&
    !isAuthPollingBlocked;

  const { data: notifications } = useQuery<ApiNotificationsResponseV2>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: handle, limit: "1", version: "v2" },
    ],
    queryFn: async () => {
      if (!isAuthJwtUsable(getAuthJwt())) {
        throw createAuthPollingError(authPollingKey);
      }

      try {
        return await commonApiFetch<ApiNotificationsResponseV2>({
          endpoint: `v2/notifications`,
          params: {
            limit: "1",
          },
          errorMode: "structured",
        });
      } catch (error) {
        if (isUnauthorizedQueryError(error)) {
          throw createAuthPollingError(authPollingKey, error);
        }
        throw error;
      }
    },
    enabled: isEnabled,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    retry: (failureCount: number, error: unknown) => {
      const blockedKey = getAuthPollingKeyFromError(error);
      if (blockedKey) {
        setBlockedAuthPollingKey((previous) =>
          previous === blockedKey ? previous : blockedKey
        );
        return false;
      }
      if (isUnauthorizedQueryError(error)) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (failureCount: number) => {
      return failureCount * 1000;
    },
  });

  const effectiveNotifications = isEnabled ? notifications : undefined;
  const haveUnreadNotifications =
    (effectiveNotifications?.unread_count ?? 0) > 0;

  return { notifications: effectiveNotifications, haveUnreadNotifications };
}
