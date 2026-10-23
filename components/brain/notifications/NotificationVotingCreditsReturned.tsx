import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { getCompetitionRoute } from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { tRich } from "@/i18n/messages";
import type { INotificationVotingCreditsReturned } from "@/types/feed.types";
import NotificationTimestamp from "./subcomponents/NotificationTimestamp";

const LINK_CLASS =
  "tw-rounded-sm tw-font-semibold tw-text-iron-50 tw-no-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline";

export default function NotificationVotingCreditsReturned({
  notification,
}: {
  readonly notification: INotificationVotingCreditsReturned;
}) {
  const locale = useBrowserLocale();
  const context = notification.additional_context;
  const route = getCompetitionRoute(context.wave_id, context.competition_id);
  const won = context.reason === "WIN";
  const key =
    `notifications.creditReturn.${won ? "win" : "deleted"}.${context.amount === 1 ? "one" : "many"}` as const;
  const submission = won ? (
    <Link
      key="submission"
      href={`${route}?entry=${encodeURIComponent(context.entry_id)}`}
      className={LINK_CLASS}
    >
      {context.submission_title}
    </Link>
  ) : (
    <span key="submission" className="tw-font-semibold tw-text-iron-50">
      {context.submission_title}
    </span>
  );
  return (
    <div className="tailwind-scope tw-flex tw-min-w-0 tw-items-start tw-gap-3 tw-py-3">
      <div
        aria-hidden="true"
        className="tw-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-text-primary-400"
      >
        <ArrowUturnLeftIcon className="tw-size-5" />
      </div>
      <div className="tw-min-w-0 tw-flex-1 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400 [overflow-wrap:anywhere]">
        {tRich(locale, key, {
          submission,
          competition: (
            <Link key="competition" href={route} className={LINK_CLASS}>
              {context.competition_title}
            </Link>
          ),
          amount: formatNumber(locale, context.amount),
        })}{" "}
        <NotificationTimestamp createdAt={notification.created_at} />
      </div>
    </div>
  );
}
