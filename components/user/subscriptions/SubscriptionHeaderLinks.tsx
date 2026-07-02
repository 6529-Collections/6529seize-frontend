"use client";

import EthereumIcon from "@/components/user/utils/icons/EthereumIcon";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

type SubscriptionHeaderLabelKey = Extract<
  MessageKey,
  | "home.mintSubscriptions.subscribeLabel"
  | "home.mintSubscriptions.subscribedLabel"
>;

export function SubscriptionBalanceLabel({
  balanceLabel,
}: Readonly<{
  balanceLabel: string;
}>) {
  const locale = useBrowserLocale();

  return (
    <span className="tw-flex tw-items-center tw-gap-1 tw-text-sm tw-leading-none tw-text-iron-400">
      <span className="tw-leading-none">
        {t(locale, "home.mintSubscriptions.balanceLabel")}
      </span>
      <span className="tw-leading-none tw-text-iron-300">{balanceLabel}</span>
      <span className="tw-flex tw-size-3.5 tw-items-center tw-justify-center tw-self-center tw-text-iron-400">
        <EthereumIcon />
      </span>
    </span>
  );
}

function SubscriptionInfoLink({
  className = "",
  href,
}: Readonly<{
  className?: string;
  href: string;
}>) {
  const locale = useBrowserLocale();

  return (
    <Link
      href={href}
      aria-label={t(locale, "home.mintSubscriptions.infoLinkAriaLabel")}
      className={`tw-inline-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-iron-400 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-iron-200 ${className}`}
    >
      <QuestionMarkCircleIcon className="tw-size-5" aria-hidden="true" />
    </Link>
  );
}

export default function SubscriptionHeaderLinks({
  children,
  infoHref,
  labelKey,
  profileSubscriptionsHref,
}: Readonly<{
  children?: ReactNode;
  infoHref?: string | undefined;
  labelKey: SubscriptionHeaderLabelKey;
  profileSubscriptionsHref?: string | undefined;
}>) {
  const locale = useBrowserLocale();

  return (
    <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-leading-none">
      <span className="tw-font-medium tw-leading-none">
        {t(locale, labelKey)}
      </span>
      {infoHref && (
        <SubscriptionInfoLink href={infoHref} className="-tw-my-0.5" />
      )}
      {children}
      {profileSubscriptionsHref && (
        <Link
          href={profileSubscriptionsHref}
          className="tw-text-sm tw-leading-none tw-text-iron-400 tw-no-underline tw-transition-colors desktop-hover:hover:tw-text-iron-200"
        >
          {t(locale, "home.mintSubscriptions.profileSubscriptionsLink")}
        </Link>
      )}
    </span>
  );
}
