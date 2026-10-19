import Link from "next/link";
import type { INotificationMemeCollaboration } from "@/types/feed.types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import NotificationHeader from "./subcomponents/NotificationHeader";
import NotificationTimestamp from "./subcomponents/NotificationTimestamp";

export default function NotificationMemeCollaboration({
  notification,
}: {
  readonly notification: INotificationMemeCollaboration;
}) {
  const locale = useBrowserLocale();
  const context = notification.additional_context;
  const invited = context.event_type === "INVITED";
  const accepted = context.event_type === "ACCEPTED";
  const cancelled = context.event_type === "CANCELLED";
  const actor =
    (invited || accepted || cancelled) && notification.related_identity?.handle
      ? notification.related_identity
      : null;
  const artworkHref =
    context.wave_id && context.drop_id
      ? `/waves/${encodeURIComponent(context.wave_id)}?drop=${encodeURIComponent(context.drop_id)}`
      : null;
  const savedArtworkName = context.artwork_name?.trim();
  const artworkName =
    typeof savedArtworkName === "string" && savedArtworkName.length > 0
      ? savedArtworkName
      : t(locale, "memes.collaborations.artworkFallback");
  const message = () => {
    if (invited)
      return t(
        locale,
        actor
          ? "memes.collaborations.actorInvited"
          : "memes.collaborations.recipientInvited"
      );
    if (accepted)
      return t(
        locale,
        actor
          ? "memes.collaborations.actorAccepted"
          : "memes.collaborations.recipientAccepted"
      );
    if (cancelled)
      return t(
        locale,
        actor
          ? "memes.collaborations.actorCancelled"
          : "memes.collaborations.recipientCancelledNotification"
      );
    return t(locale, "memes.collaborations.updatedNotification");
  };
  const content = (
    <>
      <span className="tw-text-sm tw-font-normal tw-text-iron-400">
        {message()}
      </span>
      {(invited || accepted || cancelled) &&
        (artworkHref ? (
          <Link
            href={artworkHref}
            className="tw-max-w-full tw-break-words tw-rounded-sm tw-text-sm tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {artworkName}
          </Link>
        ) : (
          <span className="tw-break-words tw-text-sm tw-text-iron-200">
            {artworkName}
          </span>
        ))}
      <NotificationTimestamp createdAt={notification.created_at} />
    </>
  );
  return (
    <div className="tailwind-scope tw-min-w-0 tw-py-3">
      {actor ? (
        <NotificationHeader author={actor} align="center">
          {content}
        </NotificationHeader>
      ) : (
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-leading-6 [overflow-wrap:anywhere]">
          {content}
        </div>
      )}
    </div>
  );
}
