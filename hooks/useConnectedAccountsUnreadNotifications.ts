"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  getQueryErrorStatus,
  isTerminalNotificationAuthQueryError,
  shouldStopPollingRetry,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import {
  isAuthJwtUsable,
  type ConnectedWalletAccount,
} from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";

type ConnectedAccountUnreadCounts = Readonly<Record<string, number>>;

const POLL_INTERVAL_MS = 15000;

const toAddressKey = (address: string): string => address.toLowerCase();
const toAccountAuthKey = (address: string): string =>
  getAuthTokenFingerprint(toAddressKey(address));

type TerminalConnectedAccountAuthFailure = {
  readonly accountAuthKey: string;
  readonly jwtFingerprint: string;
};

type ConnectedAccountTerminalAuthPollingError = Error & {
  readonly status: number;
  readonly terminalNotificationAuth: true;
  readonly terminalAuthFailures: readonly TerminalConnectedAccountAuthFailure[];
  readonly cause?: unknown;
};

const createConnectedAccountTerminalAuthPollingError = (
  terminalAuthFailures: readonly TerminalConnectedAccountAuthFailure[],
  status: number,
  cause?: unknown
): ConnectedAccountTerminalAuthPollingError => {
  const error = new Error(
    "Connected account unread notification polling requires valid auth"
  ) as ConnectedAccountTerminalAuthPollingError;
  Object.defineProperty(error, "status", {
    value: status,
    enumerable: true,
  });
  Object.defineProperty(error, "terminalNotificationAuth", {
    value: true,
    enumerable: true,
  });
  // Keep account/token fingerprints away from generic error serializers.
  Object.defineProperty(error, "terminalAuthFailures", {
    value: terminalAuthFailures,
    enumerable: false,
  });
  if (cause !== undefined) {
    Object.defineProperty(error, "cause", {
      value: cause,
      enumerable: false,
    });
  }
  return error;
};

const getTerminalAuthFailuresFromError = (
  error: unknown
): readonly TerminalConnectedAccountAuthFailure[] => {
  if (!isTerminalNotificationAuthQueryError(error)) {
    return [];
  }
  if (typeof error !== "object" || error === null) {
    return [];
  }

  const failures = (error as { readonly terminalAuthFailures?: unknown })
    .terminalAuthFailures;
  return Array.isArray(failures)
    ? failures.filter(
        (failure): failure is TerminalConnectedAccountAuthFailure =>
          typeof failure === "object" &&
          failure !== null &&
          typeof (failure as TerminalConnectedAccountAuthFailure)
            .accountAuthKey === "string" &&
          typeof (failure as TerminalConnectedAccountAuthFailure)
            .jwtFingerprint === "string"
      )
    : [];
};

const clampUnreadCount = (count: number | null | undefined): number => {
  if (typeof count !== "number" || Number.isNaN(count) || count <= 0) {
    return 0;
  }
  return Math.floor(count);
};

const fetchUnreadCountForAccount = async (
  account: ConnectedWalletAccount
): Promise<number> => {
  if (!account.jwt) {
    return 0;
  }
  const accountAuthKey = toAccountAuthKey(account.address);
  const jwtFingerprint = getAuthTokenFingerprint(account.jwt);

  if (!isAuthJwtUsable(account.jwt)) {
    throw createConnectedAccountTerminalAuthPollingError(
      [{ accountAuthKey, jwtFingerprint }],
      401
    );
  }

  try {
    const notifications = await commonApiFetch<ApiNotificationsResponseV2>({
      endpoint: "v2/notifications",
      params: { limit: "1" },
      headers: {
        Authorization: `Bearer ${account.jwt}`,
      },
      errorMode: "structured",
    });
    return clampUnreadCount(notifications.unread_count);
  } catch (error) {
    if (isTerminalNotificationAuthQueryError(error)) {
      throw createConnectedAccountTerminalAuthPollingError(
        [{ accountAuthKey, jwtFingerprint }],
        getQueryErrorStatus(error) ?? 401,
        error
      );
    }
    throw error;
  }
};

export function useConnectedAccountsUnreadNotifications(
  accounts: readonly ConnectedWalletAccount[]
): ConnectedAccountUnreadCounts {
  const { isCapacitor } = useCapacitor();
  const queryClient = useQueryClient();
  const [terminalJwtFingerprintByAccount, setTerminalJwtFingerprintByAccount] =
    useState<Readonly<Record<string, string>>>({});
  const pollableAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const jwt = account.jwt;
        if (typeof jwt !== "string" || !isAuthJwtUsable(jwt)) {
          return false;
        }

        return (
          terminalJwtFingerprintByAccount[toAccountAuthKey(account.address)] !==
          getAuthTokenFingerprint(jwt)
        );
      }),
    [accounts, terminalJwtFingerprintByAccount]
  );
  const queryKey = [
    QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
    "connected-account-unread-counts",
    "v2",
    pollableAccounts.map((account) => toAddressKey(account.address)),
  ] as const;

  const { data } = useQuery<ConnectedAccountUnreadCounts>({
    queryKey,
    queryFn: async () => {
      if (pollableAccounts.length === 0) {
        return {};
      }

      const previousCounts =
        queryClient.getQueryData<ConnectedAccountUnreadCounts>(queryKey) ?? {};
      const results = await Promise.allSettled(
        pollableAccounts.map((account) => fetchUnreadCountForAccount(account))
      );
      const nextCounts: Record<string, number> = {};
      const terminalAuthFailures: {
        readonly accountAuthKey: string;
        readonly jwtFingerprint: string;
        readonly status: number;
        readonly error: unknown;
      }[] = [];

      pollableAccounts.forEach((account, index) => {
        const addressKey = toAddressKey(account.address);
        const result = results[index];

        if (!result) {
          const previousCount = previousCounts[addressKey];
          if (typeof previousCount === "number") {
            nextCounts[addressKey] = previousCount;
          }
          return;
        }

        if (result.status === "fulfilled") {
          nextCounts[addressKey] = result.value;
          return;
        }

        if (
          account.jwt &&
          isTerminalNotificationAuthQueryError(result.reason)
        ) {
          const nestedTerminalAuthFailures =
            getTerminalAuthFailuresFromError(result.reason);
          if (nestedTerminalAuthFailures.length > 0) {
            nestedTerminalAuthFailures.forEach((failure) => {
              terminalAuthFailures.push({
                ...failure,
                status: getQueryErrorStatus(result.reason) ?? 401,
                error: result.reason,
              });
            });
            return;
          }

          terminalAuthFailures.push({
            accountAuthKey: toAccountAuthKey(account.address),
            jwtFingerprint: getAuthTokenFingerprint(account.jwt),
            status: getQueryErrorStatus(result.reason) ?? 401,
            error: result.reason,
          });
          return;
        }

        const previousCount = previousCounts[addressKey];
        if (typeof previousCount === "number") {
          nextCounts[addressKey] = previousCount;
        }
      });

      const firstTerminalAuthFailure = terminalAuthFailures[0];
      if (firstTerminalAuthFailure) {
        throw createConnectedAccountTerminalAuthPollingError(
          terminalAuthFailures.map(({ accountAuthKey, jwtFingerprint }) => ({
            accountAuthKey,
            jwtFingerprint,
          })),
          firstTerminalAuthFailure.status,
          firstTerminalAuthFailure.error
        );
      }

      return nextCounts;
    },
    enabled: pollableAccounts.length > 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    retry: (failureCount: number, error: unknown) => {
      const terminalAuthFailures = getTerminalAuthFailuresFromError(error);
      if (terminalAuthFailures.length > 0) {
        setTerminalJwtFingerprintByAccount((previous) => {
          let didChange = false;
          const next = { ...previous };
          for (const failure of terminalAuthFailures) {
            if (next[failure.accountAuthKey] !== failure.jwtFingerprint) {
              next[failure.accountAuthKey] = failure.jwtFingerprint;
              didChange = true;
            }
          }
          return didChange ? next : previous;
        });
        return false;
      }
      if (isTerminalNotificationAuthQueryError(error)) {
        return false;
      }
      if (shouldStopPollingRetry(error)) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (failureCount: number) => {
      return failureCount * 1000;
    },
  });

  return data ?? {};
}
