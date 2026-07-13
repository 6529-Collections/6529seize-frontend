"use client";

import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { useProfileSubscriptionsNavigation } from "@/components/user/subscriptions/useProfileSubscriptionsNavigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const PROFILE_SUBSCRIPTIONS_BUTTON_CLASS_NAME =
  "tw-inline-flex tw-min-h-10 tw-max-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/60 tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-center tw-text-sm tw-font-semibold tw-leading-5 tw-text-white tw-shadow-sm tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-bg-primary-600";

type SubscriptionActionContext = "hero" | "final";

export default function AboutSubscriptionsProfileButton({
  actionContext,
  descriptiveLabels = false,
}: {
  readonly actionContext?: SubscriptionActionContext;
  readonly descriptiveLabels?: boolean;
}) {
  const capacitor = useCapacitor();
  const cookieConsent = useOptionalCookieConsent();
  const locale = useBrowserLocale();
  const {
    canNavigateToProfileSubscriptionsDirectly,
    isConnecting,
    openProfileSubscriptions,
    profileSubscriptionsHref,
  } = useProfileSubscriptionsNavigation();
  const hideSubscriptions =
    cookieConsent === undefined
      ? false
      : shouldHideSubscriptions({
          capacitorIsIos: capacitor.isIos,
          country: cookieConsent.country,
        });

  if (hideSubscriptions) {
    return null;
  }

  const handleOpenProfileSubscriptions = () => {
    openProfileSubscriptions().catch((error: unknown) => {
      console.error("Failed to open profile subscriptions", error);
    });
  };
  const manageSubscriptionsLabel = t(
    locale,
    descriptiveLabels
      ? "about.subscriptions.action.manage"
      : "home.mintSubscriptions.manageSubscriptionsLink"
  );
  const connectToSubscribeLabel = t(
    locale,
    descriptiveLabels
      ? "about.subscriptions.action.connect"
      : "home.mintSubscriptions.connectToSubscribe"
  );
  const contextualConnectLabel = actionContext
    ? t(
        locale,
        actionContext === "hero"
          ? "about.subscriptions.action.connectHero"
          : "about.subscriptions.action.connectFinal"
      )
    : undefined;
  const contextualManageLabel = actionContext
    ? t(
        locale,
        actionContext === "hero"
          ? "about.subscriptions.action.manageHero"
          : "about.subscriptions.action.manageFinal"
      )
    : undefined;

  if (!profileSubscriptionsHref) {
    return (
      <button
        type="button"
        disabled={isConnecting}
        onClick={handleOpenProfileSubscriptions}
        aria-label={contextualConnectLabel}
        className={`${PROFILE_SUBSCRIPTIONS_BUTTON_CLASS_NAME} disabled:tw-cursor-not-allowed disabled:tw-opacity-60`}
      >
        {connectToSubscribeLabel}
      </button>
    );
  }

  if (!canNavigateToProfileSubscriptionsDirectly) {
    return (
      <button
        type="button"
        disabled={isConnecting}
        onClick={handleOpenProfileSubscriptions}
        aria-label={contextualManageLabel}
        className={`${PROFILE_SUBSCRIPTIONS_BUTTON_CLASS_NAME} disabled:tw-cursor-not-allowed disabled:tw-opacity-60`}
      >
        {manageSubscriptionsLabel}
        <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <Link
      href={profileSubscriptionsHref}
      aria-label={contextualManageLabel}
      className={`${PROFILE_SUBSCRIPTIONS_BUTTON_CLASS_NAME} tw-no-underline desktop-hover:hover:tw-text-white`}
    >
      {manageSubscriptionsLabel}
      <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
    </Link>
  );
}
