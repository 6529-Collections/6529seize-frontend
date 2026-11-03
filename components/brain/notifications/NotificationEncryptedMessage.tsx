import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { getInboxDestination } from "@/components/notifications/inbox/notificationInbox.helpers";
import { useEncryptedNotificationPreview } from "@/hooks/e2ee/useEncryptedNotificationPreview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { INotificationEncryptedMessage } from "@/types/feed.types";
import NotificationTimestamp from "./subcomponents/NotificationTimestamp";

export default function NotificationEncryptedMessage({
  notification,
}: {
  readonly notification: INotificationEncryptedMessage;
}) {
  const locale = useBrowserLocale();
  const preview = useEncryptedNotificationPreview(
    notification.additional_context.encrypted_group ?? null
  );
  return (
    <article className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <LockClosedIcon
          aria-hidden="true"
          className="tw-size-5 tw-shrink-0 tw-text-iron-300"
        />
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {t(locale, "e2ee.notification.newMessage")}
            </h3>
            <NotificationTimestamp createdAt={notification.created_at} />
          </div>
          <p className="tw-mt-2 tw-line-clamp-2 tw-break-words tw-text-sm tw-text-iron-300">
            {preview ?? t(locale, "e2ee.notification.locked")}
          </p>
          <Link
            href={getInboxDestination(notification, "")}
            prefetch={false}
            className="tw-text-sm tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "e2ee.notification.open")}
          </Link>
        </div>
      </div>
    </article>
  );
}
