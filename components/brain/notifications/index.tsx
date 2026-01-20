"use client";

import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useMemo } from "react";
import NotificationsCauseFilter from "./NotificationsCauseFilter";
import { useNotificationsController } from "./hooks/useNotificationsController";
import { useNotificationsScroll } from "./hooks/useNotificationsScroll";
import NotificationsContent from "./subcomponents/NotificationsContent";

interface NotificationsProps {
  readonly activeDrop: ActiveDropState | null;
  readonly setActiveDrop: (activeDrop: ActiveDropState | null) => void;
}

const NOTIFICATION_CAUSE_PRIORITY: Record<ApiNotificationCause, number> = {
  [ApiNotificationCause.IdentitySubscribed]: 0,
  [ApiNotificationCause.IdentityMentioned]: 1,
  [ApiNotificationCause.IdentityRep]: 2,
  [ApiNotificationCause.IdentityNic]: 3,
  [ApiNotificationCause.DropQuoted]: 4,
  [ApiNotificationCause.DropReplied]: 5,
  [ApiNotificationCause.DropVoted]: 6,
  [ApiNotificationCause.DropBoosted]: 7,
  [ApiNotificationCause.DropReacted]: 8,
  [ApiNotificationCause.WaveCreated]: 9,
  [ApiNotificationCause.AllDrops]: 10,
  [ApiNotificationCause.PriorityAlert]: 11,
};

const compareNotificationCause = (
  firstCause: ApiNotificationCause,
  secondCause: ApiNotificationCause
): number =>
  NOTIFICATION_CAUSE_PRIORITY[firstCause] -
  NOTIFICATION_CAUSE_PRIORITY[secondCause];

export default function Notifications({
  activeDrop,
  setActiveDrop,
}: NotificationsProps) {
  const {
    activeFilter,
    setActiveFilter,
    isAuthenticated,
    notificationsViewStyle,
    items,
    isFetchingNextPage,
    pagination,
    contentState,
    handlers,
  } = useNotificationsController();

  const activeFilterKey = useMemo(
    () =>
      activeFilter?.cause?.length
        ? [...activeFilter.cause].sort(compareNotificationCause).join("|")
        : "notifications-filter-all",
    [activeFilter]
  );

  const { scrollContainerRef, handleScroll } = useNotificationsScroll({
    items,
    isAuthenticated,
    isFetchingNextPage,
    hasNextPage: pagination.hasNextPage,
    fetchNextPage: pagination.fetchNextPage,
    showLoader: contentState.showLoader,
    showNoItems: contentState.showNoItems,
    showErrorState: contentState.showErrorState,
    activeFilterKey,
  });

  return (
    <div
      className="scroll-shadow tw-relative tw-flex tw-flex-col tw-overflow-x-hidden tw-rounded-t-xl"
      style={notificationsViewStyle}
    >
      <div className="tw-relative tw-flex tw-h-full tw-flex-1 tw-flex-col tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
        {isAuthenticated ? (
          <NotificationsCauseFilter
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        ) : null}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="tw-flex tw-flex-1 tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <NotificationsContent
            isLoadingProfile={contentState.isLoadingProfile}
            hasConnectedProfile={contentState.hasConnectedProfile}
            hasProfileHandle={contentState.hasProfileHandle}
            showProxyDisabledState={contentState.showProxyDisabledState}
            showErrorState={contentState.showErrorState}
            resolvedErrorMessage={contentState.resolvedErrorMessage}
            handleRetry={handlers.handleRetry}
            handleAuthRetry={handlers.handleAuthRetry}
            handleProxyDisable={handlers.handleProxyDisable}
            showLoader={contentState.showLoader}
            showNoItems={contentState.showNoItems}
            items={items}
            loadingOlder={isFetchingNextPage}
            activeDrop={activeDrop}
            setActiveDrop={setActiveDrop}
          />
        </div>
      </div>
    </div>
  );
}
