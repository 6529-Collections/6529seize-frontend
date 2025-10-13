"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { UIEventHandler } from "react";
import { useSetTitle } from "@/contexts/TitleContext";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import NotificationsWrapper from "./NotificationsWrapper";
import { useMutation } from "@tanstack/react-query";
import MyStreamNoItems from "../my-stream/layout/MyStreamNoItems";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { useLayout } from "../my-stream/layout/LayoutContext";
import NotificationsCauseFilter, {
  NotificationFilter,
} from "./NotificationsCauseFilter";
import SpinnerLoader from "@/components/common/SpinnerLoader";
import { NEAR_TOP_SCROLL_THRESHOLD_PX } from "../constants";

const STICK_TO_BOTTOM_SCROLL_THRESHOLD_PX = 32;
const LOAD_TIMEOUT_MS = 15000;
const DEFAULT_ERROR_MESSAGE = "Failed to load notifications. Please try again.";
const LOAD_TIMEOUT_MESSAGE =
  "Loading notifications is taking longer than expected. Please try again.";

interface NotificationsProps {
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (activeDrop: ActiveDropState | null) => void;
}

export default function Notifications({ activeDrop, setActiveDrop }: NotificationsProps) {
  const {
    connectedProfile,
    activeProfileProxy,
    fetchingProfile,
    requestAuth,
    setToast,
    setActiveProfileProxy,
  } = useContext(AuthContext);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedScrollRef = useRef(false);
  const isPinnedToBottomRef = useRef(true);
  const hasMarkedAllAsReadRef = useRef(false);
  const isPrependingRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const errorToastShownRef = useRef(false);
  const reauthTriggeredRef = useRef(false);
  const timeoutToastShownRef = useRef(false);
  const { notificationsViewStyle } = useLayout();
  const searchParams = useSearchParams();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter | null>(
    null
  );
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { removeAllDeliveredNotifications } = useNotificationsContext();

  const router = useRouter();
  const pathname = usePathname();
  const reload = searchParams?.get('reload') ?? undefined;
  const isAuthenticated = !!connectedProfile?.handle && !activeProfileProxy;
  const isLoadingProfile = fetchingProfile && !connectedProfile;
  const hasConnectedProfile = !!connectedProfile;
  const hasProfileHandle = !!connectedProfile?.handle;

  useSetTitle("Notifications | My Stream | Brain");

  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);

  const { mutateAsync: markAllAsRead } = useMutation({
    mutationFn: async () =>
      await commonApiPostWithoutBodyAndResponse({
        endpoint: `notifications/read`,
      }),
    onSuccess: async () => {
      invalidateNotifications();
      await removeAllDeliveredNotifications();
    },
    onError: (error) => {
      setToast({
        message:
          error instanceof Error ? error.message : String(error),
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
  }, [markAllAsRead, reload, isAuthenticated]);

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

  const getErrorDetails = (error: unknown) => {
    if (error instanceof Error) {
      const message = error.message?.trim() || DEFAULT_ERROR_MESSAGE;
      return {
        message,
        isUnauthorized: /unauthorized/i.test(message),
      };
    }
    if (typeof error === "string") {
      const message = error.trim() || DEFAULT_ERROR_MESSAGE;
      return {
        message,
        isUnauthorized: /unauthorized/i.test(message),
      };
    }
    return {
      message: DEFAULT_ERROR_MESSAGE,
      isUnauthorized: false,
    };
  };

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
    reload,
    refetch,
    markAllAsRead,
    searchParams,
    pathname,
    router,
    isAuthenticated,
  ]);

  const triggerFetchOlder = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }
    const container = scrollContainerRef.current;
    if (container) {
      previousScrollHeightRef.current = container.scrollHeight;
    }
    isPrependingRef.current = true;
    fetchNextPage();
  }, [isAuthenticated, isFetchingNextPage, hasNextPage, fetchNextPage]);

  useLayoutEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) {
      return;
    }

    if (items.length === 0) {
      return;
    }

    if (!hasInitializedScrollRef.current) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
      hasInitializedScrollRef.current = true;
      isPinnedToBottomRef.current = true;
    }
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      hasInitializedScrollRef.current = false;
      isPrependingRef.current = false;
      previousScrollHeightRef.current = 0;
      isPinnedToBottomRef.current = true;
    }
  }, [items.length]);

  useEffect(() => {
    hasInitializedScrollRef.current = false;
    isPinnedToBottomRef.current = true;
  }, [activeFilter?.cause]);

  useEffect(() => {
    if (!queryError) {
      setErrorMessage(null);
      errorToastShownRef.current = false;
      reauthTriggeredRef.current = false;
      return;
    }

    const { message, isUnauthorized } = getErrorDetails(queryError);
    setErrorMessage(message);
    setHasTimedOut(false);

    if (!errorToastShownRef.current) {
      setToast({ message, type: "error" });
      errorToastShownRef.current = true;
    }

    if (isUnauthorized && !reauthTriggeredRef.current) {
      requestAuth().catch((error) => {
        console.error("Failed to re-authenticate after notifications error:", error);
      });
      reauthTriggeredRef.current = true;
    }
  }, [queryError, setToast, requestAuth]);

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

    const timerId = window.setTimeout(() => {
      setHasTimedOut(true);
    }, LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    isSuccess,
    errorMessage,
    isAuthenticated,
    isInitialQueryDone,
    isLoadingProfile,
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

  useLayoutEffect(() => {
    if (!isPrependingRef.current) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      isPrependingRef.current = false;
      return;
    }

    const delta = container.scrollHeight - previousScrollHeightRef.current;
    if (delta !== 0) {
      container.scrollTop += delta;
    }

    isPrependingRef.current = false;
  }, [items]);

  const handleRetry = useCallback(() => {
    setHasTimedOut(false);
    setErrorMessage(null);
    errorToastShownRef.current = false;
    reauthTriggeredRef.current = false;
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
  const showErrorState = (errorMessage || hasTimedOut) && items.length === 0;
  const shouldEnableInfiniteScroll =
    isAuthenticated && !showLoader && !showNoItems && !showErrorState;

  const showProxyDisabledState = !!activeProfileProxy;
  const resolvedErrorMessage = hasTimedOut
    ? LOAD_TIMEOUT_MESSAGE
    : errorMessage ?? DEFAULT_ERROR_MESSAGE;

  const renderStateMessage = (
    message: string,
    action?: { label: string; handler: () => void }
  ) => (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-text-center tw-min-h-full tw-px-4 tw-py-8">
      <p className="tw-text-iron-300 tw-text-sm md:tw-text-base">{message}</p>
      {action ? (
        <button
          type="button"
          onClick={action.handler}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-500 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 desktop-hover:hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-iron-300">
          {action.label}
        </button>
      ) : null}
    </div>
  );

  useLayoutEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) {
      return;
    }

    const observationTarget =
      (scrollElement.firstElementChild as HTMLElement | null) ?? scrollElement;

    let rafId: number | null = null;

    const scheduleStickToBottom = () => {
      if (!hasInitializedScrollRef.current || !isPinnedToBottomRef.current) {
        return;
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container) {
          return;
        }

        container.scrollTop = container.scrollHeight;
        rafId = null;
      });
    };

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        scheduleStickToBottom();
      });

      resizeObserver.observe(observationTarget);

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        resizeObserver.disconnect();
      };
    }

    if (typeof MutationObserver !== "undefined") {
      const mutationObserver = new MutationObserver(() => {
        scheduleStickToBottom();
      });

      mutationObserver.observe(observationTarget, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        mutationObserver.disconnect();
      };
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [items, showLoader, showNoItems, showErrorState]);

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      const container = event.currentTarget;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom =
        distanceFromBottom <= STICK_TO_BOTTOM_SCROLL_THRESHOLD_PX;

      if (isNearBottom) {
        isPinnedToBottomRef.current = true;
      } else if (distanceFromBottom > STICK_TO_BOTTOM_SCROLL_THRESHOLD_PX) {
        isPinnedToBottomRef.current = false;
      }

      if (!shouldEnableInfiniteScroll) {
        return;
      }

      if (container.scrollTop <= NEAR_TOP_SCROLL_THRESHOLD_PX) {
        if (!isFetchingNextPage && hasNextPage) {
          triggerFetchOlder();
        }
      }
    },
    [
      shouldEnableInfiniteScroll,
      isFetchingNextPage,
      hasNextPage,
      triggerFetchOlder,
    ]
  );

  let notificationsContent = null;
  if (isLoadingProfile) {
    notificationsContent = (
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-min-h-full tw-py-8">
        <SpinnerLoader text="Loading profile..." />
      </div>
    );
  } else if (!hasConnectedProfile) {
    notificationsContent = renderStateMessage(
      "Connect your wallet to view notifications.",
      { label: "Reconnect wallet", handler: handleAuthRetry }
    );
  } else if (!hasProfileHandle) {
    notificationsContent = renderStateMessage(
      "We couldn't determine your profile handle. Please reconnect to continue.",
      { label: "Reconnect wallet", handler: handleAuthRetry }
    );
  } else if (showProxyDisabledState) {
    notificationsContent = renderStateMessage(
      "Notifications are not available while you are using a profile proxy.",
      { label: "Switch to primary profile", handler: handleProxyDisable }
    );
  } else if (showErrorState) {
    notificationsContent = renderStateMessage(resolvedErrorMessage, {
      label: "Try again",
      handler: handleRetry,
    });
  } else if (showLoader) {
    notificationsContent = (
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-min-h-full tw-py-8">
        <SpinnerLoader text="Loading notifications..." />
      </div>
    );
  } else if (showNoItems) {
    notificationsContent = (
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-start tw-min-h-full">
        <MyStreamNoItems />
      </div>
    );
  } else {
    notificationsContent = (
      <NotificationsWrapper
        items={items}
        loadingOlder={isFetchingNextPage}
        activeDrop={activeDrop}
        setActiveDrop={setActiveDrop}
      />
    );
  }

  return (
    <div
      className="tw-relative tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-x-hidden scroll-shadow"
      style={notificationsViewStyle}>
      <div className="tw-flex-1 tw-h-full tw-relative tw-flex-col tw-flex tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        {isAuthenticated ? (
          <NotificationsCauseFilter
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        ) : null}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="tw-flex tw-flex-1 tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
          style={{ WebkitOverflowScrolling: "touch" }}>
          {notificationsContent}
        </div>
      </div>
    </div>
  );
}
