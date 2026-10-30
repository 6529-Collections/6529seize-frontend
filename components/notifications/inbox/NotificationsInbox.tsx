"use client";

import { useContext, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import {
  getExcludedNotificationCauses,
  isNotificationVisible,
} from "@/components/brain/notifications/utils/notificationVisibility";
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import NotificationInboxRow from "./NotificationInboxRow";

const ACTION_CLASS =
  "tw-min-h-8 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-50 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white";

export default function NotificationsInbox({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, setToast } = useAuth();
  const { hasValidWalletAuth } = useSeizeConnectContext();
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
  const { reconcileProfileDeliveredNotifications } = useNotificationsContext();
  const [readError, setReadError] = useState(false);
  const handle =
    hasValidWalletAuth && !activeProfileProxy ? connectedProfile?.handle : null;
  const query = useNotificationsQuery({
    identity: handle,
    causeExclude: getExcludedNotificationCauses(hideNftPurchasing),
  });
  const notifications = query.rawItems.filter((item) =>
    isNotificationVisible(item, hideNftPurchasing)
  );
  const markRead = useMutation({
    mutationFn: async (id: number | "all") => {
      await commonApiPostWithoutBodyAndResponse({
        endpoint:
          id === "all" ? "notifications/read" : `notifications/${id}/read`,
      });
      // Browser unread counts refresh even if native badge reconciliation fails.
      invalidateNotifications();
      await reconcileProfileDeliveredNotifications();
    },
    onMutate: () => setReadError(false),
    onError: () => {
      setReadError(true);
      setToast({
        type: "error",
        title: t(locale, "notifications.inbox.readError"),
      });
    },
  });
  const openNotification = (id: number) => {
    if (notifications.find((item) => item.id === id)?.read_at === null)
      markRead.mutate(id);
    onClose();
  };
  let message: string | null = null;
  if (activeProfileProxy) message = t(locale, "notifications.inbox.proxy");
  else if (!handle) message = t(locale, "notifications.inbox.connect");
  else if (query.isPending) message = t(locale, "notifications.inbox.loading");
  else if (query.isError && notifications.length === 0)
    message = t(locale, "notifications.inbox.error");
  else if (notifications.length === 0)
    message = t(locale, "notifications.inbox.empty");

  return (
    <>
      <div className="tw-flex tw-flex-none tw-items-center tw-justify-between tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-white">
          {t(locale, "notifications.inbox.title")}
        </h2>
        <div className="tw-flex tw-items-center tw-gap-1">
          {handle && (
            <button
              type="button"
              className={ACTION_CLASS}
              disabled={markRead.isPending || !query.isSuccess}
              onClick={() => markRead.mutate("all")}
            >
              {t(
                locale,
                markRead.isPending
                  ? "notifications.inbox.marking"
                  : "notifications.inbox.markAll"
              )}
            </button>
          )}
          <button
            type="button"
            className={ACTION_CLASS}
            onClick={onClose}
            aria-label={t(locale, "notifications.inbox.close")}
          >
            <XMarkIcon aria-hidden="true" className="tw-size-5" />
          </button>
        </div>
      </div>
      <output className="tw-sr-only">
        {query.isFetchingNextPage
          ? t(locale, "notifications.inbox.loading")
          : ""}
      </output>
      <div
        className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-py-1"
        aria-busy={query.isFetching}
      >
        {readError && (
          <p role="alert" className="tw-m-0 tw-p-4 tw-text-sm tw-text-iron-200">
            {t(locale, "notifications.inbox.readError")}
          </p>
        )}
        {message ? (
          <output className="tw-block tw-p-6 tw-text-center tw-text-sm tw-text-iron-300">
            {message}
          </output>
        ) : (
          <ul className="tw-m-0 tw-list-none tw-p-0">
            {notifications.map((notification) => (
              <NotificationInboxRow
                key={notification.id}
                notification={notification}
                handle={handle ?? ""}
                onOpen={openNotification}
              />
            ))}
          </ul>
        )}
        {handle && query.isError && (
          <div className="tw-px-4 tw-py-2">
            <button
              type="button"
              className={ACTION_CLASS}
              onClick={() => {
                void query.refetch();
              }}
            >
              {t(locale, "notifications.inbox.retry")}
            </button>
          </div>
        )}
        {handle && query.hasNextPage && !query.isError && (
          <div className="tw-px-4 tw-py-2">
            <button
              type="button"
              className={ACTION_CLASS}
              disabled={query.isFetchingNextPage}
              onClick={() => {
                void query.fetchNextPage();
              }}
            >
              {t(
                locale,
                query.isFetchingNextPage
                  ? "notifications.inbox.loading"
                  : "notifications.inbox.more"
              )}
            </button>
          </div>
        )}
      </div>
      <Link
        href="/notifications"
        prefetch={false}
        onClick={onClose}
        className="focus-visible:tw-outline-inset tw-block tw-flex-none tw-rounded-b-xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-3 tw-text-center tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800"
      >
        {t(locale, "notifications.inbox.viewAll")}
      </Link>
    </>
  );
}
