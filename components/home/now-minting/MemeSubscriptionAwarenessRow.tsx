"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  ArrowRightIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useId, type MouseEventHandler, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import { ABOUT_SUBSCRIPTIONS_HREF } from "../../user/subscriptions/subscriptionNavigation";

const SUBSCRIPTION_ROW_CLASS_NAME =
  "tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/45 tw-bg-primary-500/10 tw-px-4 tw-py-3";

const SUBSCRIPTION_TOOLTIP_STYLE = {
  background: "#1C1C21",
  border: "1px solid rgba(132, 173, 255, 0.35)",
  borderRadius: "8px",
  boxShadow: "0 16px 32px rgba(0, 0, 0, 0.36)",
  color: "#F5F5F5",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.35,
  maxWidth: "min(20rem, calc(100vw - 2rem))",
  padding: "6px 10px",
  pointerEvents: "none" as const,
  textAlign: "center" as const,
  whiteSpace: "normal" as const,
  zIndex: 99999,
} as const;

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
        role="switch"
        aria-checked={checked}
        aria-disabled="true"
        aria-label={tooltipLabel}
        tabIndex={0}
        className="tw-inline-flex tw-shrink-0 tw-cursor-help tw-rounded-full focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
      >
        <span
          aria-hidden="true"
          className={clsx(
            "tw-inline-flex tw-h-6 tw-w-12 tw-cursor-default tw-items-center tw-rounded-full tw-p-0.5 tw-ring-1 tw-ring-inset tw-transition-colors",
            checked
              ? "tw-bg-primary-500 tw-shadow-sm tw-ring-primary-300/80"
              : "tw-bg-black/35 tw-opacity-80 tw-ring-primary-400/25"
          )}
        >
          <span
            className={clsx(
              "tw-size-5 tw-rounded-full tw-shadow-sm tw-transition-transform",
              checked
                ? "tw-translate-x-6 tw-bg-iron-50"
                : "tw-translate-x-0 tw-bg-iron-500"
            )}
          />
        </span>
      </span>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={12}
        opacity={1}
        style={SUBSCRIPTION_TOOLTIP_STYLE}
      />
    </>
  );
}

function SubscriptionAction({
  children,
  disabled,
  href,
  label,
  onClick,
}: Readonly<{
  children: ReactNode;
  href?: string | undefined;
  label: string;
  disabled?: boolean | undefined;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
}>) {
  const className =
    "tw-inline-flex tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-md tw-text-sm tw-font-semibold tw-leading-none tw-text-primary-300 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-primary-200 disabled:tw-cursor-wait disabled:tw-opacity-60";

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`${className} tw-border-0 tw-bg-transparent tw-p-0`}
    >
      {children}
    </button>
  );
}

function SubscriptionInfoLink({
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
  onProfileSubscriptionsAction,
  profileSubscriptionsActionPending,
  profileSubscriptionsHref,
  subscribed,
  subscribedCount,
  subscribersCount,
  subscribersCountLoading,
  tooltipLabel,
}: Readonly<{
  onProfileSubscriptionsAction?: (() => void | Promise<void>) | undefined;
  profileSubscriptionsActionPending?: boolean | undefined;
  profileSubscriptionsHref?: string | undefined;
  subscribed: boolean;
  subscribedCount?: number | undefined;
  subscribersCount?: number | undefined;
  subscribersCountLoading?: boolean | undefined;
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
  const actionLabel = t(
    locale,
    subscribed
      ? "home.mintSubscriptions.action.manage"
      : "home.mintSubscriptions.action.setUp"
  );

  return (
    <div className={SUBSCRIPTION_ROW_CLASS_NAME}>
      <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-x-4 tw-gap-y-3">
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <div className="tw-font-semibold tw-leading-none tw-text-primary-300">
            {t(locale, "home.mintSubscriptions.awarenessLabel")}
          </div>
          <ReadonlySubscriptionToggle
            checked={subscribed}
            tooltipLabel={tooltipLabel}
          />
          {safeSubscribedCount !== undefined && (
            <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-leading-none tw-text-primary-300/75">
              x
              {formatNumber(locale, safeSubscribedCount, {
                maximumFractionDigits: 0,
              })}
            </span>
          )}
        </div>

        <SubscriptionAction
          disabled={profileSubscriptionsActionPending}
          href={profileSubscriptionsHref}
          label={actionLabel}
          onClick={
            onProfileSubscriptionsAction
              ? () => {
                  void onProfileSubscriptionsAction();
                }
              : undefined
          }
        >
          <span aria-hidden="true">{actionLabel}</span>
          <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
        </SubscriptionAction>

        <div className="tw-flex tw-min-h-7 tw-min-w-0 tw-items-center tw-text-xs tw-leading-4 tw-text-primary-300/70">
          {safeSubscribersCount !== undefined ? (
            t(locale, "home.mintSubscriptions.subscribersCount", {
              count: formatNumber(locale, safeSubscribersCount, {
                maximumFractionDigits: 0,
              }),
            })
          ) : subscribersCountLoading ? (
            <span
              aria-label={t(
                locale,
                "home.mintSubscriptions.subscribersLoading"
              )}
              role="status"
              className="tw-inline-flex tw-items-center"
            >
              <span
                aria-hidden="true"
                className="tw-size-1.5 tw-animate-pulse tw-rounded-full tw-bg-primary-300/70"
              />
            </span>
          ) : null}
        </div>
        <div className="tw-flex tw-min-h-7 tw-items-center tw-justify-end">
          <SubscriptionInfoLink
            href={ABOUT_SUBSCRIPTIONS_HREF}
            label={t(locale, "home.mintSubscriptions.infoLinkAriaLabel")}
          >
            <QuestionMarkCircleIcon className="tw-size-5" aria-hidden="true" />
          </SubscriptionInfoLink>
        </div>
      </div>
    </div>
  );
}
