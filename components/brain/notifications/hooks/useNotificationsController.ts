"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { NotificationDisplayItem } from "@/types/feed.types";
import type { NotificationFilter } from "../NotificationsCauseFilter";
import { useSetTitle } from "@/contexts/TitleContext";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { useLayout } from "../../my-stream/layout/LayoutContext";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import {
  DEFAULT_ERROR_MESSAGE,
  LOAD_TIMEOUT_MESSAGE,
  LOAD_TIMEOUT_MS,
} from "../utils/constants";
import { getNotificationErrorDetails } from "../utils/getNotificationErrorDetails";

interface NotificationsContentState {
  readonly isLoadingProfile: boolean;
  readonly showProxyDisabledState: boolean;
  readonly showErrorState: boolean;
  readonly resolvedErrorMessage: string;
  readonly showLoader: boolean;
  readonly showNoItems: boolean;
}

interface NotificationsHandlers {
  readonly handleRetry: () => void;
  readonly handleProxyDisable: () => void;
}

interface NotificationsPagination {
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
}

interface UseNotificationsControllerResult {
  readonly activeFilter: NotificationFilter | null;
  readonly setActiveFilter: (filter: NotificationFilter | null) => void;
  readonly isAuthenticated: boolean;
  readonly notificationsViewStyle: CSSProperties;
  readonly items: NotificationDisplayItem[];
  readonly isFetchingNextPage: boolean;
  readonly pagination: NotificationsPagination;
  readonly contentState: NotificationsContentState;
  readonly handlers: NotificationsHandlers;
  readonly markNotificationIdsAsRead: (ids: number[]) => Promise<void>;
}

interface NotificationAuthScope {
  readonly authScope: string;
}

interface MarkNotificationIdsAsReadVariables extends NotificationAuthScope {
  readonly ids: number[];
}

export const useNotificationsController =
  (): UseNotificationsControllerResult => {
    const {
      connectedProfile,
      isAuthenticated: isAuthContextAuthenticated,
      activeProfileProxy,
      fetchingProfile,
      requestAuth,
      setToast,
      setActiveProfileProxy,
    } = useContext(AuthContext);
    const { address: connectedAddress, isSigningOutAll } =
      useSeizeConnectContext();
    const { notificationsViewStyle } = useLayout();
    const { removeAllDeliveredNotifications } = useNotificationsContext();
    const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const lastMarkedAllAsReadScopeRef = useRef<string | null>(null);
    const errorToastShownRef = useRef(false);
    const reauthTriggeredRef = useRef(false);
    const timeoutToastShownRef = useRef(false);
    const lastErrorMessageRef = useRef<string | null>(null);

    const [activeFilter, setActiveFilter] = useState<NotificationFilter | null>(
      null
    );
    const [hasTimedOut, setHasTimedOut] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const reload = searchParams?.get("reload") ?? undefined;
    const isAuthenticated =
      (isAuthContextAuthenticated ?? !!connectedProfile?.handle) &&
      !activeProfileProxy &&
      !isSigningOutAll;
    const notificationAuthScope =
      isAuthenticated && connectedAddress
        ? connectedAddress.toLowerCase()
        : null;
    const currentNotificationAuthScopeRef = useRef<string | null>(
      notificationAuthScope
    );
    useLayoutEffect(() => {
      currentNotificationAuthScopeRef.current = notificationAuthScope;
    }, [notificationAuthScope]);
    const isCurrentNotificationAuthScope = useCallback(
      (authScope: string): boolean =>
        currentNotificationAuthScopeRef.current === authScope,
      []
    );
    const isLoadingProfile = fetchingProfile && !connectedProfile;

    useSetTitle("Notifications | My Stream | Brain");

    const { mutateAsync: markAllAsRead } = useMutation({
      mutationFn: async (_variables: NotificationAuthScope) =>
        await commonApiPostWithoutBodyAndResponse({
          endpoint: `notifications/read`,
        }),
      onSuccess: async (_data, { authScope }) => {
        if (!isCurrentNotificationAuthScope(authScope)) {
          return;
        }
        try {
          invalidateNotifications();
          await removeAllDeliveredNotifications();
        } catch (error) {
          console.error("Failed to clear delivered notifications:", error);
        }
      },
      onError: (error, { authScope }) => {
        if (!isCurrentNotificationAuthScope(authScope)) {
          return;
        }
        setToast({
          type: "error",
          title: "Couldn't mark notifications as read.",
          description: "Please try again.",
          details: getToastErrorDetails(error),
        });
      },
    });

    useEffect(() => {
      if (!isAuthenticated || !notificationAuthScope) {
        return;
      }
      if (
        reload === "true" ||
        lastMarkedAllAsReadScopeRef.current === notificationAuthScope
      ) {
        return;
      }

      lastMarkedAllAsReadScopeRef.current = notificationAuthScope;
      const markNotificationsAsRead = async (): Promise<void> => {
        try {
          await markAllAsRead({ authScope: notificationAuthScope });
        } catch (error: unknown) {
          console.error("Failed to mark notifications as read:", error);
        }
      };
      const id = setTimeout(() => {
        void markNotificationsAsRead();
      }, 0);
      return () => clearTimeout(id);
    }, [isAuthenticated, markAllAsRead, notificationAuthScope, reload]);

    useEffect(() => {
      if (!isAuthenticated || !notificationAuthScope) {
        lastMarkedAllAsReadScopeRef.current = null;
      }
    }, [isAuthenticated, notificationAuthScope]);

    const {
      items,
      rawItems: rawItemsFromQuery,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      refetch,
      isInitialQueryDone,
      isSuccess,
      error: queryError,
    } = useNotificationsQuery({
      identity: isAuthenticated ? connectedProfile?.handle : undefined,
      activeProfileProxy: !!activeProfileProxy,
      limit: "30",
      reverse: true,
      cause: activeFilter?.cause?.length ? activeFilter.cause : null,
    });
    const rawItems = rawItemsFromQuery ?? items;

    const { mutateAsync: markNotificationIdsAsRead } = useMutation({
      mutationFn: async ({ ids }: MarkNotificationIdsAsReadVariables) => {
        await Promise.all(
          ids.map((id) =>
            commonApiPostWithoutBodyAndResponse({
              endpoint: `notifications/${id}/read`,
            })
          )
        );
      },
      onSuccess: async (_data, { authScope }) => {
        if (!isCurrentNotificationAuthScope(authScope)) {
          return;
        }
        try {
          invalidateNotifications();
          await removeAllDeliveredNotifications();
        } catch (error) {
          console.error("Failed to clear delivered notifications:", error);
        }
      },
      onError: (error, { authScope }) => {
        if (!isCurrentNotificationAuthScope(authScope)) {
          return;
        }
        setToast({
          type: "error",
          title: "Couldn't mark notifications as read.",
          description: "Please try again.",
          details: getToastErrorDetails(error),
        });
      },
    });

    useEffect(() => {
      if (reload !== "true") {
        return;
      }

      const clearReloadParam = () => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.delete("reload");
        const newUrl = params.toString()
          ? `${pathname}?${params.toString()}`
          : pathname || "/notifications";
        router.replace(newUrl, { scroll: false });
      };

      if (!isAuthenticated || !notificationAuthScope) {
        clearReloadParam();
        return;
      }

      refetch()
        .then(() => {
          if (!isCurrentNotificationAuthScope(notificationAuthScope)) {
            return undefined;
          }
          lastMarkedAllAsReadScopeRef.current = notificationAuthScope;
          return markAllAsRead({ authScope: notificationAuthScope });
        })
        .catch((error) => {
          console.error("Error during refetch:", error);
        })
        .finally(() => {
          clearReloadParam();
        });
    }, [
      pathname,
      isAuthenticated,
      isCurrentNotificationAuthScope,
      markAllAsRead,
      notificationAuthScope,
      refetch,
      reload,
      router,
      searchParams,
    ]);

    useEffect(() => {
      if (!queryError) {
        setErrorMessage(null);
        setHasTimedOut(false);
        errorToastShownRef.current = false;
        reauthTriggeredRef.current = false;
        lastErrorMessageRef.current = null;
        return;
      }

      const { message, isUnauthorized } =
        getNotificationErrorDetails(queryError);

      if (lastErrorMessageRef.current !== message) {
        errorToastShownRef.current = false;
        reauthTriggeredRef.current = false;
        lastErrorMessageRef.current = message;
      }

      setErrorMessage(message);
      setHasTimedOut(false);

      if (!errorToastShownRef.current) {
        setToast({
          type: "error",
          title: isUnauthorized
            ? "Please reconnect your wallet."
            : "Couldn't load notifications.",
          description: isUnauthorized
            ? "Your session needs to be refreshed."
            : "Please try again.",
          details: getToastErrorDetails(queryError, message),
        });
        errorToastShownRef.current = true;
      }

      if (isUnauthorized && !reauthTriggeredRef.current) {
        requestAuth().catch((error) => {
          console.error(
            "Failed to re-authenticate after notifications error:",
            error
          );
        });
        reauthTriggeredRef.current = true;
      }
    }, [queryError, requestAuth, setToast]);

    useEffect(() => {
      if (isSuccess) {
        setHasTimedOut(false);
        timeoutToastShownRef.current = false;
        return;
      }

      if (errorMessage || !isAuthenticated || isLoadingProfile) {
        setHasTimedOut(false);
        timeoutToastShownRef.current = false;
        return;
      }

      if (isInitialQueryDone) {
        return;
      }

      const timerId = globalThis.setTimeout(() => {
        setHasTimedOut(true);
      }, LOAD_TIMEOUT_MS);

      return () => {
        globalThis.clearTimeout(timerId);
      };
    }, [
      errorMessage,
      isAuthenticated,
      isInitialQueryDone,
      isLoadingProfile,
      isSuccess,
    ]);

    useEffect(() => {
      if (hasTimedOut) {
        if (!timeoutToastShownRef.current) {
          setToast({
            message: LOAD_TIMEOUT_MESSAGE,
            type: "warning",
          });
          timeoutToastShownRef.current = true;
        }
      } else {
        timeoutToastShownRef.current = false;
      }
    }, [hasTimedOut, setToast]);

    const handleRetry = useCallback(() => {
      setHasTimedOut(false);
      setErrorMessage(null);
      errorToastShownRef.current = false;
      reauthTriggeredRef.current = false;
      lastErrorMessageRef.current = null;
      refetch({ cancelRefetch: true }).catch((error) => {
        console.error("Failed to retry notifications fetch:", error);
      });
    }, [refetch]);

    const handleProxyDisable = useCallback(() => {
      setActiveProfileProxy(null).catch((error) => {
        console.error("Failed to switch to primary profile:", error);
        setToast({
          type: "error",
          title: "Couldn't switch to your primary profile.",
          description: "Please try again.",
          details: getToastErrorDetails(
            error,
            "Unable to switch to primary profile. Please try again."
          ),
        });
      });
    }, [setActiveProfileProxy, setToast]);

    const showLoader =
      isAuthenticated &&
      !hasTimedOut &&
      !errorMessage &&
      (!isInitialQueryDone || isFetching) &&
      rawItems.length === 0;
    const showNoItems =
      isAuthenticated &&
      !errorMessage &&
      !hasTimedOut &&
      isInitialQueryDone &&
      !isFetching &&
      rawItems.length === 0;
    const showErrorState =
      (!!errorMessage || hasTimedOut) && rawItems.length === 0;
    const showProxyDisabledState = !!activeProfileProxy;
    const resolvedErrorMessage = hasTimedOut
      ? LOAD_TIMEOUT_MESSAGE
      : (errorMessage ?? DEFAULT_ERROR_MESSAGE);

    const contentState = useMemo<NotificationsContentState>(
      () => ({
        isLoadingProfile,
        showProxyDisabledState,
        showErrorState,
        resolvedErrorMessage,
        showLoader,
        showNoItems,
      }),
      [
        isLoadingProfile,
        resolvedErrorMessage,
        showErrorState,
        showLoader,
        showNoItems,
        showProxyDisabledState,
      ]
    );

    const handlers = useMemo(
      () => ({
        handleRetry,
        handleProxyDisable,
      }),
      [handleProxyDisable, handleRetry]
    );

    const pagination = useMemo(
      () => ({
        hasNextPage: !!hasNextPage,
        fetchNextPage,
      }),
      [fetchNextPage, hasNextPage]
    );

    return {
      activeFilter,
      setActiveFilter,
      isAuthenticated,
      notificationsViewStyle,
      items,
      isFetchingNextPage,
      pagination,
      contentState,
      handlers,
      markNotificationIdsAsRead: (ids: number[]) =>
        notificationAuthScope
          ? markNotificationIdsAsRead({
              ids,
              authScope: notificationAuthScope,
            })
          : Promise.resolve(),
    };
  };
