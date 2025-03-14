import HeaderUserConnected from "./HeaderUserConnected";
import HeaderUserConnect from "./HeaderUserConnect";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import { useEffect } from "react";
import { useNotificationsContext } from "../../notifications/NotificationsContext";

export default function HeaderUser() {
  const { address } = useSeizeConnectContext();

  const { removeAllDeliveredNotifications } = useNotificationsContext();

  useEffect(() => {
    if (!address) {
      removeAllDeliveredNotifications();
    }
  }, [address]);

  return (
    <div className="tailwind-scope">
      {address ? (
        <HeaderUserConnected connectedAddress={address} />
      ) : (
        <div className="tw-mx-3">
          <HeaderUserConnect />
        </div>
      )}
    </div>
  );
}
