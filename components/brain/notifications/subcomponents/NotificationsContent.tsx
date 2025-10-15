"use client";

import type { ReactNode } from "react";
import MyStreamNoItems from "../../my-stream/layout/MyStreamNoItems";
import NotificationsWrapper from "../NotificationsWrapper";
import SpinnerLoader from "@/components/common/SpinnerLoader";
import type { TypedNotification } from "@/types/feed.types";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import NotificationsStateMessage from "./NotificationsStateMessage";

interface NotificationsContentProps {
  readonly isLoadingProfile: boolean;
  readonly hasConnectedProfile: boolean;
  readonly hasProfileHandle: boolean;
  readonly showProxyDisabledState: boolean;
  readonly showErrorState: boolean;
  readonly resolvedErrorMessage: string;
  readonly handleRetry: () => void;
  readonly handleAuthRetry: () => void;
  readonly handleProxyDisable: () => void;
  readonly showLoader: boolean;
  readonly showNoItems: boolean;
  readonly items: TypedNotification[];
  readonly loadingOlder: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (activeDrop: ActiveDropState | null) => void;
}

export default function NotificationsContent({
  isLoadingProfile,
  hasConnectedProfile,
  hasProfileHandle,
  showProxyDisabledState,
  showErrorState,
  resolvedErrorMessage,
  handleRetry,
  handleAuthRetry,
  handleProxyDisable,
  showLoader,
  showNoItems,
  items,
  loadingOlder,
  activeDrop,
  setActiveDrop,
}: NotificationsContentProps): ReactNode {
  if (isLoadingProfile) {
    return (
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-min-h-full tw-py-8">
        <SpinnerLoader text="Loading profile..." />
      </div>
    );
  }

  if (!hasConnectedProfile) {
    return (
      <NotificationsStateMessage
        message="Connect your wallet to view notifications."
        action={{ label: "Reconnect wallet", handler: handleAuthRetry }}
      />
    );
  }

  if (!hasProfileHandle) {
    return (
      <NotificationsStateMessage
        message="We couldn't determine your profile handle. Please reconnect to continue."
        action={{ label: "Reconnect wallet", handler: handleAuthRetry }}
      />
    );
  }

  if (showProxyDisabledState) {
    return (
      <NotificationsStateMessage
        message="Notifications are not available while you are using a profile proxy."
        action={{ label: "Switch to primary profile", handler: handleProxyDisable }}
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
    return (
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-min-h-full tw-py-8">
        <SpinnerLoader text="Loading notifications..." />
      </div>
    );
  }

  if (showNoItems) {
    return (
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-start tw-min-h-full">
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
    />
  );
}
