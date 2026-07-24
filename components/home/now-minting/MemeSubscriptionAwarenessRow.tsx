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

const SUBSCRIPTION_ROW_CLASS_NAME = "tw-border tw-border-solid";

function ReadonlySubscriptionToggle({
  checked,
  featured,
  tooltipLabel,
}: Readonly<{
  checked: boolean;
  featured: boolean;
  tooltipLabel: string;
}>) {
  const tooltipId = buildTooltipId("readonly-subscription-toggle", useId());

  return (
    <>
      <span
        data-testid="readonly-subscription-toggle-trigger"
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipLabel}
        className="tw-inline-flex tw-shrink-0 tw-cursor-default tw-rounded-full"
      >
        <span
          aria-hidden="true"
          data-checked={checked ? "true" : "false"}
          data-testid="readonly-subscription-toggle-visual"
          className={clsx(
            "tw-pointer-events-none tw-inline-flex tw-items-center tw-rounded-full tw-p-0.5 tw-ring-1 tw-ring-inset tw-transition-colors",
            featured ? "tw-h-5 tw-w-9" : "tw-h-5 tw-w-10 md:tw-h-6 md:tw-w-12",
            checked &&
              (featured
                ? "tw-bg-primary-500 tw-shadow-[0_0_14px_rgba(64,106,254,0.35)] tw-ring-primary-300/70"
                : "tw-bg-primary-500 tw-shadow-[0_0_14px_rgba(74,119,255,0.45)] tw-ring-primary-300"),
            !checked &&
              (featured
                ? "tw-bg-black/35 tw-ring-primary-400/30"
                : "tw-bg-black/35 tw-opacity-80 tw-ring-primary-400/25")
          )}
        >
          <span
            className={clsx(
              "tw-rounded-full tw-shadow-sm tw-transition-transform",
              featured ? "tw-size-3.5" : "tw-size-4 md:tw-size-5",
              checked &&
                (featured
                  ? "tw-bg-primary-200 tw-translate-x-4"
                  : "tw-translate-x-5 tw-bg-white md:tw-translate-x-6"),
              !checked &&
                (featured
                  ? "tw-translate-x-0 tw-bg-iron-400"
                  : "tw-translate-x-0 tw-bg-iron-500")
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
  featured,
  href,
  label,
  onClick,
}: Readonly<{
  children: ReactNode;
  href?: string | undefined;
  label: string;
  disabled?: boolean | undefined;
  featured: boolean;
  onClick?: (() => void | Promise<void>) | undefined;
}>) {
  const className = clsx(
    "tw-group/action tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-md tw-font-semibold tw-leading-none tw-no-underline tw-transition-colors tw-duration-300 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black disabled:tw-cursor-wait disabled:tw-opacity-60 motion-reduce:tw-transition-none",
    featured
      ? "tw-text-[10.5px] tw-uppercase tw-tracking-[0.14em] tw-text-primary-300 desktop-hover:hover:tw-text-white"
      : "desktop-hover:hover:tw-text-primary-200 tw-text-xs tw-text-primary-300 md:tw-text-sm"
  );
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
  featured,
  href,
  label,
}: Readonly<{
  children: ReactNode;
  featured: boolean;
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
        className={clsx(
          "tw-inline-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black",
          featured
            ? "desktop-hover:hover:tw-text-primary-200 tw-text-primary-300/70"
            : "tw-text-primary-300 desktop-hover:hover:tw-text-primary-400"
        )}
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

function SubscribersCountText({
  loading,
  safeSubscribersCount,
}: Readonly<{
  loading?: boolean | undefined;
  safeSubscribersCount?: number | undefined;
}>) {
  const locale = useBrowserLocale();
  const loadingText = t(locale, "home.mintSubscriptions.subscribersLoading");

  if (safeSubscribersCount !== undefined) {
    return (
      <>
        {t(locale, "home.mintSubscriptions.subscribersCount", {
          count: formatNumber(locale, safeSubscribersCount, {
            maximumFractionDigits: 0,
          }),
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
  appearance = "default",
  onProfileSubscriptionsAction,
  profileSubscriptionsActionPending,
  profileSubscriptionsHref,
  subscribed,
  subscribedCount,
  subscribersCount,
  subscribersCountLoading,
  tooltipLabel,
}: Readonly<{
  appearance?: "default" | "featured" | "quiet" | undefined;
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
  const isFeatured = appearance === "featured";

  return (
    <div
      className={clsx(
        SUBSCRIPTION_ROW_CLASS_NAME,
        isFeatured
          ? "tw-group tw-relative tw-overflow-hidden tw-rounded-2xl tw-border-primary-400/25 tw-bg-primary-500/10 tw-p-5 tw-shadow-[0_15px_40px_rgba(0,0,0,0.38)]"
          : "tw-rounded-lg tw-px-3 tw-py-3 md:tw-px-4",
        appearance === "quiet" && "tw-border-white/5 tw-bg-iron-900/60",
        appearance === "default" &&
          "tw-border-primary-400/45 tw-bg-primary-500/10"
      )}
    >
      {isFeatured && (
        <span
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-primary-400/[0.045] tw-opacity-0 tw-transition-opacity tw-duration-500 tw-ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 motion-reduce:tw-transition-none"
        />
      )}
      <div
        className={clsx(
          "tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-x-4 tw-gap-y-3",
          isFeatured && "tw-relative tw-z-10"
        )}
      >
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <div
            className={clsx(
              "tw-text-sm tw-leading-none",
              isFeatured
                ? "tw-font-semibold tw-tracking-[-0.01em] tw-text-primary-300"
                : "tw-font-semibold tw-text-primary-300 md:tw-text-base"
            )}
          >
            {t(locale, "home.mintSubscriptions.awarenessLabel")}
          </div>
          <ReadonlySubscriptionToggle
            checked={subscribed}
            featured={isFeatured}
            tooltipLabel={tooltipLabel}
          />
          {safeSubscribedCount !== undefined && (
            <span
              className={clsx(
                "tw-whitespace-nowrap tw-text-xs tw-font-medium tw-leading-none",
                isFeatured
                  ? "tw-text-primary-300/70"
                  : "tw-text-primary-300/75 md:tw-text-sm"
              )}
            >
              x
              {formatNumber(locale, safeSubscribedCount, {
                maximumFractionDigits: 0,
              })}
            </span>
          )}
        </div>

        <SubscriptionAction
          disabled={profileSubscriptionsActionPending}
          featured={isFeatured}
          href={profileSubscriptionsHref}
          label={actionLabel}
          onClick={onProfileSubscriptionsAction}
        >
          <span aria-hidden="true">{actionLabel}</span>
          <ArrowRightIcon
            className={clsx(
              "tw-size-4",
              isFeatured &&
                "tw-transform-gpu tw-transition-transform tw-duration-300 tw-ease-out desktop-hover:group-hover/action:tw-translate-x-0.5 motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
            )}
            aria-hidden="true"
          />
        </SubscriptionAction>

        <div
          className={clsx(
            "tw-flex tw-min-h-7 tw-min-w-0 tw-items-center tw-text-xs tw-leading-4",
            isFeatured
              ? "tw-font-medium tw-text-primary-300/70"
              : "tw-text-primary-300/70 md:tw-text-sm"
          )}
        >
          <SubscribersCountText
            loading={subscribersCountLoading}
            safeSubscribersCount={safeSubscribersCount}
          />
        </div>
        <div className="tw-flex tw-min-h-7 tw-items-center tw-justify-end">
          <SubscriptionInfoLink
            featured={isFeatured}
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
