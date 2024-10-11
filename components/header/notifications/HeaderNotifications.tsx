import { useEffect, useState } from "react";
import { TitleType, useAuth } from "../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { NotificationsResponse } from "../../../generated/models/NotificationsResponse";
import { commonApiFetch } from "../../../services/api/common-api";
import Link from "next/link";

export default function HeaderNotifications() {
  const { connectedProfile, setTitle } = useAuth();

  const { data: notifications } = useQuery<NotificationsResponse>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: connectedProfile?.profile?.handle, limit: "1" },
    ],
    queryFn: async () =>
      await commonApiFetch<NotificationsResponse>({
        endpoint: `notifications`,
        params: {
          limit: "1",
        },
      }),
    enabled: !!connectedProfile?.profile?.handle,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
  });

  const [haveUnreadNotifications, setHaveUnreadNotifications] = useState(
    !!notifications?.unread_count
  );

  useEffect(() => {
    const hasUnread = !!notifications?.unread_count;
    setHaveUnreadNotifications(hasUnread);

    setTitle({
      title: hasUnread
        ? `(${notifications?.unread_count}) Notifications | 6529 SEIZE`
        : null,
      type: TitleType.NOTIFICATION,
    });
  }, [notifications]);

  return (
    <div className="tailwind-scope tw-relative xl:tw-mr-3 tw-self-center">
      <Link
        href="/my-stream/notifications"
        aria-label="Notifications"
        title="Notifications"
        className="tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-h-10 tw-w-10 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out">
        <svg
          className="tw-w-5 tw-h-5 tw-flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {haveUnreadNotifications && (
          <div className="tw-absolute tw-rounded-full -tw-right-1 -tw-top-1 tw-bg-red tw-h-3 tw-w-3"></div>
        )}
      </Link>
    </div>
  );
}
