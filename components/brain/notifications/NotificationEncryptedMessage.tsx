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
  const avatar = (
    <div className="tw-absolute -tw-left-[3.25rem] tw-top-0">
      <ProfileAvatar
        pfpUrl={handle ? sender?.pfp : null}
        alt=""
        fallbackContent={
          <LockClosedIcon
            aria-hidden="true"
            className="tw-size-5 tw-text-iron-400"
          />
        }
      />
    </div>
  );

  return (
    <article
      className={
        onOpen
          ? "tw-relative tw-rounded-lg tw-px-4 tw-py-3 desktop-hover:hover:tw-bg-iron-800"
          : "tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 desktop-hover:hover:tw-bg-iron-900"
      }
    >
      <div className="tw-min-h-10 tw-pl-[3.25rem]">
        <div className="tw-relative tw-break-words tw-text-sm tw-leading-6">
          {handle ? (
            <>
              <Link
                href={`/${encodeURIComponent(handle)}`}
                prefetch={false}
                className="tw-rounded-sm tw-font-semibold tw-text-iron-50 tw-no-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline [&>div]:tw-z-10"
              >
                {avatar}
                <span className="tw-relative tw-z-10">{handle}</span>
              </Link>{" "}
              <span className="tw-text-iron-400">
                {t(locale, "e2ee.notification.senderAction")}
              </span>
            </>
          ) : (
            <>
              {avatar}
              <span className="tw-font-semibold tw-text-iron-50">
                {t(locale, "e2ee.notification.newMessage")}
              </span>
            </>
          )}{" "}
          <NotificationTimestamp createdAt={notification.created_at} />
          {onOpen && notification.read_at === null && (
            <span className="tw-ml-2 tw-text-xs tw-text-primary-300">
              {t(locale, "notifications.inbox.unread")}
            </span>
          )}
        </div>
        <Link
          href={getInboxDestination(notification, "")}
          prefetch={false}
          {...(onOpen && { onClick: onOpen })}
          className="tw-mt-1 tw-block tw-break-words tw-text-sm tw-text-primary-300 after:tw-absolute after:tw-inset-0 after:tw-rounded-xl focus-visible:tw-outline-none focus-visible:after:tw-ring-2 focus-visible:after:tw-ring-inset focus-visible:after:tw-ring-primary-400"
        >
          <span className="tw-line-clamp-2">
            {preview ??
              t(
                locale,
                needsSetup
                  ? "e2ee.notification.setup"
                  : "e2ee.notification.open"
              )}
            {!preview && needsSetup && (
              <ArrowRightIcon
                aria-hidden="true"
                className="tw-ml-1 tw-inline-block tw-size-3"
              />
            )}
          </span>
        </Link>
      </div>
    </article>
  );
}
