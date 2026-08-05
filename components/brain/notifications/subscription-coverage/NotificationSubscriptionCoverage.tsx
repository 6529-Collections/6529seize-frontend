import {
  formatSubscriptionCoverageDate,
  formatSubscriptionCoverageDeadline,
  formatSubscriptionEth,
  getFundedDropsLabel,
} from "@/components/user/subscriptions/coverage/subscriptionCoverage.helpers";
import { ApiSubscriptionCoverageStatus } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import type { INotificationSubscriptionCoverage } from "@/types/feed.types";
import { ArrowRightIcon, BellAlertIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";

function getMessageKey(status: ApiSubscriptionCoverageStatus): MessageKey {
  if (status === ApiSubscriptionCoverageStatus.ActionRequired) {
    return "subscriptions.notification.actionRequired";
  }
  if (status === ApiSubscriptionCoverageStatus.RunningLow) {
    return "subscriptions.notification.runningLow";
  }
  return "subscriptions.notification.earlyWarning";
}

export default function NotificationSubscriptionCoverage({
  notification,
}: Readonly<{
  notification: INotificationSubscriptionCoverage;
}>) {
  const locale = useBrowserLocale();
  const context = notification.additional_context;
  const isUrgent =
    context.status === ApiSubscriptionCoverageStatus.ActionRequired;
  const profileHref = `/${encodeURIComponent(
    context.profile_handle
  )}/subscriptions#profile-subscriptions-top-up`;
  const runwayText = context.funded_through
    ? t(locale, "subscriptions.notification.through", {
        count: getFundedDropsLabel(locale, context.fully_funded_drops),
        token: formatInteger(locale, context.funded_through.token_id),
        date: formatSubscriptionCoverageDate(
          locale,
          context.funded_through.mint_at
        ),
      })
    : t(locale, "subscriptions.notification.noRunway", {
        count: getFundedDropsLabel(locale, context.fully_funded_drops),
      });

  return (
    <article className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/65 tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <span
          className={`tw-inline-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-full ${
            isUrgent
              ? "tw-bg-red-400/10 tw-text-red-200"
              : "tw-bg-amber-400/10 tw-text-amber-200"
          }`}
        >
          <BellAlertIcon className="tw-size-5" aria-hidden="true" />
        </span>
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {t(locale, "subscriptions.notification.title")}
            </h3>
            <NotificationTimestamp createdAt={notification.created_at} />
          </div>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-300">
            {t(locale, getMessageKey(context.status))}
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
            {runwayText}
          </p>
          {context.next_unfunded ? (
            <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
              {context.top_up_deadline
                ? t(locale, "subscriptions.notification.topUpBy", {
                    deadline: formatSubscriptionCoverageDeadline(
                      locale,
                      context.top_up_deadline
                    ),
                    token: formatInteger(
                      locale,
                      context.next_unfunded.token_id
                    ),
                  })
                : t(locale, "subscriptions.notification.nextUnfunded", {
                    token: formatInteger(
                      locale,
                      context.next_unfunded.token_id
                    ),
                    date: formatSubscriptionCoverageDate(
                      locale,
                      context.next_unfunded.mint_at
                    ),
                  })}
            </p>
          ) : null}
          <div className="tw-mt-3">
            <Link
              href={profileHref}
              prefetch={false}
              className="tw-inline-flex tw-min-h-9 tw-items-center tw-gap-1.5 tw-rounded-lg tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 desktop-hover:hover:tw-bg-primary-400"
            >
              {context.minimum_top_up_eth
                ? t(locale, "subscriptions.topUp.submit", {
                    amount: formatSubscriptionEth(
                      locale,
                      context.minimum_top_up_eth
                    ),
                  })
                : t(locale, "subscriptions.coverage.action.topUp")}
              <ArrowRightIcon className="tw-size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
