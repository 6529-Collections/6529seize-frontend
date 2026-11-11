import Link from "next/link";
import { MessageMarkdown } from "@/components/markdown/MessageMarkdown";
import NotificationEncryptedMessage from "@/components/brain/notifications/NotificationEncryptedMessage";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import BellIcon from "@/components/common/icons/BellIcon";
import ProfileAvatar from "@/components/common/profile/ProfileAvatar";
import ArtworkNotificationThumbnail from "@/components/notifications/ArtworkNotificationThumbnail";
import LocalDateTime from "@/components/utils/time/LocalDateTime";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  isGroupedReactionsItem,
  type NotificationDisplayItem,
} from "@/types/feed.types";
import NotificationInboxReactions from "./NotificationInboxReactions";
import {
  getInboxDestination,
  getInboxDrop,
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
  if (notification.cause === ApiNotificationCause.E2EeMessage) {
    return (
      <li>
        <NotificationEncryptedMessage
          notification={notification}
          onOpen={() => onOpen(unreadIds)}
        />
      </li>
    );
  }
  const reactors = group
    ? [
        ...new Map(
          group.notifications.map(({ related_identity: profile }) => {
            // The profile API enforces unique, case-insensitive handles.
            // Grouped API snapshots can identify the same reactor by profile ID
            // or by handle, so prefer the handle shared by both representations.
            const normalizedHandle = profile.handle?.trim().toLowerCase();
            const key = normalizedHandle
              ? `handle:${normalizedHandle}`
              : `id:${profile.id}`;
            return [key, profile] as const;
          })
        ).values(),
      ]
    : [];
  const identity =
    "related_identity" in notification ? notification.related_identity : null;
  let pfpUrl = identity?.is_anonymous ? null : identity?.pfp;
  if (group) {
    pfpUrl = group.drop.wave.picture;
  } else if (
    notification.cause === ApiNotificationCause.VotingCreditsReturned
  ) {
    pfpUrl = notification.related_wave?.pfp;
  }
  const preview = getInboxPreview(notification);
  const previewIsTitle = typeof getInboxDrop(notification)?.title === "string";
  let reactions: string[] = [];
  if (group) {
    reactions = group.notifications.map(
      (entry) => entry.additional_context.reaction
    );
  } else if (notification.cause === ApiNotificationCause.DropReacted) {
    reactions = [notification.additional_context.reaction];
  }
  return (
    <li>
      <Link
        href={getInboxDestination(notification, handle)}
        prefetch={false}
        onClick={() => onOpen(unreadIds)}
        className="focus-visible:tw-outline-inset tw-flex tw-gap-3 tw-rounded-lg tw-px-4 tw-py-3 tw-text-left tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800"
      >
        {notification.cause === ApiNotificationCause.ArtistArtworkSubmitted ? (
          <ArtworkNotificationThumbnail notification={notification} />
        ) : (
          <ProfileAvatar
            pfpUrl={pfpUrl}
            alt=""
            fallbackContent={
              <BellIcon className="tw-size-5 tw-text-iron-400" />
            }
          />
        )}
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
            {group
              ? t(locale, "notifications.inbox.reactions")
              : getInboxSummary(notification, locale)}
          </p>
          {reactions.length > 0 && (
            <NotificationInboxReactions reactions={reactions} />
          )}
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
            <div className="tw-mt-1 tw-break-words tw-text-sm tw-leading-5 tw-text-iron-400 [&_*]:!tw-text-inherit">
              {previewIsTitle ? (
                <p className="tw-m-0 tw-line-clamp-2 tw-max-h-10 tw-overflow-hidden">
                  {preview}
                </p>
              ) : (
                <MessageMarkdown
                  text={preview}
                  privacy="public"
                  preview
                  messageId={`notification-${notification.id}`}
                />
              )}
            </div>
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
