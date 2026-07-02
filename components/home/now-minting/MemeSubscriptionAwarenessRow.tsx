"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  ArrowTopRightOnSquareIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import { ABOUT_SUBSCRIPTIONS_HREF } from "../../user/subscriptions/subscriptionNavigation";

const SUBSCRIPTION_ROW_CLASS_NAME =
  "tw-mt-4 tw-border-x-0 tw-border-y tw-border-solid tw-border-primary-400/45 tw-bg-primary-500/10 tw-px-4 tw-py-3";

function ReadonlySubscriptionToggle({
  checked,
  tooltipLabel,
}: Readonly<{
  checked: boolean;
  tooltipLabel: string;
}>) {
  const tooltipId = `subscription-awareness-${useId().replaceAll(":", "")}`;

  return (
    <>
      <span
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipLabel}
        className="tw-inline-flex tw-shrink-0"
      >
        <span
          role="switch"
          aria-checked={checked}
          aria-disabled="true"
          aria-label={tooltipLabel}
          tabIndex={0}
          className={clsx(
            "tw-inline-flex tw-h-6 tw-w-12 tw-cursor-not-allowed tw-items-center tw-rounded-full tw-p-0.5 tw-ring-1 tw-ring-inset tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black",
            checked
              ? "tw-bg-primary-500/40 tw-ring-primary-300/45"
              : "tw-bg-black/35 tw-ring-primary-400/25"
          )}
        >
          <span
            className={clsx(
              "tw-size-5 tw-rounded-full tw-transition-transform",
              checked
                ? "tw-translate-x-6 tw-bg-primary-300"
                : "tw-translate-x-0 tw-bg-iron-500"
            )}
          />
        </span>
      </span>
      <Tooltip id={tooltipId} place="top" />
    </>
  );
}

function SubscriptionIconLink({
  children,
  href,
  label,
}: Readonly<{
  children: ReactNode;
  href: string;
  label: string;
}>) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="tw-inline-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-primary-300 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-primary-400"
    >
      {children}
    </Link>
  );
}

export default function MemeSubscriptionAwarenessRow({
  profileSubscriptionsHref,
  subscribed,
  subscribedCount,
  subscribersCount,
  tooltipLabel,
}: Readonly<{
  profileSubscriptionsHref?: string | undefined;
  subscribed: boolean;
  subscribedCount?: number | undefined;
  subscribersCount?: number | undefined;
  tooltipLabel: string;
}>) {
  const locale = useBrowserLocale();
  const safeSubscribedCount =
    subscribed && Number.isFinite(subscribedCount) && (subscribedCount ?? 0) > 0
      ? subscribedCount
      : undefined;
  const safeSubscribersCount =
    Number.isFinite(subscribersCount) && (subscribersCount ?? -1) >= 0
      ? subscribersCount
      : undefined;

  return (
    <div className={SUBSCRIPTION_ROW_CLASS_NAME}>
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-font-semibold tw-leading-none tw-text-primary-300">
            {t(locale, "home.mintSubscriptions.subscribedLabel")}
          </div>
          {safeSubscribersCount !== undefined && (
            <div className="tw-mt-2 tw-text-xs tw-leading-4 tw-text-primary-300/70">
              {t(locale, "home.mintSubscriptions.subscribersCount", {
                count: formatNumber(locale, safeSubscribersCount, {
                  maximumFractionDigits: 0,
                }),
              })}
            </div>
          )}
        </div>

        <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
          {safeSubscribedCount !== undefined && (
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-leading-none tw-text-primary-300/75">
              {formatNumber(locale, safeSubscribedCount, {
                maximumFractionDigits: 0,
              })}
              x
            </span>
          )}
          <ReadonlySubscriptionToggle
            checked={subscribed}
            tooltipLabel={tooltipLabel}
          />
          {profileSubscriptionsHref && (
            <SubscriptionIconLink
              href={profileSubscriptionsHref}
              label={t(
                locale,
                "home.mintSubscriptions.profileSubscriptionsLink"
              )}
            >
              <ArrowTopRightOnSquareIcon
                className="tw-size-5"
                aria-hidden="true"
              />
            </SubscriptionIconLink>
          )}
          <SubscriptionIconLink
            href={ABOUT_SUBSCRIPTIONS_HREF}
            label={t(locale, "home.mintSubscriptions.infoLinkAriaLabel")}
          >
            <QuestionMarkCircleIcon className="tw-size-5" aria-hidden="true" />
          </SubscriptionIconLink>
        </div>
      </div>
    </div>
  );
}
