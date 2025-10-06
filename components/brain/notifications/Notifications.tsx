"use client";

import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
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

const TOP_SCROLL_THRESHOLD_PX = 160;

interface NotificationsProps {
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (activeDrop: ActiveDropState | null) => void;
}

export default function Notifications({ activeDrop, setActiveDrop }: NotificationsProps) {
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedScrollRef = useRef(false);
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

  useSetTitle("Notifications | My Stream | Brain");

  useEffect(() => {
    if (reload === "true") {
      refetch()
        .then(() => {
          return markAllAsReadMutation.mutateAsync();
        })
        .catch((error) => {
          console.error("Error during refetch:", error);
        });
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete('reload');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : (pathname || '/my-stream/notifications');
      router.replace(newUrl, { scroll: false });
    }
  }, [reload]);

  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);

  const markAllAsReadMutation = useMutation({
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
        message: error as unknown as string,
        type: "error",
      });
    },
  });

  useEffect(() => {
    markAllAsReadMutation.mutateAsync();
  }, []);

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

  const onBottomIntersection = (state: boolean) => {
    if (!state) {
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
  };

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
    }
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      hasInitializedScrollRef.current = false;
      isPrependingRef.current = false;
      previousScrollHeightRef.current = 0;
    }
  }, [items.length]);

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

  const handleScrollUpNearTop = () => {
    onBottomIntersection(true);
  };

  const showLoader = (!isInitialQueryDone || isFetching) && items.length === 0;
  const showNoItems = isInitialQueryDone && !isFetching && items.length === 0;
  const shouldEnableInfiniteScroll = !showLoader && !showNoItems;

  const handleScroll: UIEventHandler<HTMLDivElement> = (event) => {
    if (!shouldEnableInfiniteScroll) {
      return;
    }

    const container = event.currentTarget;
    if (container.scrollTop <= TOP_SCROLL_THRESHOLD_PX) {
      if (!isFetchingNextPage && hasNextPage) {
        handleScrollUpNearTop();
      }
    }
  };

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
      className="tw-relative tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 scroll-shadow"
      style={notificationsViewStyle}>
      <div className="tw-flex-1 tw-h-full tw-relative tw-flex-col tw-flex tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        <NotificationsCauseFilter
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="tw-flex tw-flex-1 tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          {notificationsContent}
        </div>
      </div>
    </div>
  );
}
