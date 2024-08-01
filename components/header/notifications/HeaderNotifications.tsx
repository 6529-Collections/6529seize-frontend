import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { NotificationsResponse } from "../../../generated/models/NotificationsResponse";
import { commonApiFetch } from "../../../services/api/common-api";
import Link from "next/link";

export default function HeaderNotifications() {
  const { connectedProfile } = useContext(AuthContext);

  const { data: notifications } = useQuery<NotificationsResponse>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: connectedProfile?.profile?.handle },
    ],
    queryFn: async () =>
      await commonApiFetch<NotificationsResponse>({
        endpoint: `notifications`,
        params: {
          limit: "1",
        },
      }),
    enabled: !!connectedProfile?.profile?.handle,
  });

  const [haveUnreadNotifications, setHaveUnreadNotifications] = useState(
    !!notifications?.unread_count
  );

  useEffect(() => {
    setHaveUnreadNotifications(!!notifications?.unread_count);
  }, [notifications]);

  return (
    <div className="tailwind-scope tw-relative">
      <Link
        href="/my-stream"
        aria-label="Notifications"
        title="Notifications"
        className="tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-h-11 tw-w-11 tw-border tw-border-solid tw-border-iron-700 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-w-5 tw-h-5 tw-flex-shrink-0"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.35419 21C10.0593 21.6224 10.9856 22 12 22C13.0145 22 13.9407 21.6224 14.6458 21M18 8C18 6.4087 17.3679 4.88258 16.2427 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.8826 2.63214 7.75738 3.75736C6.63216 4.88258 6.00002 6.4087 6.00002 8C6.00002 11.0902 5.22049 13.206 4.34968 14.6054C3.61515 15.7859 3.24788 16.3761 3.26134 16.5408C3.27626 16.7231 3.31488 16.7926 3.46179 16.9016C3.59448 17 4.19261 17 5.38887 17H18.6112C19.8074 17 20.4056 17 20.5382 16.9016C20.6852 16.7926 20.7238 16.7231 20.7387 16.5408C20.7522 16.3761 20.3849 15.7859 19.6504 14.6054C18.7795 13.206 18 11.0902 18 8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {haveUnreadNotifications && (
          <div className="tw-absolute tw-rounded-full -tw-right-1 -tw-top-1 tw-bg-red tw-h-3 tw-w-3"></div>
        )}
      </Link>
    </div>
  );
}
