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

export default function Notifications() {
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);

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

  return (
    <div className="md:tw-w-[672px] tw-flex-shrink-0">
      <div>
        {!items.length && !isFetching ? (
          <div className="tw-mt-20">
            <MyStreamNoItems />
          </div>
        ) : (
          <>
            <div className="tw-mt-8">
              <NotificationsWrapper
                items={items}
                loading={isFetching}
                onBottomIntersection={onBottomIntersection}
              />
            </div>{" "}
          </>
        )}
      </div>
    </div>
  );
}
