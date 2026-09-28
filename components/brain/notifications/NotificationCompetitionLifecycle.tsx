import Link from "next/link";
import type { INotificationCompetitionLifecycle } from "@/types/feed.types";
import { getCompetitionRoute } from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import NotificationTimestamp from "./subcomponents/NotificationTimestamp";

export default function NotificationCompetitionLifecycle({
  notification,
}: {
  readonly notification: INotificationCompetitionLifecycle;
}) {
  const locale = useBrowserLocale();
  const context = notification.additional_context;
  const label = getEventLabel(context.event_type.toUpperCase());
  const entryQuery = context.entry_id
    ? `?entry=${encodeURIComponent(context.entry_id)}`
    : "";
  const href =
    getCompetitionRoute(context.wave_id, context.competition_id) + entryQuery;
  return (
    <div className="tw-space-y-2 tw-py-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, `competitions.notification.${label}`)}{" "}
        <NotificationTimestamp createdAt={notification.created_at} />
      </p>
      <Link
        href={href}
        className="tw-break-words tw-rounded tw-font-semibold tw-text-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {context.competition_title}
      </Link>
    </div>
  );
}

const EVENT_LABELS = {
  COMPETITION_PUBLISHED: "published",
  COMPETITION_CANCELLED: "cancelled",
  COMPETITION_ENDED: "ended",
  COMPETITION_SCHEDULE_CHANGED: "updated",
  COMPETITION_PAUSED: "paused",
  COMPETITION_RESUMED: "resumed",
  COMPETITION_STARTED: "updated",
  COMPETITION_DECISION_COMPLETED: "winners",
  COMPETITION_UPDATED: "updated",
  ENTRY_DISQUALIFIED: "disqualified",
} as const;

function getEventLabel(event: string) {
  return Object.hasOwn(EVENT_LABELS, event)
    ? EVENT_LABELS[event as keyof typeof EVENT_LABELS]
    : "updated";
}
