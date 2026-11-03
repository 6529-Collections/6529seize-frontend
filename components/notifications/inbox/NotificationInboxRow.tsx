import Link from "next/link";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import BellIcon from "@/components/common/icons/BellIcon";
import ProfileAvatar from "@/components/common/profile/ProfileAvatar";
import LocalDateTime from "@/components/utils/time/LocalDateTime";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  isGroupedReactionsItem,
  type NotificationDisplayItem,
} from "@/types/feed.types";
import {
  getInboxDestination,
  getInboxPreview,
  getInboxSummary,
} from "./notificationInbox.helpers";

export default function NotificationInboxRow({
  notification: item,
  handle,
  onOpen,
}: {
  readonly notification: NotificationDisplayItem;
  readonly handle: string;
  readonly onOpen: (unreadIds: number[]) => void;
}) {
  const locale = useBrowserLocale();
  const group = isGroupedReactionsItem(item) ? item : null;
  const notification = isGroupedReactionsItem(item)
    ? { ...item.notifications[0]!, related_drops: [item.drop] }
    : item;
  const unreadIds = [
    ...new Set(
      (group?.notifications ?? [notification])
        .filter((entry) => entry.read_at === null)
        .map((entry) => entry.id)
    ),
  ];
  const reactors = group
    ? [
        ...new Map(
          group.notifications.map((entry) => [
            entry.related_identity.id,
            entry.related_identity,
          ])
        ).values(),
      ]
    : [];
  const identity =
    "related_identity" in notification ? notification.related_identity : null;
  const preview = getInboxPreview(notification);
  return (
    <li>
      <Link
        href={getInboxDestination(notification, handle)}
        prefetch={false}
        onClick={() => onOpen(unreadIds)}
        className="focus-visible:tw-outline-inset tw-flex tw-gap-3 tw-rounded-lg tw-px-4 tw-py-3 tw-text-left tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800"
      >
        <ProfileAvatar
          pfpUrl={group || identity?.is_anonymous ? null : identity?.pfp}
          alt=""
          fallbackContent={<BellIcon className="tw-size-5 tw-text-iron-400" />}
        />
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
            {group
              ? t(locale, "notifications.inbox.reactions")
              : getInboxSummary(notification, locale)}
          </p>
          {group && (
            <div className="tw-mt-1">
              <OverlappingAvatars
                items={reactors.map((reactor) => ({
                  key: reactor.id,
                  pfpUrl: reactor.is_anonymous ? null : reactor.pfp,
                  fallback: reactor.is_anonymous
                    ? "?"
                    : (reactor.handle?.slice(0, 2).toUpperCase() ?? "?"),
                  ariaLabel: reactor.is_anonymous
                    ? t(locale, "competitions.anonymousAuthor")
                    : (reactor.handle ??
                      t(locale, "notifications.unknownProfile")),
                }))}
                size="sm"
              />
            </div>
          )}
          {preview && (
            <p className="tw-mb-0 tw-mt-1 tw-line-clamp-2 tw-break-words tw-text-sm tw-leading-5 tw-text-iron-400">
              {preview}
            </p>
          )}
          <div className="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
            <LocalDateTime
              value={group?.createdAt ?? notification.created_at}
              format="relative"
            />
            {unreadIds.length > 0 && (
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
