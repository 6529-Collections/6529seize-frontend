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
  return (
    <div className="tw-space-y-2 tw-py-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-200">
        {t(
          locale,
          context.event_type === "INVITED"
            ? "memes.collaborations.invitedNotification"
            : "memes.collaborations.acceptedNotification"
        )}{" "}
        <NotificationTimestamp createdAt={notification.created_at} />
      </p>
      <Link
        href={`/waves/${encodeURIComponent(context.wave_id)}?drop=${encodeURIComponent(context.drop_id)}`}
        className="tw-rounded tw-font-semibold tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "memes.collaborations.open")}
      </Link>
    </div>
  );
}
