"use client";

import NotificationsLoading from "@/components/notifications/NotificationsLoading";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { NotificationDisplayItem } from "@/types/feed.types";
import type { ReactNode } from "react";
import MyStreamNoItems from "../../my-stream/layout/MyStreamNoItems";
import NotificationsWrapper from "../NotificationsWrapper";
import NotificationsStateMessage from "./NotificationsStateMessage";

interface NotificationsContentProps {
  readonly isLoadingProfile: boolean;
  readonly showProxyDisabledState: boolean;
  readonly showErrorState: boolean;
  readonly resolvedErrorMessage: string;
  readonly handleRetry: () => void;
  readonly handleProxyDisable: () => void;
  readonly showLoader: boolean;
  readonly showNoItems: boolean;
  readonly items: NotificationDisplayItem[];
  readonly loadingOlder: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (activeDrop: ActiveDropState | null) => void;
  readonly markNotificationIdsAsRead?: (ids: number[]) => Promise<void>;
}

export default function NotificationsContent({
  isLoadingProfile,
  showProxyDisabledState,
  showErrorState,
  resolvedErrorMessage,
  handleRetry,
  handleProxyDisable,
  showLoader,
  showNoItems,
  items,
  loadingOlder,
  activeDrop,
  setActiveDrop,
  markNotificationIdsAsRead,
}: NotificationsContentProps): ReactNode {
  if (isLoadingProfile) {
    return <NotificationsLoading />;
  }

  if (showProxyDisabledState) {
    return (
      <NotificationsStateMessage
        message="Notifications are not available while you are using a profile proxy."
        action={{
          label: "Switch to primary profile",
          handler: handleProxyDisable,
        }}
      />
    );
  }

  if (showErrorState) {
    return (
      <NotificationsStateMessage
        message={resolvedErrorMessage}
        action={{ label: "Try again", handler: handleRetry }}
      />
    );
  }

  if (showLoader) {
    return <NotificationsLoading />;
  }

  if (showNoItems) {
    return (
      <div className="tw-flex tw-min-h-full tw-flex-1 tw-flex-col tw-items-center tw-justify-start">
        <MyStreamNoItems />
      </div>
    );
  }

  return (
    <NotificationsWrapper
      items={items}
      loadingOlder={loadingOlder}
      activeDrop={activeDrop}
      setActiveDrop={setActiveDrop}
      {...(markNotificationIdsAsRead !== undefined && {
        markNotificationIdsAsRead,
      })}
    />
  );
}
