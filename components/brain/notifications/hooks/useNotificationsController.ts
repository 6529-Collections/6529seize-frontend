"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { TypedNotification } from "@/types/feed.types";
import type { NotificationFilter } from "../NotificationsCauseFilter";
import { useSetTitle } from "@/contexts/TitleContext";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { useLayout } from "../../my-stream/layout/LayoutContext";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import {
  DEFAULT_ERROR_MESSAGE,
  LOAD_TIMEOUT_MESSAGE,
  LOAD_TIMEOUT_MS,
} from "../utils/constants";
import { getNotificationErrorDetails } from "../utils/getNotificationErrorDetails";

interface NotificationsContentState {
  readonly isLoadingProfile: boolean;
  readonly hasConnectedProfile: boolean;
  readonly hasProfileHandle: boolean;
  readonly showProxyDisabledState: boolean;
  readonly showErrorState: boolean;
  readonly resolvedErrorMessage: string;
  readonly showLoader: boolean;
  readonly showNoItems: boolean;
}

interface NotificationsHandlers {
  readonly handleRetry: () => void;
  readonly handleAuthRetry: () => void;
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
  readonly items: TypedNotification[];
  readonly isFetchingNextPage: boolean;
  readonly pagination: NotificationsPagination;
  readonly contentState: NotificationsContentState;
  readonly handlers: NotificationsHandlers;
}

export const useNotificationsController =
  (): UseNotificationsControllerResult => {
    const {
      connectedProfile,
      activeProfileProxy,
      fetchingProfile,
      requestAuth,
      setToast,
      setActiveProfileProxy,
    } = useContext(AuthContext);
    const { notificationsViewStyle } = useLayout();
    const { removeAllDeliveredNotifications } = useNotificationsContext();
    const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const hasMarkedAllAsReadRef = useRef(false);
    const errorToastShownRef = useRef(false);
    const reauthTriggeredRef = useRef(false);
    const timeoutToastShownRef = useRef(false);
    const lastErrorMessageRef = useRef<string | null>(null);

    const [activeFilter, setActiveFilter] =
      useState<NotificationFilter | null>(null);
    const [hasTimedOut, setHasTimedOut] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const reload = searchParams?.get("reload") ?? undefined;
    const isAuthenticated = !!connectedProfile?.handle && !activeProfileProxy;
    const isLoadingProfile = fetchingProfile && !connectedProfile;
    const hasConnectedProfile = !!connectedProfile;
    const hasProfileHandle = !!connectedProfile?.handle;

    useSetTitle("Notifications | My Stream | Brain");

    const { mutateAsync: markAllAsRead } = useMutation({
      mutationFn: async () =>
        await commonApiPostWithoutBodyAndResponse({
          endpoint: `notifications/read`,
        }),
      onSuccess: async () => {
        try {
          invalidateNotifications();
          await removeAllDeliveredNotifications();
        } catch (error) {
          console.error("Failed to clear delivered notifications:", error);
        }
      },
      onError: (error) => {
        setToast({
          message: error instanceof Error ? error.message : String(error),
          type: "error",
        });
      },
    });

    useEffect(() => {
      if (!isAuthenticated) {
        return;
      }
      if (reload === "true" || hasMarkedAllAsReadRef.current) {
        return;
      }

      hasMarkedAllAsReadRef.current = true;
      markAllAsRead().catch((error) => {
        console.error("Failed to mark notifications as read:", error);
      });
    }, [isAuthenticated, markAllAsRead, reload]);

    useEffect(() => {
      if (!isAuthenticated) {
        hasMarkedAllAsReadRef.current = false;
      }
    }, [isAuthenticated]);

    const {
      items,
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
      cause: activeFilter?.cause,
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
          : pathname || "/my-stream/notifications";
        router.replace(newUrl, { scroll: false });
      };

      if (!isAuthenticated) {
        clearReloadParam();
        return;
      }

      refetch()
        .then(() => {
          hasMarkedAllAsReadRef.current = true;
          return markAllAsRead();
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
      markAllAsRead,
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
        setToast({ message, type: "error" });
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

    const handleAuthRetry = useCallback(() => {
      requestAuth().catch((error) => {
        console.error("Failed to re-authenticate:", error);
        setToast({
          message:
            error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
          type: "error",
        });
      });
    }, [requestAuth, setToast]);

    const handleProxyDisable = useCallback(() => {
      setActiveProfileProxy(null).catch((error) => {
        console.error("Failed to switch to primary profile:", error);
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Unable to switch to primary profile. Please try again.",
          type: "error",
        });
      });
    }, [setActiveProfileProxy, setToast]);

    const showLoader =
      isAuthenticated &&
      !hasTimedOut &&
      !errorMessage &&
      (!isInitialQueryDone || isFetching) &&
      items.length === 0;
    const showNoItems =
      isAuthenticated &&
      !errorMessage &&
      !hasTimedOut &&
      isInitialQueryDone &&
      !isFetching &&
      items.length === 0;
    const showErrorState = (!!errorMessage || hasTimedOut) && items.length === 0;
    const showProxyDisabledState = !!activeProfileProxy;
    const resolvedErrorMessage = hasTimedOut
      ? LOAD_TIMEOUT_MESSAGE
      : errorMessage ?? DEFAULT_ERROR_MESSAGE;

    const contentState = useMemo<NotificationsContentState>(
      () => ({
        isLoadingProfile,
        hasConnectedProfile,
        hasProfileHandle,
        showProxyDisabledState,
        showErrorState,
        resolvedErrorMessage,
        showLoader,
        showNoItems,
      }),
      [
        hasConnectedProfile,
        hasProfileHandle,
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
        handleAuthRetry,
        handleProxyDisable,
      }),
      [handleAuthRetry, handleProxyDisable, handleRetry]
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
    };
  };
