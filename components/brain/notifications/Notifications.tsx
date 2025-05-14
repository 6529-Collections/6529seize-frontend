import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "../../../services/api/common-api";
import NotificationsWrapper from "./NotificationsWrapper";
import { useMutation } from "@tanstack/react-query";
import MyStreamNoItems from "../my-stream/layout/MyStreamNoItems";
import { useRouter } from "next/router";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import BrainContentInput from "../content/input/BrainContentInput";
import { FeedScrollContainer } from "../feed/FeedScrollContainer";
import { useNotificationsQuery } from "../../../hooks/useNotificationsQuery";
import { useNotificationsContext } from "../../notifications/NotificationsContext";
import { useLayout } from "../my-stream/layout/LayoutContext";
import NotificationsCauseFilter, {
  NotificationFilter,
} from "./NotificationsCauseFilter";

export default function Notifications() {
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { notificationsViewStyle } = useLayout();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter | null>(
    null
  );

  const { removeAllDeliveredNotifications } = useNotificationsContext();

  const router = useRouter();
  const { reload } = router.query;

  useEffect(() => {
    if (reload === "true") {
      refetch()
        .then(() => {
          return markAllAsReadMutation.mutateAsync();
        })
        .catch((error) => {
          console.error("Error during refetch:", error);
        });
      const { reload, ...restQuery } = router.query;
      router.replace(
        {
          pathname: router.pathname,
          query: restQuery,
        },
        undefined,
        { shallow: true }
      );
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

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  const showLoader = (!isInitialQueryDone || isFetching) && items.length === 0;
  const showNoItems = isInitialQueryDone && !isFetching && items.length === 0;

  let mainContent: JSX.Element;

  if (showLoader) {
    mainContent = (
      <div className="tw-w-full tw-py-8">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3">
          <div className="tw-animate-spin">
            <svg
              className="tw-w-8 tw-h-8 tw-text-iron-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="tw-opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="tw-opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div className="tw-text-iron-400 tw-text-sm">Loading notifications...</div>
        </div>
      </div>
    );
  } else if (showNoItems) {
    mainContent = <MyStreamNoItems />;
  } else {
    mainContent = (
      <FeedScrollContainer
        ref={scrollRef}
        onScrollUpNearTop={handleScrollUpNearTop}
        isFetchingNextPage={isFetching}
      >
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
      style={notificationsViewStyle}
    >
      <div className="tw-flex-1 tw-h-full tw-relative tw-flex-col tw-flex tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        <NotificationsCauseFilter
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
        {mainContent}
        <div className="tw-sticky tw-bottom-0 tw-z-[60] tw-bg-black tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
          <BrainContentInput
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
          />
        </div>
      </div>
    </div>
  );
}
