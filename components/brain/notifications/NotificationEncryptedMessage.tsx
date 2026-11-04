import Link from "next/link";
import { ArrowRightIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import ProfileAvatar from "@/components/common/profile/ProfileAvatar";
import { getInboxDestination } from "@/components/notifications/inbox/notificationInbox.helpers";
import { useEncryptedNotificationPreview } from "@/hooks/e2ee/useEncryptedNotificationPreview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { INotificationEncryptedMessage } from "@/types/feed.types";
import NotificationTimestamp from "./subcomponents/NotificationTimestamp";

export default function NotificationEncryptedMessage({
  notification,
  onOpen,
}: {
  readonly notification: INotificationEncryptedMessage;
  readonly onOpen?: () => void;
}) {
  const locale = useBrowserLocale();
  const { preview, needsSetup } = useEncryptedNotificationPreview(
    notification.additional_context.encrypted_group ?? null,
    notification.additional_context.encrypted_message_seq
  );
  const sender = notification.related_identity;
  const handle = sender?.is_anonymous ? null : sender?.handle;
  const fallbackAvatar = (
    <LockClosedIcon aria-hidden="true" className="tw-size-5 tw-text-iron-400" />
  );

  return (
    <article
      className={
        onOpen
          ? "tw-relative tw-rounded-lg tw-px-4 tw-py-3 desktop-hover:hover:tw-bg-iron-800"
          : "tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 desktop-hover:hover:tw-bg-iron-900"
      }
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-font-semibold tw-text-iron-50">
        {handle ? (
          <>
            <Link
              href={`/${encodeURIComponent(handle)}`}
              prefetch={false}
              className="tw-relative tw-z-10 tw-inline-flex tw-items-center tw-gap-3 tw-rounded tw-text-inherit hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              <ProfileAvatar
                pfpUrl={sender?.pfp}
                alt=""
                fallbackContent={fallbackAvatar}
              />
              <span>{handle}</span>
            </Link>
            <span>{t(locale, "e2ee.notification.senderAction")}</span>
          </>
        ) : (
          <>
            <ProfileAvatar
              pfpUrl={null}
              alt=""
              fallbackContent={fallbackAvatar}
            />
            <span>{t(locale, "e2ee.notification.newMessage")}</span>
          </>
        )}
        <NotificationTimestamp createdAt={notification.created_at} />
        {onOpen && notification.read_at === null && (
          <span className="tw-text-xs tw-text-primary-300">
            {t(locale, "notifications.inbox.unread")}
          </span>
        )}
      </div>
      <Link
        href={getInboxDestination(notification, "")}
        prefetch={false}
        {...(onOpen && { onClick: onOpen })}
        className="tw-ml-[3.25rem] tw-mt-1 tw-block tw-break-words tw-text-sm tw-text-primary-300 after:tw-absolute after:tw-inset-0 after:tw-rounded-xl focus-visible:tw-outline-none focus-visible:after:tw-ring-2 focus-visible:after:tw-ring-inset focus-visible:after:tw-ring-primary-400"
      >
        <span className="tw-line-clamp-2">
          {preview ??
            t(
              locale,
              needsSetup ? "e2ee.notification.setup" : "e2ee.notification.open"
            )}
          {!preview && needsSetup && (
            <ArrowRightIcon
              aria-hidden="true"
              className="tw-ml-1 tw-inline-block tw-size-3"
            />
          )}
        </span>
      </Link>
    </article>
  );
}
