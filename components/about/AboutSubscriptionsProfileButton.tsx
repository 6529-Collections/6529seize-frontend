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
  "tw-inline-flex tw-h-10 tw-items-center tw-justify-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-ring-1 tw-ring-inset tw-ring-primary-400/50 tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-bg-primary-600";

export default function AboutSubscriptionsProfileButton() {
  const capacitor = useCapacitor();
  const cookieConsent = useOptionalCookieConsent();
  const locale = useBrowserLocale();
  const { openProfileSubscriptions, profileSubscriptionsHref } =
    useProfileSubscriptionsNavigation();
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

  if (!profileSubscriptionsHref) {
    return (
      <button
        type="button"
        onClick={() => {
          void openProfileSubscriptions();
        }}
        className={`${PROFILE_SUBSCRIPTIONS_BUTTON_CLASS_NAME} disabled:tw-cursor-not-allowed disabled:tw-opacity-60`}
      >
        {t(locale, "home.mintSubscriptions.connectToSubscribe")}
      </button>
    );
  }

  return (
    <Link
      href={profileSubscriptionsHref}
      className={`${PROFILE_SUBSCRIPTIONS_BUTTON_CLASS_NAME} tw-no-underline desktop-hover:hover:tw-text-white`}
    >
      {t(locale, "home.mintSubscriptions.manageSubscriptionsLink")}
      <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
    </Link>
  );
}
