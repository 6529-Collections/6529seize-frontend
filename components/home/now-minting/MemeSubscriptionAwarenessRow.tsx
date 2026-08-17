"use client";

import DotLoader from "@/components/dotLoader/DotLoader";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  ArrowRightIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useId, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import { ABOUT_SUBSCRIPTIONS_HREF } from "../../user/subscriptions/subscriptionNavigation";

function ReadonlySubscriptionToggle({
  checked,
  tooltipLabel,
}: Readonly<{
  checked: boolean;
  tooltipLabel: string;
}>) {
  const tooltipId = buildTooltipId("readonly-subscription-toggle", useId());

  return (
    <>
      <span
        aria-label={tooltipLabel}
        data-testid="readonly-subscription-toggle-trigger"
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipLabel}
        role="img"
        tabIndex={0}
        className="tw-inline-flex tw-shrink-0 tw-cursor-help tw-rounded-full focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      >
        <span
          aria-hidden="true"
          data-checked={checked ? "true" : "false"}
          data-testid="readonly-subscription-toggle-visual"
          className={clsx(
            "tw-pointer-events-none tw-inline-flex tw-h-5 tw-w-9 tw-items-center tw-rounded-full tw-p-0.5 tw-ring-1 tw-ring-inset tw-transition-colors",
            checked
              ? "tw-bg-primary-500 tw-shadow-[0_0_14px_rgba(64,106,254,0.35)] tw-ring-primary-300/70"
              : "tw-bg-black/35 tw-ring-primary-400/30"
          )}
        >
          <span
            data-testid="readonly-subscription-toggle-thumb"
            className={clsx(
              "tw-size-3.5 tw-rounded-full tw-ring-1 tw-ring-inset tw-transition-transform",
              checked
                ? "tw-translate-x-4 tw-bg-white tw-shadow-[0_1px_4px_rgba(0,0,0,0.55)] tw-ring-black/[15%]"
                : "tw-translate-x-0 tw-bg-iron-400 tw-shadow-sm tw-ring-black/10"
            )}
          />
        </span>
      </span>
      <Tooltip
        id={tooltipId}
        place="top"
        delayShow={150}
        offset={12}
        style={TOOLTIP_STYLES}
      />
      <output
        data-testid="readonly-subscription-toggle-status"
        className="tw-sr-only"
      >
        {tooltipLabel}
      </output>
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
  onClick?: (() => void | Promise<void>) | undefined;
}>) {
  const className =
    "tw-group/action tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-md tw-text-[10.5px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-[0.14em] tw-text-primary-300 tw-no-underline tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black disabled:tw-cursor-wait disabled:tw-opacity-60 motion-reduce:tw-transition-none";
  const handleClick = () => {
    Promise.resolve(onClick?.()).catch((error: unknown) => {
      console.error("Failed to open profile subscriptions", error);
    });
  };

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
      onClick={handleClick}
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
  const tooltipId = buildTooltipId("meme-subscription-info", useId());

  return (
    <>
      <Link
        href={href}
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
        className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-primary-300/70 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
      >
        {children}
      </Link>
      <Tooltip
        id={tooltipId}
        place="top"
        delayShow={250}
        offset={10}
        style={TOOLTIP_STYLES}
      />
    </>
  );
}

function SubscriptionsCountText({
  loading,
  safeSubscriptionsCount,
}: Readonly<{
  loading?: boolean | undefined;
  safeSubscriptionsCount?: number | undefined;
}>) {
  const locale = useBrowserLocale();
  const loadingText = t(locale, "home.mintSubscriptions.subscriptionsLoading");

  if (safeSubscriptionsCount !== undefined) {
    return (
      <>
        {safeSubscriptionsCount === 0
          ? t(locale, "home.mintSubscriptions.subscriptionsCount.none")
          : t(locale, "home.mintSubscriptions.subscriptionsCount.value", {
              count: formatNumber(locale, safeSubscriptionsCount, {
                maximumFractionDigits: 0,
              }),
              pluralSuffix: safeSubscriptionsCount > 1 ? "s" : "",
            })}
      </>
    );
  }

  if (loading) {
    return (
      <output
        aria-live="polite"
        aria-label={loadingText}
        className="tw-inline-flex tw-min-w-14 tw-items-center"
      >
        <span className="tw-sr-only">{loadingText}</span>
        <span
          aria-hidden="true"
          className="tw-inline-flex tw-origin-left tw-scale-75 tw-items-center"
        >
          <DotLoader />
        </span>
      </output>
    );
  }

  return null;
}

export default function MemeSubscriptionAwarenessRow({
  onProfileSubscriptionsAction,
  profileCoverageSummary,
  profileSubscriptionsActionLabel,
  profileSubscriptionsActionPending,
  profileSubscriptionsHref,
  subscribed,
  subscribedCount,
  subscriptionsCount,
  subscriptionsCountLoading,
  tooltipLabel,
}: Readonly<{
  onProfileSubscriptionsAction?: (() => void | Promise<void>) | undefined;
  profileCoverageSummary?: string | undefined;
  profileSubscriptionsActionLabel?: string | undefined;
  profileSubscriptionsActionPending?: boolean | undefined;
  profileSubscriptionsHref?: string | undefined;
  subscribed: boolean;
  subscribedCount?: number | undefined;
  subscriptionsCount?: number | undefined;
  subscriptionsCountLoading?: boolean | undefined;
  tooltipLabel: string;
}>) {
  const locale = useBrowserLocale();
  const safeSubscribedCount =
    subscribed && Number.isFinite(subscribedCount) && (subscribedCount ?? 0) > 0
      ? subscribedCount
      : undefined;
  const safeSubscriptionsCount =
    Number.isFinite(subscriptionsCount) && (subscriptionsCount ?? -1) >= 0
      ? subscriptionsCount
      : undefined;
  const actionLabel =
    profileSubscriptionsActionLabel ??
    t(
      locale,
      subscribed
        ? "home.mintSubscriptions.action.manage"
        : "home.mintSubscriptions.action.setUp"
    );
  return (
    <div className="tw-group tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-primary-400/25 tw-bg-primary-500/10 tw-p-5 tw-shadow-[0_15px_40px_rgba(0,0,0,0.38)]">
      <span
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-primary-400/[0.045] tw-opacity-0 tw-transition-opacity tw-duration-500 tw-ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 motion-reduce:tw-transition-none"
      />
      <div className="tw-relative tw-z-10 tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-x-4 tw-gap-y-3">
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <div className="tw-text-sm tw-font-semibold tw-leading-none tw-tracking-[-0.01em] tw-text-primary-300">
            {t(locale, "home.mintSubscriptions.awarenessLabel")}
          </div>
          <ReadonlySubscriptionToggle
            checked={subscribed}
            tooltipLabel={tooltipLabel}
          />
          {safeSubscribedCount !== undefined && (
            <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-leading-none tw-text-primary-300/70">
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
          onClick={onProfileSubscriptionsAction}
        >
          <span aria-hidden="true">{actionLabel}</span>
          <ArrowRightIcon
            className="tw-size-4 tw-transform-gpu tw-transition-transform tw-duration-300 tw-ease-out desktop-hover:group-hover/action:tw-translate-x-0.5 motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
            aria-hidden="true"
          />
        </SubscriptionAction>

        <div className="tw-flex tw-min-h-7 tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-text-xs tw-font-medium tw-leading-4 tw-text-primary-300/70">
          {profileCoverageSummary ? (
            <span className="tw-font-semibold tw-text-iron-200">
              {profileCoverageSummary}
            </span>
          ) : null}
          {profileCoverageSummary &&
          (safeSubscriptionsCount !== undefined ||
            subscriptionsCountLoading) ? (
            <span aria-hidden="true" className="tw-text-iron-600">
              ·
            </span>
          ) : null}
          <SubscriptionsCountText
            loading={subscriptionsCountLoading}
            safeSubscriptionsCount={safeSubscriptionsCount}
          />
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
