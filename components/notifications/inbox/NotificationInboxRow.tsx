import Link from "next/link";
import BellIcon from "@/components/common/icons/BellIcon";
import ProfileAvatar from "@/components/common/profile/ProfileAvatar";
import LocalDateTime from "@/components/utils/time/LocalDateTime";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { TypedNotification } from "@/types/feed.types";
import {
  getInboxDestination,
  getInboxDrop,
  getInboxSummary,
} from "./notificationInbox.helpers";

export default function NotificationInboxRow({
  notification,
  handle,
  onOpen,
}: {
  readonly notification: TypedNotification;
  readonly handle: string;
  readonly onOpen: (id: number) => void;
}) {
  const locale = useBrowserLocale();
  const identity =
    "related_identity" in notification ? notification.related_identity : null;
  const drop = getInboxDrop(notification);
  const preview =
    drop?.title ??
    drop?.parts
      .map((part) => part.content ?? "")
      .join(" ")
      .trim();
  return (
    <li>
      <Link
        href={getInboxDestination(notification, handle)}
        prefetch={false}
        onClick={() => onOpen(notification.id)}
        className="focus-visible:tw-outline-inset tw-flex tw-gap-3 tw-rounded-lg tw-px-4 tw-py-3 tw-text-left tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800"
      >
        <ProfileAvatar
          pfpUrl={identity?.is_anonymous ? null : identity?.pfp}
          alt=""
          fallbackContent={<BellIcon className="tw-size-5 tw-text-iron-400" />}
        />
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
            {getInboxSummary(notification, locale)}
          </p>
          {preview && (
            <p className="tw-mb-0 tw-mt-1 tw-line-clamp-2 tw-break-words tw-text-sm tw-leading-5 tw-text-iron-400">
              {preview.slice(0, 240)}
            </p>
          )}
          <div className="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
            <LocalDateTime value={notification.created_at} format="relative" />
            {notification.read_at === null && (
              <span className="tw-flex tw-items-center tw-gap-1 tw-text-primary-300">
                <span
                  aria-hidden="true"
                  className="tw-size-1.5 tw-rounded-full tw-bg-primary-400"
                />
                {t(locale, "notifications.inbox.unread")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
