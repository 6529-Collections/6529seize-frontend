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
  "tw-inline-flex tw-max-w-full tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/60 tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-leading-5 tw-text-white tw-shadow-sm tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-bg-primary-600";

export default function AboutSubscriptionsProfileButton() {
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
    "home.mintSubscriptions.manageSubscriptionsLink"
  );

  if (!profileSubscriptionsHref) {
    return (
      <button
        type="button"
        disabled={isConnecting}
        onClick={handleOpenProfileSubscriptions}
        className={`${PROFILE_SUBSCRIPTIONS_BUTTON_CLASS_NAME} disabled:tw-cursor-not-allowed disabled:tw-opacity-60`}
      >
        {t(locale, "home.mintSubscriptions.connectToSubscribe")}
      </button>
    );
  }

  if (!canNavigateToProfileSubscriptionsDirectly) {
    return (
      <button
        type="button"
        disabled={isConnecting}
        onClick={handleOpenProfileSubscriptions}
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
      className={`${PROFILE_SUBSCRIPTIONS_BUTTON_CLASS_NAME} tw-no-underline desktop-hover:hover:tw-text-white`}
    >
      {manageSubscriptionsLabel}
      <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
    </Link>
  );
}
