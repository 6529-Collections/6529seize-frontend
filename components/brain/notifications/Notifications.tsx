import { useContext } from "react";
import { AuthContext } from "../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { NotificationsResponse } from "../../../generated/models/NotificationsResponse";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";

export default function Notifications() {
  const { connectedProfile } = useContext(AuthContext);

  const { data: notifications } = useQuery<NotificationsResponse>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: connectedProfile?.profile?.handle },
    ],
    queryFn: async () =>
      await commonApiFetch<NotificationsResponse>({
        endpoint: `notifications`,
      }),
    enabled: !!connectedProfile?.profile?.handle,
  });

  return (
    <div className="md:tw-w-[672px] tw-flex-shrink-0">
      <div>
        <h1 className="tw-relative tw-z-10 tw-block tw-float-none tw-text-4xl">
          Notifications
        </h1>
        <div className="tw-mt-6">{notifications?.unread_count}</div>
      </div>
    </div>
  );
}
