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
import useCapacitor from "../../../hooks/useCapacitor";
import { useNotificationsContext } from "../../notifications/NotificationsContext";

export default function Notifications() {
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const capacitor = useCapacitor();

  const { removeAllDeliveredNotifications } = useNotificationsContext();

  const containerClassName =
    `tw-relative tw-flex tw-flex-col tw-h-[calc(100vh-9.5rem)] lg:tw-h-[calc(100vh-6.625rem)] min-[1200px]:tw-h-[calc(100vh-7.375rem)] ${
      capacitor.platform === "ios"
        ? "tw-pb-[calc(4rem+88px)]"
        : capacitor.platform === "android"
        ? "tw-pb-[70px]"
        : ""
    }` as const;

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
  } = useNotificationsQuery({
    identity: connectedProfile?.profile?.handle,
    activeProfileProxy: !!activeProfileProxy,
    limit: "30",
    reverse: true,
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

  return (
    <div className={containerClassName}>
      <div className="tw-flex-1 tw-h-full tw-relative tw-flex-col tw-flex">
        {!items.length && !isFetching ? (
          <MyStreamNoItems />
        ) : (
          <FeedScrollContainer
            ref={scrollRef}
            onScrollUpNearTop={handleScrollUpNearTop}
            isFetchingNextPage={isFetching}>
            <NotificationsWrapper
              items={items}
              loading={isFetching}
              activeDrop={activeDrop}
              setActiveDrop={setActiveDrop}
            />
          </FeedScrollContainer>
        )}
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
