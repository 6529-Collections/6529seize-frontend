import Link from "next/link";
import type { INotificationCompetitionLifecycle } from "@/types/feed.types";
import { getCompetitionRoute } from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { tRich } from "@/i18n/messages";
import { TrophyIcon } from "@heroicons/react/24/outline";
import NotificationTimestamp from "./subcomponents/NotificationTimestamp";

export default function NotificationCompetitionLifecycle({
  notification,
}: {
  readonly notification: INotificationCompetitionLifecycle;
}) {
  const locale = useBrowserLocale();
  const context = notification.additional_context;
  if (context.event_type.toUpperCase() !== "COMPETITION_DECISION_COMPLETED")
    return null;
  const entryQuery = context.entry_id
    ? `?entry=${encodeURIComponent(context.entry_id)}`
    : "";
  const href =
    getCompetitionRoute(context.wave_id, context.competition_id) + entryQuery;
  return (
    <div className="tailwind-scope tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-py-3">
      <div
        aria-hidden="true"
        className="tw-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-text-yellow-500"
      >
        <TrophyIcon className="tw-size-5" />
      </div>
      <div className="tw-min-w-0 tw-flex-1 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400 [overflow-wrap:anywhere]">
        {tRich(locale, "competitions.notification.resultsFor", {
          competition: (
            <Link
              key="competition"
              href={href}
              className="tw-rounded-sm tw-font-semibold tw-text-iron-50 tw-no-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline"
            >
              {context.competition_title}
            </Link>
          ),
        })}{" "}
        <NotificationTimestamp createdAt={notification.created_at} />
      </div>
    </div>
  );
}
