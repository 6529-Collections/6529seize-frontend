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

interface NotificationsProps {
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (activeDrop: ActiveDropState | null) => void;
}

export default function Notifications({ activeDrop, setActiveDrop }: NotificationsProps) {
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedScrollRef = useRef(false);
  const isPinnedToBottomRef = useRef(true);
  const hasMarkedAllAsReadRef = useRef(false);
  const isPrependingRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const { notificationsViewStyle } = useLayout();
  const searchParams = useSearchParams();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter | null>(
    null
  );

  const { removeAllDeliveredNotifications } = useNotificationsContext();

  const router = useRouter();
  const pathname = usePathname();
  const reload = searchParams?.get('reload') ?? undefined;

  useSetTitle("Notifications | Brain");

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
    if (reload === "true" || hasMarkedAllAsReadRef.current) {
      return;
    }

    hasMarkedAllAsReadRef.current = true;
    markAllAsRead().catch((error) => {
      console.error("Failed to mark notifications as read:", error);
    });
  }, [markAllAsRead, reload]);

  const {
    items,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isInitialQueryDone,
  } = useNotificationsQuery({
    identity: connectedProfile?.handle,
    activeProfileProxy: !!activeProfileProxy,
    limit: "30",
    reverse: true,
    cause: activeFilter?.cause,
  });

  useEffect(() => {
    if (reload === "true") {
      refetch()
        .then(() => {
          hasMarkedAllAsReadRef.current = true;
          return markAllAsRead();
        })
        .catch((error) => {
          console.error("Error during refetch:", error);
        });
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("reload");
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname || "/notifications";
      router.replace(newUrl, { scroll: false });
    }
  }, [reload, refetch, markAllAsRead, searchParams, pathname, router]);

  const triggerFetchOlder = useCallback(() => {
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
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

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

  const showLoader = (!isInitialQueryDone || isFetching) && items.length === 0;
  const showNoItems = isInitialQueryDone && !isFetching && items.length === 0;
  const shouldEnableInfiniteScroll = !showLoader && !showNoItems;

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
  }, [items, showLoader, showNoItems]);

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
  if (showLoader) {
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
        <NotificationsCauseFilter
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
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
