import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import { getCompetitionRoute } from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
import type { INotificationArtistArtwork } from "@/types/feed.types";
import NotificationTimestamp from "./subcomponents/NotificationTimestamp";

export default function NotificationArtistArtwork({
  notification,
}: {
  readonly notification: INotificationArtistArtwork;
}) {
  const locale = useBrowserLocale();
  const context = notification.additional_context;
  const title = context.artwork_title?.trim() ?? "";
  const artworkLabel =
    title.length > 0 ? title : t(locale, "artworkAlerts.untitled");
  const href = `${getCompetitionRoute(context.wave_id, context.competition_id)}?entry=${encodeURIComponent(context.entry_id)}`;
  const linkClass =
    "tw-rounded-sm tw-font-semibold tw-text-iron-50 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";
  return (
    <div className="tailwind-scope tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-py-3">
      <BellIcon
        className="tw-size-5 tw-shrink-0 tw-text-iron-400"
        aria-hidden="true"
      />
      <div className="tw-min-w-0 tw-flex-1 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400 [overflow-wrap:anywhere]">
        {tRich(locale, "artworkAlerts.notification", {
          artist: notification.related_identity.handle,
          artwork: (
            <Link key="artwork" href={href} className={linkClass}>
              {artworkLabel}
            </Link>
          ),
          competition: context.competition_title,
        })}{" "}
        <NotificationTimestamp createdAt={notification.created_at} />
      </div>
    </div>
  );
}
