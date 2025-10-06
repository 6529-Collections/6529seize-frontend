"use client";

import HeaderUserConnected from "./HeaderUserConnected";
import HeaderUserConnect from "./HeaderUserConnect";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useEffect } from "react";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";

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
