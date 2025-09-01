"use client";

import MyStreamLayout from "@/components/brain/my-stream/layout/MyStreamLayout";
import Notifications from "@/components/brain/notifications/NotificationsContainer";

export default function NotificationsPageClient() {
  return (
    <MyStreamLayout>
      <div className="tailwind-scope tw-flex-1">
        <Notifications />
      </div>
    </MyStreamLayout>
  );
}