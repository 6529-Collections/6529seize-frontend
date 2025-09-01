"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useSetTitle } from "../../../contexts/TitleContext";
import { AuthContext } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "../../../services/api/common-api";
import NotificationsWrapper from "./NotificationsWrapper";
import { useMutation } from "@tanstack/react-query";
import MyStreamNoItems from "../my-stream/layout/MyStreamNoItems";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { FeedScrollContainer } from "../feed/FeedScrollContainer";
import { useNotificationsQuery } from "../../../hooks/useNotificationsQuery";
import { useNotificationsContext } from "../../notifications/NotificationsContext";
import { useLayout } from "../my-stream/layout/LayoutContext";
import NotificationsCauseFilter, {
  NotificationFilter,
} from "./NotificationsCauseFilter";
import SpinnerLoader from "../../common/SpinnerLoader";

interface NotificationsProps {
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (activeDrop: ActiveDropState | null) => void;
}

export default function Notifications({ activeDrop, setActiveDrop }: NotificationsProps) {
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const scrollRef = useRef<HTMLDivElement>(null);
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
    if (isFetching) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }
    fetchNextPage();
  };

  const handleScrollUpNearTop = () => {
    onBottomIntersection(true);
  };

  const showLoader = (!isInitialQueryDone || isFetching) && items.length === 0;
  const showNoItems = isInitialQueryDone && !isFetching && items.length === 0;

  let mainContent: React.ReactNode;

  if (showLoader) {
    mainContent = <SpinnerLoader text="Loading notifications..." />;
  } else if (showNoItems) {
    mainContent = <MyStreamNoItems />;
  } else {
    mainContent = (
      <FeedScrollContainer
        ref={scrollRef}
        onScrollUpNearTop={handleScrollUpNearTop}
        isFetchingNextPage={isFetching}>
        <NotificationsWrapper
          items={items}
          loading={isFetching && items.length > 0}
          activeDrop={activeDrop}
          setActiveDrop={setActiveDrop}
        />
      </FeedScrollContainer>
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
        {mainContent}
      </div>
    </div>
  );
}
