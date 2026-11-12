import Link from "next/link";
import { ArrowRightIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import ProfileNameWithAiMarker from "@/components/common/profile/ProfileNameWithAiMarker";
import { getInboxDestination } from "@/components/notifications/inbox/notificationInbox.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import { useEncryptedNotificationPreview } from "@/hooks/e2ee/useEncryptedNotificationPreview";
import NotificationMarkdownPreview from "@/components/notifications/NotificationMarkdownPreview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
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
  const identity = notification.related_identity;
  const sender = identity?.handle && !identity.is_anonymous ? identity : null;
  const newMessageLabel = t(locale, "e2ee.notification.newMessage");
  const actionLabel = t(
    locale,
    needsSetup ? "e2ee.notification.setup" : "e2ee.notification.open"
  );
  const avatar = (
    <ProfileAvatar
      pfpUrl={sender?.pfp}
      size={ProfileBadgeSize.COMPACT}
      alt=""
      fallbackContent={
        <LockClosedIcon
          aria-hidden="true"
          className="tw-size-4 tw-text-iron-400"
        />
      }
    />
  );

  return (
    <article
      className={
        onOpen
          ? "tw-relative tw-rounded-lg tw-px-4 tw-py-3 desktop-hover:hover:tw-bg-iron-800"
          : "tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-3 desktop-hover:hover:tw-bg-iron-900"
      }
    >
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-sm tw-leading-5">
        {sender?.handle ? (
          <>
            <Link
              href={`/${encodeURIComponent(sender.handle)}`}
              prefetch={false}
              className="tw-relative tw-z-10 tw-inline-flex tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-sm tw-font-semibold tw-text-iron-50 tw-no-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline"
            >
              {avatar}
              <ProfileNameWithAiMarker
                classification={sender.classification}
                className="tw-min-w-0 tw-truncate"
              >
                {sender.handle}
              </ProfileNameWithAiMarker>
            </Link>
            {Number.isFinite(sender.level) && (
              <span
                className="tw-inline-flex tw-shrink-0"
                role="img"
                aria-label={t(locale, "e2ee.profile.level", {
                  level: formatInteger(locale, sender.level),
                })}
              >
                <UserCICAndLevel
                  level={sender.level}
                  size={UserCICAndLevelSize.SMALL}
                />
              </span>
            )}
            <DropAuthorBadges
              profile={sender}
              size="compact"
              className="tw-relative tw-z-10 tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1"
              tooltipIdPrefix={`encrypted-notification-${notification.id}`}
            />
          </>
        ) : (
          <>
            {avatar}
            <span className="tw-min-w-0 tw-break-words tw-font-semibold tw-text-iron-50">
              {newMessageLabel}
            </span>
          </>
        )}
        <NotificationTimestamp createdAt={notification.created_at} />
        {onOpen && notification.read_at === null && (
          <span className="tw-shrink-0 tw-text-xs tw-text-primary-300">
            {t(locale, "notifications.inbox.unread")}
          </span>
        )}
      </div>
      <Link
        href={getInboxDestination(notification, "")}
        prefetch={false}
        {...(onOpen && { onClick: onOpen })}
        className={`tw-ml-10 tw-flex tw-items-start tw-gap-1.5 tw-break-words tw-text-sm tw-leading-5 tw-no-underline after:tw-absolute after:tw-inset-0 after:tw-rounded-xl focus-visible:tw-outline-none focus-visible:after:tw-ring-2 focus-visible:after:tw-ring-inset focus-visible:after:tw-ring-primary-400 desktop-hover:hover:tw-underline ${preview ? "tw-text-iron-200" : "tw-text-primary-300"}`}
      >
        {sender && (
          <LockClosedIcon
            aria-hidden="true"
            className="tw-mt-0.5 tw-size-4 tw-shrink-0 tw-text-iron-400"
          />
        )}
        <div className="tw-line-clamp-2 tw-max-h-10 tw-min-w-0 tw-overflow-hidden">
          {preview ? (
            <>
              {sender && <span className="tw-sr-only">{newMessageLabel} </span>}
              <NotificationMarkdownPreview
                text={preview}
                messageId={`notification-${notification.id}`}
              />
            </>
          ) : (
            actionLabel
          )}
          {!preview && needsSetup && (
            <ArrowRightIcon
              aria-hidden="true"
              className="tw-ml-1 tw-inline-block tw-size-3"
            />
          )}
        </div>
      </Link>
    </article>
  );
}
