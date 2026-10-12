import Link from "next/link";
import type { INotificationMemeCollaboration } from "@/types/feed.types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import NotificationTimestamp from "./subcomponents/NotificationTimestamp";

export default function NotificationMemeCollaboration({
  notification,
}: {
  readonly notification: INotificationMemeCollaboration;
}) {
  const locale = useBrowserLocale();
  const context = notification.additional_context;
  let messageKey:
    | "memes.collaborations.invitedNotification"
    | "memes.collaborations.acceptedNotification"
    | "memes.collaborations.updatedNotification" =
    "memes.collaborations.updatedNotification";
  if (context.event_type === "INVITED")
    messageKey = "memes.collaborations.invitedNotification";
  if (context.event_type === "ACCEPTED")
    messageKey = "memes.collaborations.acceptedNotification";
  const artworkHref =
    context.wave_id && context.drop_id
      ? `/waves/${encodeURIComponent(context.wave_id)}?drop=${encodeURIComponent(context.drop_id)}`
      : null;
  return (
    <div className="tw-space-y-2 tw-py-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-200">
        {t(locale, messageKey)}
      </p>
      <NotificationTimestamp createdAt={notification.created_at} />
      {artworkHref && (
        <Link
          href={artworkHref}
          className="tw-rounded tw-font-semibold tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "memes.collaborations.open")}
        </Link>
      )}
    </div>
  );
}
