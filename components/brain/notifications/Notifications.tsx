import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../react-query-wrapper/ReactQueryWrapper";
import {
  commonApiFetch,
  commonApiPostWithoutBodyAndResponse,
} from "../../../services/api/common-api";
import NotificationsWrapper from "./NotificationsWrapper";
import {
  TypedNotification,
  TypedNotificationsResponse,
} from "../../../types/feed.types";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import MyStreamNoItems from "../my-stream/layout/MyStreamNoItems";
import { useRouter } from "next/router";
import useCapacitor from "../../../hooks/useCapacitor";

export default function Notifications() {
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const capacitor = useCapacitor();

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
        endpoint: `notifications/all/read`,
      }),
    onSuccess: () => {
      invalidateNotifications();
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
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: connectedProfile?.profile?.handle, limit: "10" },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: "10",
      };
      if (pageParam) {
        params.id_less_than = `${pageParam}`;
      }
      return await commonApiFetch<TypedNotificationsResponse>({
        endpoint: `notifications`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.notifications.at(-1)?.id ?? null,
    enabled: !!connectedProfile?.profile?.handle && !activeProfileProxy,
  });

  const [items, setItems] = useState<TypedNotification[]>([]);

  useEffect(() => {
    setItems(data?.pages?.flatMap((page) => page.notifications.flat()) ?? []);
  }, [data]);

  const onBottomIntersection = (state: boolean) => {
    if (!state) {
      return;
    }
    if (status === "pending") {
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

  const containerClassName = `lg:tw-pr-2 tw-flex-1 tw-flex tw-flex-col tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 
    tw-h-[calc(100vh-9.5rem)] lg:tw-h-[calc(100vh-6rem)] xl:tw-h-[calc(100vh-7rem)] ${
    capacitor.isCapacitor ? "tw-pb-[calc(4rem+88px)]" : ""
  }`;

  return (
    <div className={containerClassName}>
      {!items.length && !isFetching ? (
        <MyStreamNoItems />
      ) : (
        <>
          <div>
            <NotificationsWrapper
              items={items}
              loading={isFetching}
              onBottomIntersection={onBottomIntersection}
            />
          </div>{" "}
        </>
      )}
    </div>
  );
}
